import { Module } from '@nestjs/common';
import { CadProcessingProcessor } from '@/modules/cad-processing/cad-processing.processor';
import { CadProcessingController } from '@/modules/cad-processing/cad-processing.controller';
import { CadModelsModule } from '@/modules/cad-models/cad-models.module';

@Module({
  imports: [CadModelsModule],
  controllers: [CadProcessingController],
  providers: [CadProcessingProcessor],
})
export class CadProcessingModule {}
