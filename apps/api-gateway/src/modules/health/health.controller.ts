import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator, HealthCheck, HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Client } from 'minio';

@Controller('health')
export class HealthController extends HealthIndicator {
  constructor(
    private _health: HealthCheckService,
    private _prismaHealth: PrismaHealthIndicator,
    private _prisma: PrismaService,
    @Inject('MINIO_CLIENT') private _minioClient: Client,
  ) {
    super();
  }

  async checkMinio(): Promise<HealthIndicatorResult> {
    try {
      await this._minioClient.listBuckets();
      return this.getStatus('minio', true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new HealthCheckError('MinIO check failed', this.getStatus('minio', false, { message: msg }));
    }
  }

  @Get()
  @HealthCheck()
  check() {
    return this._health.check([
      () => this._prismaHealth.pingCheck('database', this._prisma),
      () => this.checkMinio(),
    ]);
  }
}

