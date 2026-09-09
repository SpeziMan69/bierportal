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
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      throw new ConflictException('Du hast dieses Bier bereits bewertet.');
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

  async findByBeer(beerId: string) {
    const beer = await this.getBeerOrThrow(beerId);

    const reviews = await this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .loadRelationCountAndMap('review.likeCount', 'review.likes')
      .where('review.beerId = :beerId', { beerId: beer.id })
      .andWhere('review.isDraft = false')
      .orderBy('review.createdAt', 'DESC')
      .getMany();

    return reviews.map((review) =>
      this.mapReview(review, (review as Review & { likeCount: number }).likeCount ?? 0),
    );
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
      throw new ForbiddenException('Du kannst deine eigene Bewertung nicht liken.');
    }

    const existing = await this.likeRepo.findOne({
      where: { user: { id: userId }, review: { id: review.id } },
    });
    if (existing) {
      throw new ConflictException('Du hast diese Bewertung bereits geliked.');
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
      throw new NotFoundException('Du hast diese Bewertung nicht geliked.');
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
      throw new NotFoundException(`Das Bier mit der ID ${normalizedId} wurde nicht gefunden.`);
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
      throw new NotFoundException(`Die Bewertung mit der ID ${normalizedId} wurde nicht gefunden.`);
    }
    return review;
  }

  private async getOwnedReviewOrThrow(userId: string, id: string): Promise<Review> {
    const review = await this.getReviewOrThrow(id);
    if (review.user.id !== userId) {
      throw new ForbiddenException('Du kannst nur deine eigenen Bewertungen bearbeiten.');
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

  private normalizeId(id: string): string {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`Die ID ${normalizedId} ist ungültig.`);
    }
    return normalizedId;
  }

  private mapReview(review: Review, likeCount: number) {
    return {
      id: review.id,
      rating: Number(review.rating),
      text: review.text,
      isDraft: review.isDraft,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      likeCount,
      user: review.user
        ? { id: review.user.id, username: review.user.username, picture: review.user.picture }
        : null,
      beer: review.beer ? { id: review.beer.id, name: review.beer.name } : null,
    };
  }
}
