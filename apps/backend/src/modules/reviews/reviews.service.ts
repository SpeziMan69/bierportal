import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../common/entities/review.entity';
import { ReviewLike } from '../../common/entities/review-like.entity';
import { Beer } from '../../common/entities/beer.entity';
import { User } from '../users/user.entity';
import { CreateReviewDto, UpdateReviewDto } from '@bierportal/dtos';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ReviewListOptions {
  page?: number;
  limit?: number;
  userId?: string;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewLike)
    private readonly likeRepo: Repository<ReviewLike>,
    @InjectRepository(Beer)
    private readonly beerRepo: Repository<Beer>,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const beer = await this.getBeerOrThrow(dto.beerId);

    const existing = await this.reviewRepo.findOne({
      where: { user: { id: userId }, beer: { id: beer.id } },
    });
    if (existing) {
      throw new ConflictException('You have already reviewed this beer.');
    }

    const review = this.reviewRepo.create({
      rating: dto.rating,
      text: dto.text,
      isDraft: dto.isDraft ?? false,
      user: { id: userId } as User,
      beer,
    });
    const saved = await this.reviewRepo.save(review);
    await this.recalcBeerRating(beer.id);

    return this.toResponse(saved.id);
  }

  async findByBeer(beerId: string, options: ReviewListOptions = {}) {
    const beer = await this.getBeerOrThrow(beerId);
    const safePage = Math.max(1, options.page ?? 1);
    const safeLimit = Math.min(Math.max(1, options.limit ?? 20), 100);

    const [reviews, total] = await this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .loadRelationCountAndMap('review.likeCount', 'review.likes')
      .where('review.beerId = :beerId', { beerId: beer.id })
      .andWhere('review.isDraft = false')
      .orderBy('review.createdAt', 'DESC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    const likedIds = await this.getLikedReviewIds(
      options.userId,
      reviews.map((review) => review.id),
    );

    return {
      items: reviews.map((review) =>
        this.mapReview(review, (review as Review & { likeCount: number }).likeCount ?? 0, {
          likedByMe: likedIds.has(review.id),
        }),
      ),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.getOwnedReviewOrThrow(userId, id);

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.text !== undefined) review.text = dto.text;
    if (dto.isDraft !== undefined) review.isDraft = dto.isDraft;

    await this.reviewRepo.save(review);
    await this.recalcBeerRating(review.beer.id);

    return this.toResponse(review.id);
  }

  async remove(userId: string, id: string): Promise<void> {
    const review = await this.getOwnedReviewOrThrow(userId, id);
    const beerId = review.beer.id;

    await this.reviewRepo.remove(review);
    await this.recalcBeerRating(beerId);
  }

  async like(userId: string, reviewId: string) {
    const review = await this.getReviewOrThrow(reviewId);
    if (review.user.id === userId) {
      throw new ForbiddenException('You cannot like your own review.');
    }

    const existing = await this.likeRepo.findOne({
      where: { user: { id: userId }, review: { id: review.id } },
    });
    if (existing) {
      throw new ConflictException('You have already liked this review.');
    }

    await this.likeRepo.save(this.likeRepo.create({ user: { id: userId } as User, review }));

    return { liked: true, likeCount: await this.countLikes(review.id) };
  }

  async unlike(userId: string, reviewId: string) {
    const normalizedId = this.normalizeId(reviewId);
    const like = await this.likeRepo.findOne({
      where: { user: { id: userId }, review: { id: normalizedId } },
    });
    if (!like) {
      throw new NotFoundException('You have not liked this review.');
    }

    await this.likeRepo.remove(like);

    return { liked: false, likeCount: await this.countLikes(normalizedId) };
  }

  private async recalcBeerRating(beerId: string): Promise<void> {
    const raw = await this.reviewRepo
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.beerId = :beerId', { beerId })
      .andWhere('review.isDraft = false')
      .getRawOne<{ avg: string | null; count: string }>();

    const count = Number(raw?.count ?? 0);
    const avg = count > 0 ? Number(raw?.avg ?? 0) : 0;

    await this.beerRepo.update(beerId, { avgRating: avg, ratingCount: count });
  }

  private async getBeerOrThrow(beerId: string): Promise<Beer> {
    const normalizedId = this.normalizeId(beerId);
    const beer = await this.beerRepo.findOne({ where: { id: normalizedId, isActive: true } });
    if (!beer) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }
    return beer;
  }

  private async getReviewOrThrow(id: string): Promise<Review> {
    const normalizedId = this.normalizeId(id);
    const review = await this.reviewRepo.findOne({
      where: { id: normalizedId },
      relations: ['user', 'beer'],
    });
    if (!review) {
      throw new NotFoundException(`The review with ID ${normalizedId} was not found.`);
    }
    return review;
  }

  private async getOwnedReviewOrThrow(userId: string, id: string): Promise<Review> {
    const review = await this.getReviewOrThrow(id);
    if (review.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own reviews.');
    }
    return review;
  }

  private async toResponse(reviewId: string) {
    const review = await this.getReviewOrThrow(reviewId);
    return this.mapReview(review, await this.countLikes(reviewId));
  }

  private countLikes(reviewId: string): Promise<number> {
    return this.likeRepo.count({ where: { review: { id: reviewId } } });
  }

  // Returns the subset of the given review ids that the user has liked.
  private async getLikedReviewIds(
    userId: string | undefined,
    reviewIds: string[],
  ): Promise<Set<string>> {
    if (!userId || reviewIds.length === 0) {
      return new Set();
    }
    const likes = await this.likeRepo
      .createQueryBuilder('like')
      .select('like.reviewId', 'reviewId')
      .where('like.userId = :userId', { userId })
      .andWhere('like.reviewId IN (:...reviewIds)', { reviewIds })
      .getRawMany<{ reviewId: string }>();
    return new Set(likes.map((like) => like.reviewId));
  }

  private normalizeId(id: string): string {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The ID ${normalizedId} is invalid.`);
    }
    return normalizedId;
  }

  private mapReview(review: Review, likeCount: number, extra?: { likedByMe: boolean }) {
    return {
      id: review.id,
      rating: Number(review.rating),
      text: review.text,
      isDraft: review.isDraft,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      likeCount,
      likedByMe: extra?.likedByMe ?? false,
      user: review.user
        ? { id: review.user.id, username: review.user.username, picture: review.user.picture }
        : null,
      beer: review.beer ? { id: review.beer.id, name: review.beer.name } : null,
    };
  }
}
