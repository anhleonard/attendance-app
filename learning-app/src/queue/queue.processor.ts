import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { AttendancesService } from 'src/attendances/attendances.service';

@Processor('attendance-queue')
export class AttendanceProcessor extends WorkerHost {
  constructor(
    private readonly attendancesService: AttendancesService,
    @InjectRedis() private readonly redis: Redis,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    try {
      switch (job.name) {
        case 'createAttendance': {
          const { studentAttendance, createdBy, batchId, lockKey, counterKey } =
            job.data;

          // Check if batch lock still exists (batch not cancelled)
          const lockExists = await this.redis.exists(lockKey);
          if (!lockExists) {
            return { skipped: true, reason: 'Batch lock expired or cancelled' };
          }

          // Process the attendance
          const result = await this.attendancesService.createAttendance(
            studentAttendance,
            createdBy,
          );

          // Decrement counter and check if all jobs are done
          await this.decrementAndCheckCompletion(batchId, lockKey, counterKey);

          return result;
        }

        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);

      // Even on error, we need to decrement the counter
      const { batchId, lockKey, counterKey } = job.data;
      if (batchId && lockKey && counterKey) {
        await this.decrementAndCheckCompletion(
          batchId,
          lockKey,
          counterKey,
          true,
        );
      }

      throw error; // Re-throw to mark job as failed
    }
  }

  /**
   * Decrement counter atomically and release lock if all jobs are done
   */
  private async decrementAndCheckCompletion(
    batchId: string,
    lockKey: string,
    counterKey: string,
    isError: boolean = false,
  ): Promise<void> {
    try {
      // Use Redis transaction to ensure atomicity
      const multi = this.redis.multi();
      multi.decr(counterKey);
      multi.get(counterKey);

      const results = await multi.exec();

      if (!results) {
        console.error(
          `❌ Failed to execute Redis transaction for batch ${batchId}`,
        );
        return;
      }

      const remainingJobs = parseInt(results[1][1] as string) || 0;

      // If all jobs are processed (success or failed), release the lock
      if (remainingJobs <= 0) {
        await this.releaseBatchLock(batchId, lockKey, counterKey);

        // Optional: Emit event or call callback when batch is complete
        await this.onBatchComplete(batchId);
      }
    } catch (error) {
      console.error(
        `❌ Error in decrementAndCheckCompletion for batch ${batchId}:`,
        error,
      );
    }
  }

  /**
   * Release batch lock and cleanup
   */
  private async releaseBatchLock(
    batchId: string,
    lockKey: string,
    counterKey: string,
  ): Promise<void> {
    try {
      // Delete both lock and counter keys
      await this.redis.del(lockKey, counterKey);
    } catch (error) {
      console.error(`❌ Error releasing lock for batch ${batchId}:`, error);
    }
  }

  /**
   * Optional: Handle batch completion (emit events, notifications, etc.)
   */
  private async onBatchComplete(batchId: string): Promise<void> {
    try {
      // You can add custom logic here:
      // - Send notification
      // - Update database status
      // - Emit events
      // - Log to analytics

      // Example: Store completion status
      await this.redis.set(
        `batch-completed:${batchId}`,
        JSON.stringify({
          completedAt: new Date().toISOString(),
          status: 'completed',
        }),
        'EX',
        86400, // Keep for 24 hours
      );
    } catch (error) {
      console.error(`❌ Error in onBatchComplete for batch ${batchId}:`, error);
    }
  }

  /**
   * Optional: Get batch processing statistics
   */
  async getBatchStats(batchId: string): Promise<any> {
    const lockKey = `attendance-batch-lock:${batchId}`;
    const counterKey = `attendance-batch-counter:${batchId}`;
    const completedKey = `batch-completed:${batchId}`;

    const [lockExists, remainingJobs, completedInfo] = await Promise.all([
      this.redis.exists(lockKey),
      this.redis.get(counterKey),
      this.redis.get(completedKey),
    ]);

    return {
      batchId,
      isActive: !!lockExists,
      remainingJobs: remainingJobs ? parseInt(remainingJobs) : 0,
      isCompleted: !!completedInfo,
      completedInfo: completedInfo ? JSON.parse(completedInfo) : null,
    };
  }
}
