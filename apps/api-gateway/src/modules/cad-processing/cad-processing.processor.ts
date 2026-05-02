import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CadModelsService } from '@/modules/cad-models/cad-models.service';

@Processor('cad-processing')
export class CadProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(CadProcessingProcessor.name);

  constructor(private readonly cadModelsService: CadModelsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { modelId, storageKey, correlationId } = job.data;
    this.logger.log(`Processing BullMQ job ${job.id} for model ${modelId}`);

    await this.cadModelsService.updateStatus(modelId, {
      status: 'PROCESSING',
      processingStartedAt: new Date(),
    });

    try {
      const pythonServiceUrl = process.env.CAD_PROCESSOR_URL || 'http://localhost:8000';
      const response = await fetch(`${pythonServiceUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          storageKey,
          correlationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Python service failed with status ${response.status}`);
      }
      
      this.logger.log(`HTTP dispatch to Python worker successful for ${modelId}`);
      return { dispatched: true };
    } catch (error: any) {
      this.logger.error(`HTTP request to Python worker failed: ${error.message}`);
      
      await this.cadModelsService.updateStatus(modelId, {
        status: 'FAILED',
        processingCompletedAt: new Date(),
        processingLogs: [`HTTP Dispatch Error: ${error.message}`],
      });
      
      throw error; 
    }
  }
}
