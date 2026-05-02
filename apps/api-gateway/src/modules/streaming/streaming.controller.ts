import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { StreamingService } from './streaming.service';

@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @Get('manifest/:modelId')
  async getStreamingManifest(@Param('modelId') modelId: string) {
    return this.streamingService.getPrioritizedManifest(modelId);
  }

  @Post('telemetry/:modelId')
  async postTelemetry(@Param('modelId') modelId: string, @Body() body: any) {
    return this.streamingService.recordTelemetry(modelId, body);
  }

  @Get('telemetry/:modelId')
  async getTelemetry(@Param('modelId') modelId: string) {
    return this.streamingService.getTelemetry(modelId);
  }
}
