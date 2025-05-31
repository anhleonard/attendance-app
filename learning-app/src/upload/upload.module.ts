import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MinioService } from './minio.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UploadController],
  providers: [MinioService],
  exports: [MinioService],
})
export class UploadModule {}
