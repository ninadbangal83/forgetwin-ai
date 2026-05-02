import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { StreamingService } from '@/modules/streaming/streaming.service';

@Controller('streaming')

export class StreamingController {
  constructor(private readonly _streamingService: StreamingService) {}

  @Get('manifest/:modelId')
  async getStreamingManifest(@Param('modelId') modelId: string) {
    return this._streamingService.getPrioritizedManifest(modelId);
  }

  @Post('telemetry/:modelId')
  async postTelemetry(@Param('modelId') modelId: string, @Body() body: Record<string, unknown>) {
    return this._streamingService.recordTelemetry(modelId, body);
  }

  @Get('telemetry/:modelId')
  async getTelemetry(@Param('modelId') modelId: string) {
    return this._streamingService.getTelemetry(modelId);
  }
}

