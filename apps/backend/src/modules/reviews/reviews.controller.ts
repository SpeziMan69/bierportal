import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt.authguard';
import { CreateReviewDto, UpdateReviewDto } from '@bierportal/dtos';

type AuthedRequest = Request & { user: { id: string } };
type MaybeAuthedRequest = Request & { user?: { id: string } };

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({
    summary: 'List reviews for a beer',
    description:
      'Returns a paginated list of published reviews for a beer (newest first) with like counts. When authenticated, each review includes a `likedByMe` flag.',
  })
  @UseGuards(OptionalJwtAuthGuard)
  @Get('beer/:beerId')
  findByBeer(
    @Req() req: MaybeAuthedRequest,
    @Param('beerId') beerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.findByBeer(beerId, { page, limit, userId: req.user?.id });
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
