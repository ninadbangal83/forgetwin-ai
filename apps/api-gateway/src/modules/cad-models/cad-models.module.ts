import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { CadModelsController } from './cad-models.controller';
import { CadModelsService } from './cad-models.service';
import { CadModelsRepository } from './cad-models.repository';
import { CadMetadata, CadMetadataSchema } from '@/infrastructure/nosql/schemas/cad-metadata.schema';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'cad-processing',
    }),
    MongooseModule.forFeature([
      { name: CadMetadata.name, schema: CadMetadataSchema },
    ]),
  ],
  controllers: [CadModelsController],
  providers: [CadModelsService, CadModelsRepository],
  exports: [CadModelsService, CadModelsRepository],
})
export class CadModelsModule {}


