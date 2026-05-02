import { Global, Module } from '@nestjs/common';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { Client } from 'minio';

@Global()
@Module({
  providers: [
    {
      provide: 'MINIO_CLIENT',
      useFactory: () => {
        return new Client({
          endPoint: process.env.MINIO_ENDPOINT || 'localhost',
          port: parseInt(process.env.MINIO_PORT || '9000', 10),
          useSSL: process.env.MINIO_USE_SSL === 'true',
          accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
        });
      },
    },
    StorageService,
  ],
  exports: [StorageService, 'MINIO_CLIENT'],
})
export class StorageModule {}
