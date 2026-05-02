import { Module } from '@nestjs/common';
import { CadProcessingProcessor } from './cad-processing.processor';
import { CadProcessingController } from './cad-processing.controller';
import { CadModelsModule } from '@/modules/cad-models/cad-models.module';


@Module({
  imports: [CadModelsModule],
  controllers: [CadProcessingController],
  providers: [CadProcessingProcessor],
})
export class CadProcessingModule {}
