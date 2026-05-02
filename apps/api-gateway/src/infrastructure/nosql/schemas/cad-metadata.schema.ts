import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CadMetadataDocument = CadMetadata & Document;

@Schema({ timestamps: true, strict: false })
export class CadMetadata {
  @Prop({ required: true, unique: true, index: true })
  modelId: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Object })
  assemblyTree: Record<string, any>;

  @Prop({ type: [Object], default: [] })
  bomVariations: Record<string, any>[];

  @Prop({ type: Object })
  topologyInfo: Record<string, any>;

  @Prop({ type: Object })
  aiEnrichment: Record<string, any>;

  @Prop({ type: [String], default: [] })
  engineeringTags: string[];
}

export const CadMetadataSchema = SchemaFactory.createForClass(CadMetadata);
