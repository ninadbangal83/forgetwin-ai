import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from '@/config/env.validation';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { StorageModule } from '@/infrastructure/storage/storage.module';
import { QueueModule } from '@/infrastructure/queue/queue.module';
import { CadModelsModule } from '@/modules/cad-models/cad-models.module';
import { CadProcessingModule } from '@/modules/cad-processing/cad-processing.module';
import { HealthModule } from '@/modules/health/health.module';
import { StreamingModule } from '@/modules/streaming/streaming.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env: Record<string, unknown>) => envValidationSchema.parse(env),
    }),
    DatabaseModule,
    StorageModule,
    QueueModule,
    CadModelsModule,
    CadProcessingModule,
    HealthModule,
    StreamingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
