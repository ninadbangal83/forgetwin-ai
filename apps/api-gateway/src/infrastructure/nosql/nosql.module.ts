import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { CadMetadata, CadMetadataSchema } from './schemas/cad-metadata.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: CadMetadata.name, schema: CadMetadataSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class NosqlModule {}
