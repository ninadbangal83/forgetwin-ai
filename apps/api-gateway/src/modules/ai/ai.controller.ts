import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { AiService, AIChatRequest } from './ai.service';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly _aiService: AiService) {}

  @Post('chat')
  async chatWithCopilot(@Body() body: AIChatRequest) {
    return {
      status: 'success',
      data: await this._aiService.processChat(body),
    };
  }

  @Get('summarize/:modelId')
  async summarizeModelAnnotations(@Param('modelId') modelId: string) {
    return {
      status: 'success',
      summary: await this._aiService.summarizeRevision(modelId),
    };
  }

  @Post('search/:modelId')
  async semanticEngineeringSearch(
    @Param('modelId') modelId: string,
    @Body('query') query: string,
  ) {
    return {
      status: 'success',
      data: await this._aiService.queryModelContext(modelId, query),
    };
  }
}
