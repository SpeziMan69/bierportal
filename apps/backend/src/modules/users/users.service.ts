import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Review } from '../../common/entities/review.entity';
import { ReviewLike } from '../../common/entities/review-like.entity';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(ReviewLike)
    private readonly likeRepo: Repository<ReviewLike>,
  ) {}

  private async getUserOrThrow(id: string): Promise<User> {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`Der Benutzer mit der ID ${normalizedId} wurde nicht gefunden.`);
    }

    const user = await this.userRepo.findOne({ where: { id: normalizedId } });
    if (!user) {
      throw new NotFoundException(`Der Benutzer mit der ID ${normalizedId} wurde nicht gefunden.`);
    }
    return user;
  }

  async getProfile(id: string) {
    const user = await this.getUserOrThrow(id);
    const [reviewCount, likeCount] = await Promise.all([
      this.reviewRepo.count({ where: { user: { id: user.id }, isDraft: false } }),
      this.likeRepo.count({ where: { user: { id: user.id } } }),
    ]);

    return {
      id: user.id,
      username: user.username,
      picture: user.picture,
      createdAt: user.createdAt,
      reviewCount,
      likeCount,
    };
  }

  async getReviews(id: string) {
    const user = await this.getUserOrThrow(id);
    const reviews = await this.reviewRepo.find({
      where: { user: { id: user.id }, isDraft: false },
      relations: ['beer'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: Number(review.rating),
      text: review.text,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      beer: review.beer ? { id: review.beer.id, name: review.beer.name } : null,
    }));
  }

  async getLikes(id: string) {
    const user = await this.getUserOrThrow(id);
    const likes = await this.likeRepo.find({
      where: { user: { id: user.id } },
      relations: ['review', 'review.beer'],
      order: { createdAt: 'DESC' },
    });

    return likes.map((like) => ({
      id: like.id,
      createdAt: like.createdAt,
      review: like.review
        ? {
            id: like.review.id,
            rating: Number(like.review.rating),
            text: like.review.text,
            beer: like.review.beer
              ? { id: like.review.beer.id, name: like.review.beer.name }
              : null,
          }
        : null,
    }));
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { googleId } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepo.create(userData);
    return this.userRepo.save(user);
  }
  async update(id: string, data: Partial<User>): Promise<User> {
    await this.userRepo.update(id, data);
    return this.userRepo.findOneOrFail({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.userRepo.delete(id);
  }
}
