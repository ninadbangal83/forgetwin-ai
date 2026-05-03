import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { CadModelsRepository } from './cad-models.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class CadModelsService {
  private readonly logger = new Logger(CadModelsService.name);

  constructor(
    private readonly _repository: CadModelsRepository,
    private readonly _storage: StorageService,
    @InjectQueue('cad-processing') private readonly _processingQueue: Queue,
  ) {}

  async processUpload(file: Express.Multer.File, userId?: string) {
    const modelId = uuidv4();
    const correlationId = uuidv4();
    const ext = extname(file.originalname).toLowerCase();
    const storageKey = `raw/${modelId}${ext}`;

    try {
      await this._storage.uploadFile('raw-cad', storageKey, file.buffer, file.size, file.mimetype || 'application/octet-stream');

      const model = await this._repository.create({
        id: modelId,
        name: file.originalname.replace(ext, ''),
        originalFilename: file.originalname,
        storageKey,
        fileSize: file.size,
        mimeType: file.mimetype || 'application/octet-stream',
        status: 'UPLOADED',
        correlationId,
        userId: userId || null,
      });

      // Atomic workflow: immediately push to BullMQ after DB write
      await this._processingQueue.add('process-step-file', {
        modelId: model.id,
        storageKey: model.storageKey,
        correlationId,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });

      this.logger.log(`Successfully queued model ${modelId} (Correlation: ${correlationId}) for user ${userId}`);
      return model;
    } catch (error) {
      this.logger.error(`Upload failed for ${file.originalname}`, error);
      throw error;
    }
  }

  async findAll(userId?: string) {
    const models = userId 
      ? await this._repository.findManyByUserId(userId)
      : await this._repository.findMany();

    const result = [];
    for (const model of models) {
      let thumbnailUrl = null;
      if ((model as Record<string, unknown>).thumbnailKey) {
        thumbnailUrl = await this._storage.getPresignedUrl('processed-models', (model as Record<string, unknown>).thumbnailKey as string);
        if (thumbnailUrl && thumbnailUrl.includes('host.docker.internal')) {
          thumbnailUrl = thumbnailUrl.replace('host.docker.internal', 'localhost');
        }
      }
      result.push({ ...model, thumbnailUrl });
    }
    return result;
  }

  async findOne(id: string, userId?: string) {
    const model = await this._repository.findById(id);
    if (!model) throw new NotFoundException(`Model ${id} not found`);

    if (userId && model.userId && model.userId !== userId) {
      throw new UnauthorizedException('You do not have permission to access this model');
    }

    let downloadUrl = null;
    if (model.status === 'COMPLETED' && model.processedStorageKey) {
      downloadUrl = await this._storage.getPresignedUrl('processed-models', model.processedStorageKey);
      if (downloadUrl && downloadUrl.includes('host.docker.internal')) {
        downloadUrl = downloadUrl.replace('host.docker.internal', 'localhost');
      }
    }

    let thumbnailUrl = null;
    if ((model as Record<string, unknown>).thumbnailKey) {
      thumbnailUrl = await this._storage.getPresignedUrl('processed-models', (model as Record<string, unknown>).thumbnailKey as string);
      if (thumbnailUrl && thumbnailUrl.includes('host.docker.internal')) {
        thumbnailUrl = thumbnailUrl.replace('host.docker.internal', 'localhost');
      }
    }

    return {
      ...model,
      downloadUrl,
      thumbnailUrl,
      metadata: model.metadata || {},
      assemblyTree: model.assemblyTree || {},
      bomVariations: (model as any).bomVariations || [],
      topologyInfo: (model as any).topologyInfo || {},
      aiEnrichment: (model as any).aiEnrichment || {},
      engineeringTags: (model as any).engineeringTags || [],
    };
  }

  async updateStatus(id: string, data: Record<string, unknown>) {
    return this._repository.update(id, data);
  }

  async getModelForCallback(id: string) {
    return this._repository.findById(id);
  }

  async updateThumbnail(id: string, base64Data: string) {
    try {
      let cleaned = base64Data;
      if (cleaned.startsWith('data:image/png;base64,')) {
        cleaned = cleaned.replace('data:image/png;base64,', '');
      } else if (cleaned.startsWith('data:image/jpeg;base64,')) {
        cleaned = cleaned.replace('data:image/jpeg;base64,', '');
      }
      const buffer = Buffer.from(cleaned, 'base64');
      const key = `thumbnails/${id}.png`;
      await this._storage.uploadFile('processed-models', key, buffer, buffer.length, 'image/png');
      return this._repository.update(id, { thumbnailKey: key });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to update thumbnail for model ${id}: ${msg}`);
      throw err;
    }
  }

  async delete(id: string, userId?: string) {
    const model = await this._repository.findById(id);
    if (!model) throw new NotFoundException(`Model ${id} not found`);

    if (userId && model.userId && model.userId !== userId) {
      throw new UnauthorizedException('You do not have permission to delete this model');
    }

    // 1. Delete from storage (MinIO)
    if (model.storageKey) {
      await this._storage.deleteFile('raw-cad', model.storageKey);
    }
    if (model.processedStorageKey) {
      await this._storage.deleteFile('processed-models', model.processedStorageKey);
    }
    if (model.thumbnailKey) {
      await this._storage.deleteFile('processed-models', model.thumbnailKey);
    }

    // 2. Delete relational CAD model entry from Postgres
    return this._repository.deleteById(id);
  }
}
