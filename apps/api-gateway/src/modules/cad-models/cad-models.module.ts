import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CadModelsController } from '@/modules/cad-models/cad-models.controller';
import { CadModelsService } from '@/modules/cad-models/cad-models.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cad-processing',
    }),
  ],
  controllers: [CadModelsController],
  providers: [CadModelsService],
  exports: [CadModelsService],
})
export class CadModelsModule {}
