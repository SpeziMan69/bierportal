import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Review } from '../../common/entities/review.entity';
import { ReviewLike } from '../../common/entities/review-like.entity';

const USER_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';

const fakeUser = {
  id: USER_ID,
  username: 'hopfenheld',
  email: 'hopfenheld@example.com',
  picture: null,
  createdAt: new Date('2026-01-05T10:12:00.000Z'),
};

const fakeReview = {
  id: 'r1111111-1111-4111-8111-111111111111',
  rating: '4.5',
  text: 'Sehr lecker!',
  createdAt: new Date('2026-02-01T12:00:00.000Z'),
  updatedAt: new Date('2026-02-01T12:00:00.000Z'),
  beer: { id: 'b1111111-1111-4111-8111-111111111111', name: 'Test Pils' },
};

const fakeLike = {
  id: 'l1111111-1111-4111-8111-111111111111',
  createdAt: new Date('2026-03-01T09:00:00.000Z'),
  review: {
    id: 'r2222222-2222-4222-8222-222222222222',
    rating: '5.0',
    text: 'Bestes Bier',
    beer: { id: 'b2222222-2222-4222-8222-222222222222', name: 'Test IPA' },
  },
};

describe('UsersController (integration, mocked DB)', () => {
  let app: INestApplication<App>;

  const userRepo = { findOne: jest.fn() };
  const reviewRepo = { count: jest.fn(), find: jest.fn() };
  const likeRepo = { count: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: getRepositoryToken(ReviewLike), useValue: likeRepo },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /users/:id', () => {
    it('returns the user profile with review and like counts', async () => {
      userRepo.findOne.mockResolvedValue(fakeUser);
      reviewRepo.count.mockResolvedValue(7);
      likeRepo.count.mockResolvedValue(23);

      const res = await request(app.getHttpServer()).get(`/users/${USER_ID}`).expect(200);

      expect(res.body).toEqual({
        id: USER_ID,
        username: 'hopfenheld',
        picture: null,
        createdAt: fakeUser.createdAt.toISOString(),
        reviewCount: 7,
        likeCount: 23,
      });
    });

    it('returns 404 when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(`/users/${USER_ID}`).expect(404);

      expect((res.body as { message: string }).message).toContain(USER_ID);
    });

    it('returns 404 for a malformed (non-UUID) id', async () => {
      await request(app.getHttpServer()).get('/users/not-a-uuid').expect(404);
      expect(userRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('GET /users/:id/reviews', () => {
    it("returns the user's reviews (ratings + comments)", async () => {
      userRepo.findOne.mockResolvedValue(fakeUser);
      reviewRepo.find.mockResolvedValue([fakeReview]);

      const res = await request(app.getHttpServer()).get(`/users/${USER_ID}/reviews`).expect(200);

      expect(res.body).toEqual([
        {
          id: fakeReview.id,
          rating: 4.5,
          text: 'Sehr lecker!',
          createdAt: fakeReview.createdAt.toISOString(),
          updatedAt: fakeReview.updatedAt.toISOString(),
          beer: { id: fakeReview.beer.id, name: 'Test Pils' },
        },
      ]);
    });
  });

  describe('GET /users/:id/likes', () => {
    it("returns the user's likes separately", async () => {
      userRepo.findOne.mockResolvedValue(fakeUser);
      likeRepo.find.mockResolvedValue([fakeLike]);

      const res = await request(app.getHttpServer()).get(`/users/${USER_ID}/likes`).expect(200);

      expect(res.body).toEqual([
        {
          id: fakeLike.id,
          createdAt: fakeLike.createdAt.toISOString(),
          review: {
            id: fakeLike.review.id,
            rating: 5,
            text: 'Bestes Bier',
            beer: { id: fakeLike.review.beer.id, name: 'Test IPA' },
          },
        },
      ]);
    });
  });
});
