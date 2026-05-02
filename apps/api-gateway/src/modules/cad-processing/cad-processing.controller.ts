import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Logger } from '@nestjs/common';
import { InternalWebhookGuard } from '@/core/guards/internal-webhook.guard';
import { CadModelsService } from '@/modules/cad-models/cad-models.service';

@Controller('internal/callbacks')
@UseGuards(InternalWebhookGuard)
export class CadProcessingController {
  private readonly logger = new Logger(CadProcessingController.name);

  constructor(private readonly cadModelsService: CadModelsService) {}

  @Post('cad-processing')
  @HttpCode(HttpStatus.OK)
  async handleCallback(@Body() dto: any) {
    this.logger.log(`Received callback for ${dto.modelId}: ${dto.status}`);
    
    // Idempotency: Prevent duplicate updates
    const existing = await this.cadModelsService.getModelForCallback(dto.modelId);
    if (!existing) return { received: false, error: 'Model not found' };
    
    if (existing.status === 'COMPLETED' || existing.status === 'FAILED') {
      this.logger.warn(`Idempotency caught duplicate callback for ${dto.modelId}`);
      return { received: true, ignored: true };
    }

    const updateData: any = {
      status: dto.status,
      processingCompletedAt: new Date(),
      processingDurationMs: dto.durationMs,
      processingLogs: dto.processingLogs || [],
    };

    if (dto.status === 'COMPLETED') {
      updateData.processedStorageKey = dto.processedStorageKey;
      updateData.metadata = dto.metadata;
      updateData.assemblyTree = dto.assemblyTree;
      updateData.thumbnailKey = dto.thumbnailKey;
    }

    await this.cadModelsService.updateStatus(dto.modelId, updateData);
    return { received: true };
  }
}
