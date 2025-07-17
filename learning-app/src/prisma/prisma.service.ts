import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Database connection failed');

      // Xử lý các loại lỗi cụ thể
      if (error.code === 'P1001') {
        throw new Error(
          'Cannot connect to database. Please check if database is running.',
        );
      }

      if (error.code === 'P2021') {
        throw new Error(
          'Database table does not exist. Please run database migrations.',
        );
      }

      if (error.code === 'P2022') {
        throw new Error(
          'Database column does not exist. Please run database migrations.',
        );
      }

      // Lỗi chung
      throw new Error('Database error: ' + (error.message || 'Unknown error'));
    }
  }
}
