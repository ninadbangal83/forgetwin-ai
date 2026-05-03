export class CadMetadata {
  modelId: string;
  metadata: Record<string, any>;
  assemblyTree: Record<string, any>;
  bomVariations: Record<string, any>[];
  topologyInfo: Record<string, any>;
  aiEnrichment: Record<string, any>;
  engineeringTags: string[];
}
