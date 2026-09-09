import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

type AuthedRequest = Request & { user: { id: string } };

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({
    summary: 'List reviews for a beer',
    description: 'Returns all published reviews for a beer (newest first) with like counts.',
  })
  @Get('beer/:beerId')
  findByBeer(@Param('beerId') beerId: string) {
    return this.reviewsService.findByBeer(beerId);
  }

  @ApiOperation({
    summary: 'Create a review',
    description: 'Creates a review for a beer. One review per user and beer. Requires auth.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthedRequest, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Update your review',
    description: 'Updates rating/text/draft of your own review. Requires auth.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    return this.reviewsService.update(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Delete your review',
    description: 'Deletes your own review. Requires auth.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.reviewsService.remove(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Like a review',
    description: "Likes another user's review. Requires auth.",
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  like(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.reviewsService.like(req.user.id, id);
  }

  @ApiOperation({
    summary: 'Remove your like from a review',
    description: 'Removes your like from a review. Requires auth.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Delete(':id/like')
  unlike(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.reviewsService.unlike(req.user.id, id);
  }
}
