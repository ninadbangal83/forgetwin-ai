import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly _prisma: PrismaService) {}

  async saveReviewVersion(modelId: string, userId: string, body: any) {
    const count = await (this._prisma as any).cadModelVersion.count({ where: { modelId } });
    const nextVersionNumber = count + 1;

    return (this._prisma as any).cadModelVersion.create({
      data: {
        modelId,
        versionNumber: nextVersionNumber,
        parentVersionId: body.parentVersionId || null,
        createdBy: userId,
        reviewStatus: body.reviewStatus || 'DRAFT',
        snapshotData: body.snapshotData || {},
      },
    });
  }

  async getVersionHistory(modelId: string) {
    return (this._prisma as any).cadModelVersion.findMany({
      where: { modelId },
      orderBy: { createdAt: 'desc' },
      include: { annotations: true },
    });
  }

  async getVersionById(versionId: string) {
    const version = await (this._prisma as any).cadModelVersion.findUnique({
      where: { versionId },
      include: { annotations: true },
    });
    if (!version) throw new NotFoundException(`Version ${versionId} not found`);
    return version;
  }

  async createShareLink(versionId: string, body: any) {
    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      expiresAt = new Date(body.expiresAt);
    }
    return (this._prisma as any).shareLink.create({
      data: {
        versionId,
        expiresAt,
        permissions: body.permissions || 'READ_ONLY',
      },
    });
  }

  async getSharedReview(token: string) {
    const shareLink = await (this._prisma as any).shareLink.findUnique({
      where: { token },
      include: {
        cadVersion: {
          include: {
            annotations: true,
          },
        },
      },
    });
    if (!shareLink) {
      throw new NotFoundException('Invalid or expired share link');
    }
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      throw new BadRequestException('Share link has expired');
    }
    return shareLink.cadVersion;
  }

  async compareVersions(modelId: string, v1Id: string, v2Id: string) {
    const v1 = await (this._prisma as any).cadModelVersion.findUnique({
      where: { versionId: v1Id },
    });
    const v2 = await (this._prisma as any).cadModelVersion.findUnique({
      where: { versionId: v2Id },
    });
    if (!v1 || !v2) throw new NotFoundException('Version(s) not found');

    const model = await (this._prisma as any).cadModel.findUnique({
      where: { id: modelId },
    });

    const assemblyTree = model?.assemblyTree || {};
    const nodes = (assemblyTree as any)?.nodes || [];

    const addedParts: any[] = [];
    const removedParts: any[] = [];
    const modifiedParts: any[] = [];

    const s1 = (v1.snapshotData as any) || {};
    const s2 = (v2.snapshotData as any) || {};

    const hidden1 = s1.hiddenNodeIds || [];
    const hidden2 = s2.hiddenNodeIds || [];

    for (const node of nodes) {
      const h1 = hidden1.includes(node.id);
      const h2 = hidden2.includes(node.id);

      if (h1 && !h2) {
        addedParts.push({ id: node.id, name: node.name || `Node ${node.id}` });
      } else if (!h1 && h2) {
        removedParts.push({ id: node.id, name: node.name || `Node ${node.id}` });
      } else if (node.metadata) {
        // Just an extra check for modified logic if applicable
        modifiedParts.push({ id: node.id, name: node.name });
      }
    }

    return {
      addedParts,
      removedParts,
      modifiedParts,
      summary: {
        v1Number: v1.versionNumber,
        v2Number: v2.versionNumber,
        hiddenCountDelta: hidden2.length - hidden1.length,
      },
    };
  }

  async createAnnotation(versionId: string, userId: string, body: any) {
    return (this._prisma as any).annotation.create({
      data: {
        versionId,
        createdBy: userId,
        partId: body.partId || null,
        worldPosition: body.worldPosition || {},
        note: body.note,
      },
    });
  }

  async getAnnotations(versionId: string) {
    return (this._prisma as any).annotation.findMany({
      where: { versionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateAnnotation(annotationId: string, body: any) {
    return (this._prisma as any).annotation.update({
      where: { annotationId },
      data: {
        note: body.note,
        partId: body.partId,
        worldPosition: body.worldPosition,
      },
    });
  }

  async deleteAnnotation(annotationId: string) {
    return (this._prisma as any).annotation.delete({
      where: { annotationId },
    });
  }

  async deleteVersion(versionId: string) {
    return (this._prisma as any).cadModelVersion.delete({
      where: { versionId },
    });
  }

  async clearAllVersions(modelId: string) {
    return (this._prisma as any).cadModelVersion.deleteMany({
      where: { modelId },
    });
  }
}
