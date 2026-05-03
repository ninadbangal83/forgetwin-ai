import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  ModelsReviewsController,
  CadModelsReviewsController,
  VersionsController,
  AnnotationsController,
  ShareController,
} from './reviews.controller';

@Module({
  controllers: [
    ModelsReviewsController,
    CadModelsReviewsController,
    VersionsController,
    AnnotationsController,
    ShareController,
  ],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
