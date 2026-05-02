import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

@Injectable()
export class CadModelsRepository {
  constructor(private readonly _prisma: PrismaService) {}

  async create(data: Record<string, unknown>) {
    // @ts-ignore
    return this._prisma.cadModel.create({ data });
  }

  async findManyByUserId(userId: string) {
    return this._prisma.cadModel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, createdAt: true, fileSize: true, thumbnailKey: true, userId: true },
    });
  }

  async findMany() {
    return this._prisma.cadModel.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, status: true, createdAt: true, fileSize: true, thumbnailKey: true, userId: true },
    });
  }

  async findById(id: string) {
    return this._prisma.cadModel.findUnique({ where: { id } });
  }

  async update(id: string, data: Record<string, unknown>) {
    // @ts-ignore
    return this._prisma.cadModel.update({ where: { id }, data });
  }

  async deleteById(id: string) {
    return this._prisma.cadModel.delete({ where: { id } });
  }
}
