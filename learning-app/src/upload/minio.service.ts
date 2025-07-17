import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService {
  private s3: S3Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get('MINIO_BUCKET');
    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint: this.configService.get('MINIO_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get('MINIO_ROOT_USER'),
        secretAccessKey: this.configService.get('MINIO_ROOT_PASSWORD'),
      },
      forcePathStyle: true, // Bắt buộc cho MinIO
    });
  }

  async uploadFile(folder: string, file: Express.Multer.File) {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    const minioEndpoint = this.configService.get('MINIO_ENDPOINT');

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: fs.createReadStream(file.path),
        ContentType: file.mimetype,
      });

      await this.s3.send(command);

      // Delete temporary file after successful upload
      fs.unlinkSync(file.path);

      return {
        url: `${minioEndpoint}/${this.bucket}/${key}`,
        key,
      };
    } catch (error) {
      // Delete temporary file even if upload fails
      fs.unlinkSync(file.path);
      throw error;
    }
  }
}
