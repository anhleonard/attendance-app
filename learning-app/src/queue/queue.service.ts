import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { TokenPayload } from 'src/auth/token-payload/token-payload.auth';
import { CreateAttendance } from 'src/utils/interfaces';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('attendance-queue') private attendanceQueue: Queue,
    @InjectRedis() private redis: Redis, // Inject Redis client
  ) {}

  async processAttendances(
    studentAttendances: CreateAttendance[],
    user: TokenPayload,
  ) {
    // Create a shared lock key for this batch
    const batchId = this.generateBatchId(studentAttendances);
    const lockKey = `attendance-batch-lock:${batchId}`;
    const counterKey = `attendance-batch-counter:${batchId}`;

    console.log(`🔐 Creating shared lock: ${lockKey}`);

    // Check if this batch is already being processed
    const existingLock = await this.redis.get(lockKey);
    if (existingLock) {
      console.log(`⚠️  Batch ${batchId} is already being processed`);
      return {
        batchId,
        message: 'Batch is already being processed',
        isSkipped: true,
      };
    }

    // Set lock and counter
    const totalJobs = studentAttendances.length;
    await this.redis
      .multi()
      .set(lockKey, 'processing', 'EX', 3600) // Lock for 1 hour max
      .set(counterKey, totalJobs.toString(), 'EX', 3600)
      .exec();

    console.log(`🔒 Lock set for batch ${batchId} with ${totalJobs} jobs`);

    // Create jobs for attendance queue
    const attendanceJobs = studentAttendances.map((studentAttendance) => {
      const learningDate = new Date(studentAttendance.learningDate);
      const formattedDate = `${learningDate.getDate().toString().padStart(2, '0')}${(learningDate.getMonth() + 1).toString().padStart(2, '0')}${learningDate.getFullYear()}`;
      const uniqueJobId = `student-${studentAttendance.studentId}-session-${studentAttendance.sessionId}-date-${formattedDate}`;

      console.log(`🔍 Creating job with uniqueJobId: ${uniqueJobId}`);

      const jobObject = {
        name: 'createAttendance',
        data: {
          studentAttendance,
          createdBy: user,
          batchId, // Include batch ID in job data
          lockKey,
          counterKey,
        },
        jobId: uniqueJobId,
      };

      return jobObject;
    });

    try {
      // Push all jobs into queue simultaneously
      const results = await this.attendanceQueue.addBulk(attendanceJobs);

      // Log results
      const successfulJobs = results.filter((job) => job !== null);
      const skippedJobs = results.filter((job) => job === null);

      console.log(`Queue processing results for batch ${batchId}:`);
      console.log(`- Total jobs: ${attendanceJobs.length}`);
      console.log(`- Successfully added: ${successfulJobs.length}`);
      console.log(`- Skipped (duplicates): ${skippedJobs.length}`);

      // If no jobs were added, release the lock
      if (successfulJobs.length === 0) {
        await this.releaseBatchLock(batchId);
        console.log(`🔓 Released lock for batch ${batchId} - no jobs added`);
      }

      return {
        batchId,
        totalJobs: attendanceJobs.length,
        addedJobs: successfulJobs.length,
        skippedJobs: skippedJobs.length,
        lockKey,
        message: `Processed ${successfulJobs.length} jobs, skipped ${skippedJobs.length} duplicates`,
      };
    } catch (error) {
      // Release lock if error occurs
      await this.releaseBatchLock(batchId);
      console.error(`❌ Error processing batch ${batchId}:`, error);
      throw error;
    }
  }

  // Generate unique batch ID based on class, session, and learning date
  private generateBatchId(attendances: CreateAttendance[]): string {
    // Validate that all attendances are from same class, session, and date
    const firstAttendance = attendances[0];
    const isValidBatch = attendances.every(
      (att) =>
        att.classId === firstAttendance.classId &&
        att.sessionId === firstAttendance.sessionId &&
        new Date(att.learningDate).toDateString() ===
          new Date(firstAttendance.learningDate).toDateString(),
    );

    if (!isValidBatch) {
      throw new Error(
        'All attendances must be from same class, session, and date',
      );
    }

    // Format date: 21/12/2025 -> 21122025
    const learningDate = new Date(firstAttendance.learningDate);
    const formattedDate = `${learningDate.getDate().toString().padStart(2, '0')}${(learningDate.getMonth() + 1).toString().padStart(2, '0')}${learningDate.getFullYear()}`;

    // Create batchId with pattern: class-123-session-456-date-21122025
    const batchId = `class-${firstAttendance.classId}-session-${firstAttendance.sessionId}-date-${formattedDate}`;

    return batchId;
  }

  // Method to be called when each job completes
  async onJobComplete(batchId: string, lockKey: string, counterKey: string) {
    console.log(`✅ Job completed for batch ${batchId}`);

    // Decrement counter atomically
    const remaining = await this.redis.decr(counterKey);
    console.log(`📊 Remaining jobs for batch ${batchId}: ${remaining}`);

    // If all jobs are done, release the lock
    if (remaining <= 0) {
      await this.releaseBatchLock(batchId);
      console.log(`🎉 All jobs completed for batch ${batchId}, lock released`);
    }
  }

  // Method to be called when a job fails
  async onJobFailed(
    batchId: string,
    lockKey: string,
    counterKey: string,
    error: any,
  ) {
    console.error(`❌ Job failed for batch ${batchId}:`, error);

    // Decrement counter even on failure
    const remaining = await this.redis.decr(counterKey);
    console.log(`📊 Remaining jobs for batch ${batchId}: ${remaining}`);

    // If all jobs are done (including failed ones), release the lock
    if (remaining <= 0) {
      await this.releaseBatchLock(batchId);
      console.log(`🔓 All jobs processed for batch ${batchId}, lock released`);
    }
  }

  // Release batch lock
  private async releaseBatchLock(batchId: string) {
    const lockKey = `attendance-batch-lock:${batchId}`;
    const counterKey = `attendance-batch-counter:${batchId}`;

    await this.redis.multi().del(lockKey).del(counterKey).exec();

    console.log(`🔓 Released lock and counter for batch ${batchId}`);
  }

  // Check batch status
  async getBatchStatus(batchId: string) {
    const lockKey = `attendance-batch-lock:${batchId}`;
    const counterKey = `attendance-batch-counter:${batchId}`;

    const [lockStatus, remainingJobs] = await Promise.all([
      this.redis.get(lockKey),
      this.redis.get(counterKey),
    ]);

    return {
      batchId,
      isLocked: !!lockStatus,
      lockStatus,
      remainingJobs: remainingJobs ? parseInt(remainingJobs) : 0,
      isCompleted: !lockStatus || remainingJobs === '0',
    };
  }
}
