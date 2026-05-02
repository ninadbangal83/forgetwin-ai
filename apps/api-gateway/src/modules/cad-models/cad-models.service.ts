import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { StorageService } from '@/infrastructure/storage/storage.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

@Injectable()
export class CadModelsService {
  private readonly logger = new Logger(CadModelsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue('cad-processing') private readonly processingQueue: Queue,
  ) {}

  async processUpload(file: Express.Multer.File) {
    const modelId = uuidv4();
    const correlationId = uuidv4();
    const ext = extname(file.originalname).toLowerCase();
    const storageKey = `raw/${modelId}${ext}`;

    try {
      await this.storage.uploadFile('raw-cad', storageKey, file.buffer, file.size, file.mimetype || 'application/octet-stream');

      const model = await this.prisma.cadModel.create({
        data: {
          id: modelId,
          name: file.originalname.replace(ext, ''),
          originalFilename: file.originalname,
          storageKey,
          fileSize: file.size,
          mimeType: file.mimetype || 'application/octet-stream',
          status: 'UPLOADED',
          // @ts-ignore
          correlationId,
        },
      });

      // Atomic workflow: immediately push to BullMQ after DB write
      await this.processingQueue.add('process-step-file', {
        modelId: model.id,
        storageKey: model.storageKey,
        correlationId,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });

      this.logger.log(`Successfully queued model ${modelId} (Correlation: ${correlationId})`);
      return model;
    } catch (error) {
      this.logger.error(`Upload failed for ${file.originalname}`, error);
      throw error;
    }
  }

  async findAll() {
    const models = await this.prisma.cadModel.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, createdAt: true, fileSize: true, thumbnailKey: true } as any,
    });

    const result = [];
    for (const model of models) {
      let thumbnailUrl = null;
      if ((model as any).thumbnailKey) {
        thumbnailUrl = await this.storage.getPresignedUrl('processed-models', (model as any).thumbnailKey);
        if (thumbnailUrl && thumbnailUrl.includes('host.docker.internal')) {
          thumbnailUrl = thumbnailUrl.replace('host.docker.internal', 'localhost');
        }
      }
      result.push({ ...model, thumbnailUrl });
    }
    return result;
  }

  async findOne(id: string) {
    const model = await this.prisma.cadModel.findUnique({ where: { id } });
    if (!model) throw new NotFoundException(`Model ${id} not found`);

    let downloadUrl = null;
    if (model.status === 'COMPLETED' && model.processedStorageKey) {
      downloadUrl = await this.storage.getPresignedUrl('processed-models', model.processedStorageKey);
      if (downloadUrl && downloadUrl.includes('host.docker.internal')) {
        downloadUrl = downloadUrl.replace('host.docker.internal', 'localhost');
      }
    }

    let thumbnailUrl = null;
    if ((model as any).thumbnailKey) {
      thumbnailUrl = await this.storage.getPresignedUrl('processed-models', (model as any).thumbnailKey);
      if (thumbnailUrl && thumbnailUrl.includes('host.docker.internal')) {
        thumbnailUrl = thumbnailUrl.replace('host.docker.internal', 'localhost');
      }
    }

    return { ...model, downloadUrl, thumbnailUrl };
  }

  async updateStatus(id: string, data: any) {
    return this.prisma.cadModel.update({ where: { id }, data });
  }

  async getModelForCallback(id: string) {
    return this.prisma.cadModel.findUnique({ where: { id } });
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
      await this.storage.uploadFile('processed-models', key, buffer, buffer.length, 'image/png');
      return this.prisma.cadModel.update({ where: { id }, data: { thumbnailKey: key } as any });
    } catch (err: any) {
      this.logger.error(`Failed to update thumbnail for model ${id}: ${err.message}`);
      throw err;
    }
  }
}
