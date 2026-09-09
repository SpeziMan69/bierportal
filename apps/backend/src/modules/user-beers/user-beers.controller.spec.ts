import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { UserBeersController } from './user-beers.controller';
import { UserBeersService } from './user-beers.service';
import { BeerStatus, UserBeerEntry } from '../../common/entities/user-entry.entity';
import { Beer } from '../../common/entities/beer.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';

const USER_ID = 'a1b2c3d4-e5f6-4a1b-8c2d-3e4f5a6b7c8d';
const OTHER_USER_ID = 'f9e8d7c6-b5a4-4321-8fed-0a1b2c3d4e5f';
const BEER_ID = 'b1111111-1111-4111-8111-111111111111';
const ENTRY_ID = 'c3333333-3333-4333-8333-333333333333';

const fakeBeer = {
  id: BEER_ID,
  name: 'Test Pils',
  imageUrl: '/uploads/beers/test.png',
  isActive: true,
  brewery: { name: 'Test Brauerei' },
};
const fakeEntry = {
  id: ENTRY_ID,
  status: BeerStatus.WISHLIST,
  note: 'Unbedingt probieren',
  addedAt: new Date('2026-03-01T09:00:00.000Z'),
  user: { id: USER_ID },
  beer: fakeBeer,
};

describe('UserBeersController (integration, mocked DB)', () => {
  let app: INestApplication<App>;

  const entryRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const beerRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UserBeersController],
      providers: [
        UserBeersService,
        { provide: getRepositoryToken(UserBeerEntry), useValue: entryRepo },
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

  describe('GET /user-beers', () => {
    it("returns the current user's entries", async () => {
      entryRepo.find.mockResolvedValue([fakeEntry]);

      const res = await request(app.getHttpServer()).get('/user-beers').expect(200);

      expect(res.body).toEqual([
        expect.objectContaining({
          id: ENTRY_ID,
          status: 'wishlist',
          beer: expect.objectContaining({ id: BEER_ID, brewery: 'Test Brauerei' }) as unknown,
        }),
      ]);
    });
  });

  describe('POST /user-beers', () => {
    it('creates a new entry', async () => {
      beerRepo.findOne.mockResolvedValue(fakeBeer);
      entryRepo.findOne.mockResolvedValue(null);
      entryRepo.create.mockImplementation((data: Partial<UserBeerEntry>) => data);
      entryRepo.save.mockResolvedValue({ id: ENTRY_ID });
      entryRepo.findOneOrFail.mockResolvedValue(fakeEntry);

      const res = await request(app.getHttpServer())
        .post('/user-beers')
        .send({ beerId: BEER_ID, status: 'wishlist', note: 'Unbedingt probieren' })
        .expect(201);

      expect(res.body).toMatchObject({ id: ENTRY_ID, status: 'wishlist' });
    });

    it('updates the existing entry instead of duplicating it', async () => {
      beerRepo.findOne.mockResolvedValue(fakeBeer);
      entryRepo.findOne.mockResolvedValue({ ...fakeEntry, status: BeerStatus.WISHLIST });
      entryRepo.save.mockImplementation((entry: UserBeerEntry) => Promise.resolve(entry));

      const res = await request(app.getHttpServer())
        .post('/user-beers')
        .send({ beerId: BEER_ID, status: 'tried' })
        .expect(201);

      expect(entryRepo.create).not.toHaveBeenCalled();
      expect(res.body).toMatchObject({ id: ENTRY_ID, status: 'tried' });
    });

    it('returns 400 for an invalid status', async () => {
      await request(app.getHttpServer())
        .post('/user-beers')
        .send({ beerId: BEER_ID, status: 'nope' })
        .expect(400);
    });
  });

  describe('PATCH /user-beers/:id', () => {
    it('rejects editing an entry that belongs to another user', async () => {
      entryRepo.findOne.mockResolvedValue({ ...fakeEntry, user: { id: OTHER_USER_ID } });

      await request(app.getHttpServer())
        .patch(`/user-beers/${ENTRY_ID}`)
        .send({ status: 'tried' })
        .expect(403);
      expect(entryRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /user-beers/:id', () => {
    it('removes an owned entry', async () => {
      entryRepo.findOne.mockResolvedValue(fakeEntry);
      entryRepo.remove.mockResolvedValue({});

      await request(app.getHttpServer()).delete(`/user-beers/${ENTRY_ID}`).expect(204);
      expect(entryRepo.remove).toHaveBeenCalled();
    });
  });
});
