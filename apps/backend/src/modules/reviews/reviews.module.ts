import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../../common/entities/review.entity';
import { ReviewLike } from '../../common/entities/review-like.entity';
import { Beer } from '../../common/entities/beer.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ReviewLike, Beer])],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
