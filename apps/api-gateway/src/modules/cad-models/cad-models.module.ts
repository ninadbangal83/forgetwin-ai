import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CadModelsController } from './cad-models.controller';
import { CadModelsService } from './cad-models.service';
import { CadModelsRepository } from './cad-models.repository';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cad-processing',
    }),
  ],
  controllers: [CadModelsController],
  providers: [CadModelsService, CadModelsRepository],
  exports: [CadModelsService, CadModelsRepository],
})
export class CadModelsModule {}
