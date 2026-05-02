import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CadModelsController } from '@/modules/cad-models/cad-models.controller';
import { CadModelsService } from '@/modules/cad-models/cad-models.service';
import { CadModelsRepository } from '@/modules/cad-models/cad-models.repository';

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
