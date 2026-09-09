import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review } from '../../common/entities/review.entity';
import { ReviewLike } from '../../common/entities/review-like.entity';
import { Beer } from '../../common/entities/beer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';

const USER_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
const OTHER_USER_ID = 'f9e8d7c6-b5a4-4321-8fed-0a1b2c3d4e5f';
const BEER_ID = 'b1111111-1111-4111-8111-111111111111';
const REVIEW_ID = 'e2222222-2222-4222-8222-222222222222';

const fakeBeer = { id: BEER_ID, name: 'Test Pils', isActive: true };
const fakeReview = {
  id: REVIEW_ID,
  rating: '4.5',
  text: 'Sehr lecker!',
  isDraft: false,
  createdAt: new Date('2026-02-01T12:00:00.000Z'),
  updatedAt: new Date('2026-02-01T12:00:00.000Z'),
  user: { id: USER_ID, username: 'hopfenheld', picture: null },
  beer: { id: BEER_ID, name: 'Test Pils' },
};

function createQbMock() {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getRawOne: jest.fn(),
  };
}

describe('ReviewsController (integration, mocked DB)', () => {
  let app: INestApplication<App>;
  let qb: ReturnType<typeof createQbMock>;

  const reviewRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const likeRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  };
  const beerRepo = { findOne: jest.fn(), update: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    qb = createQbMock();
    reviewRepo.createQueryBuilder.mockReturnValue(qb);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: getRepositoryToken(ReviewLike), useValue: likeRepo },
        { provide: getRepositoryToken(Beer), useValue: beerRepo },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: { switchToHttp: () => { getRequest: () => { user?: unknown } } }) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { id: USER_ID };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /reviews/beer/:beerId', () => {
    it('returns published reviews with like counts', async () => {
      beerRepo.findOne.mockResolvedValue(fakeBeer);
      qb.getMany.mockResolvedValue([{ ...fakeReview, likeCount: 3 }]);

      const res = await request(app.getHttpServer()).get(`/reviews/beer/${BEER_ID}`).expect(200);

      expect(res.body).toEqual([
        expect.objectContaining({ id: REVIEW_ID, rating: 4.5, likeCount: 3 }),
      ]);
    });
  });

  describe('POST /reviews', () => {
    it('creates a review and recalculates the beer rating', async () => {
      beerRepo.findOne.mockResolvedValue(fakeBeer);
      reviewRepo.findOne
        .mockResolvedValueOnce(null) // no existing review
        .mockResolvedValueOnce(fakeReview); // toResponse reload
      reviewRepo.create.mockImplementation((data: Partial<Review>) => data);
      reviewRepo.save.mockResolvedValue({ id: REVIEW_ID });
      qb.getRawOne.mockResolvedValue({ avg: '4.5', count: '1' });
      likeRepo.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .post('/reviews')
        .send({ beerId: BEER_ID, rating: 4.5, text: 'Sehr lecker!' })
        .expect(201);

      expect(beerRepo.update).toHaveBeenCalledWith(BEER_ID, { avgRating: 4.5, ratingCount: 1 });
      expect(res.body).toMatchObject({ id: REVIEW_ID, rating: 4.5, likeCount: 0 });
    });

    it('returns 409 when the user already reviewed the beer', async () => {
      beerRepo.findOne.mockResolvedValue(fakeBeer);
      reviewRepo.findOne.mockResolvedValue(fakeReview);

      await request(app.getHttpServer())
        .post('/reviews')
        .send({ beerId: BEER_ID, rating: 4 })
        .expect(409);
      expect(reviewRepo.save).not.toHaveBeenCalled();
    });

    it('returns 400 for an out-of-range rating', async () => {
      await request(app.getHttpServer())
        .post('/reviews')
        .send({ beerId: BEER_ID, rating: 9 })
        .expect(400);
      expect(reviewRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /reviews/:id', () => {
    it('rejects editing a review that belongs to another user', async () => {
      reviewRepo.findOne.mockResolvedValue({ ...fakeReview, user: { id: OTHER_USER_ID } });

      await request(app.getHttpServer())
        .patch(`/reviews/${REVIEW_ID}`)
        .send({ rating: 3 })
        .expect(403);
      expect(reviewRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('POST /reviews/:id/like', () => {
    it("likes another user's review", async () => {
      reviewRepo.findOne.mockResolvedValue({ ...fakeReview, user: { id: OTHER_USER_ID } });
      likeRepo.findOne.mockResolvedValue(null);
      likeRepo.create.mockImplementation((data: Partial<ReviewLike>) => data);
      likeRepo.save.mockResolvedValue({});
      likeRepo.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).post(`/reviews/${REVIEW_ID}/like`).expect(201);

      expect(res.body).toEqual({ liked: true, likeCount: 1 });
    });

    it('forbids liking your own review', async () => {
      reviewRepo.findOne.mockResolvedValue(fakeReview);

      await request(app.getHttpServer()).post(`/reviews/${REVIEW_ID}/like`).expect(403);
    });
  });

  describe('DELETE /reviews/:id/like', () => {
    it('removes an existing like', async () => {
      likeRepo.findOne.mockResolvedValue({ id: 'l1' });
      likeRepo.remove.mockResolvedValue({});
      likeRepo.count.mockResolvedValue(0);

      const res = await request(app.getHttpServer())
        .delete(`/reviews/${REVIEW_ID}/like`)
        .expect(200);

      expect(res.body).toEqual({ liked: false, likeCount: 0 });
    });
  });
});
