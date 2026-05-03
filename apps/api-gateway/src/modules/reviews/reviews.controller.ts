import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '@/core/guards/jwt-auth.guard';
import { User } from '@/core/decorators/user.decorator';

@Controller('models')
@UseGuards(JwtAuthGuard)
export class ModelsReviewsController {
  constructor(private readonly _reviewsService: ReviewsService) {}

  @Post(':id/reviews')
  async saveReviewVersion(
    @Param('id') modelId: string,
    @User() user: any,
    @Body() body: any,
  ) {
    return this._reviewsService.saveReviewVersion(modelId, user?.id, body);
  }

  @Get(':id/versions')
  async getVersionHistory(@Param('id') modelId: string) {
    return this._reviewsService.getVersionHistory(modelId);
  }

  @Get(':id/versions/compare')
  async compareVersions(
    @Param('id') modelId: string,
    @Query('v1Id') v1Id: string,
    @Query('v2Id') v2Id: string,
  ) {
    return this._reviewsService.compareVersions(modelId, v1Id, v2Id);
  }

  @Delete(':id/versions/clear-all')
  async clearAllVersions(@Param('id') modelId: string) {
    return this._reviewsService.clearAllVersions(modelId);
  }
}

@Controller('cad-models')
@UseGuards(JwtAuthGuard)
export class CadModelsReviewsController {
  constructor(private readonly _reviewsService: ReviewsService) {}

  @Post(':id/reviews')
  async saveReviewVersion(
    @Param('id') modelId: string,
    @User() user: any,
    @Body() body: any,
  ) {
    return this._reviewsService.saveReviewVersion(modelId, user?.id, body);
  }

  @Get(':id/versions')
  async getVersionHistory(@Param('id') modelId: string) {
    return this._reviewsService.getVersionHistory(modelId);
  }

  @Get(':id/versions/compare')
  async compareVersions(
    @Param('id') modelId: string,
    @Query('v1Id') v1Id: string,
    @Query('v2Id') v2Id: string,
  ) {
    return this._reviewsService.compareVersions(modelId, v1Id, v2Id);
  }
}

@Controller('versions')
@UseGuards(JwtAuthGuard)
export class VersionsController {
  constructor(private readonly _reviewsService: ReviewsService) {}

  @Get(':versionId')
  async getVersionById(@Param('versionId') versionId: string) {
    return this._reviewsService.getVersionById(versionId);
  }

  @Post(':versionId/share')
  async createShareLink(
    @Param('versionId') versionId: string,
    @Body() body: any,
  ) {
    return this._reviewsService.createShareLink(versionId, body);
  }

  @Get(':versionId/annotations')
  async getAnnotations(@Param('versionId') versionId: string) {
    return this._reviewsService.getAnnotations(versionId);
  }

  @Post(':versionId/annotations')
  async createAnnotation(
    @Param('versionId') versionId: string,
    @User() user: any,
    @Body() body: any,
  ) {
    return this._reviewsService.createAnnotation(versionId, user?.id, body);
  }

  @Delete(':versionId')
  async deleteVersion(@Param('versionId') versionId: string) {
    return this._reviewsService.deleteVersion(versionId);
  }
}

@Controller('annotations')
@UseGuards(JwtAuthGuard)
export class AnnotationsController {
  constructor(private readonly _reviewsService: ReviewsService) {}

  @Patch(':annotationId')
  async updateAnnotation(
    @Param('annotationId') annotationId: string,
    @Body() body: any,
  ) {
    return this._reviewsService.updateAnnotation(annotationId, body);
  }

  @Delete(':annotationId')
  async deleteAnnotation(@Param('annotationId') annotationId: string) {
    return this._reviewsService.deleteAnnotation(annotationId);
  }
}

@Controller('share')
export class ShareController {
  constructor(private readonly _reviewsService: ReviewsService) {}

  @Get(':token')
  async getSharedReview(@Param('token') token: string) {
    return this._reviewsService.getSharedReview(token);
  }
}
