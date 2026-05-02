import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { Client } from 'minio';

@Global()
@Module({
  providers: [
    {
      provide: 'MINIO_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Client({
          endPoint: configService.get<string>('MINIO_ENDPOINT') || 'localhost',
          port: parseInt(configService.get<string>('MINIO_PORT') || '9000', 10),
          useSSL: configService.get<string>('MINIO_USE_SSL') === 'true',
          accessKey: configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
          secretKey: configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin',
        });
      },
    },
    StorageService,
  ],
  exports: [StorageService, 'MINIO_CLIENT'],
})
export class StorageModule {}

