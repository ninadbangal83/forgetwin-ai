import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CadModelsController } from './controllers/cad-models.controller';
import { CadModelsService } from './services/cad-models.service';
import { CadModelsRepository } from './repositories/cad-models.repository';

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
