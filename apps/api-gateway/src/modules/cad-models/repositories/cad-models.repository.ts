import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

@Injectable()
export class CadModelsRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async create(data: Record<string, unknown>) {
    // @ts-ignore
    return this._prisma.cadModel.create({ data });
  }

  async findMany() {
    return this._prisma.cadModel.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, createdAt: true, fileSize: true, thumbnailKey: true },
    });
  }

  async findById(id: string) {
    return this._prisma.cadModel.findUnique({ where: { id } });
  }

  async update(id: string, data: Record<string, unknown>) {
    // @ts-ignore
    return this._prisma.cadModel.update({ where: { id }, data });
  }
}
