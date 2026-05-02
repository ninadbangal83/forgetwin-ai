import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator, HealthCheck, HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { Client } from 'minio';

@Controller('health')
export class HealthController extends HealthIndicator {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    @Inject('MINIO_CLIENT') private minioClient: Client,
  ) {
    super();
  }

  async checkMinio(): Promise<HealthIndicatorResult> {
    try {
      await this.minioClient.listBuckets();
      return this.getStatus('minio', true);
    } catch (e: any) {
      throw new HealthCheckError('MinIO check failed', this.getStatus('minio', false, { message: e.message }));
    }
  }

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
      () => this.checkMinio(),
    ]);
  }
}
