import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from 'minio';

const BUCKETS = ['raw-cad', 'processed-models', 'thumbnails'];

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);

  constructor(@Inject('MINIO_CLIENT') private readonly _minioClient: Client) { }


  async onModuleInit() {
    await this.initializeBuckets();
  }

  private async initializeBuckets() {
    for (const bucket of BUCKETS) {
      try {
        const exists = await this._minioClient.bucketExists(bucket);
        if (!exists) {
          await this._minioClient.makeBucket(bucket, 'us-east-1');
          this.logger.log(`Created MinIO bucket: ${bucket}`);
        }
        if (bucket === 'processed-models') {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::processed-models/*`],
              },
            ],
          };
          await this._minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
          this.logger.log(`Public read policy applied to MinIO bucket: ${bucket}`);
        }
      } catch (error) {
        this.logger.error(`Failed to initialize bucket ${bucket}:`, error);
      }
    }
  }

  async uploadFile(bucket: string, key: string, stream: Buffer, size: number, mimeType: string): Promise<string> {
    await this._minioClient.putObject(bucket, key, stream, size, { 'Content-Type': mimeType });
    return key;
  }

  async getPresignedUrl(bucket: string, key: string, expiryInSeconds: number = 24 * 60 * 60): Promise<string> {
    return this._minioClient.presignedGetObject(bucket, key, expiryInSeconds);
  }
}
