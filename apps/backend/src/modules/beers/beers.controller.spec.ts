import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { BeersController } from './beers.controller';
import { BeersService } from './beers.service';
import { Beer } from '../../common/entities/beer.entity';
import { Brewery } from '../../common/entities/brewery.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';

const BEER_ID = 'b1111111-1111-4111-8111-111111111111';
const BREWERY_ID = 'c2222222-2222-4222-8222-222222222222';

const fakeBrewery = { id: BREWERY_ID, name: 'Test Brauerei', country: 'Deutschland' };

const fakeBeer = {
  id: BEER_ID,
  name: 'Test Pils',
  description: 'Ein frisches Test-Pils.',
  abv: '4.8',
  ibu: '30.0',
  ebc: '8.0',
  imageUrl: '/uploads/beers/test.png',
  isActive: true,
  brewery: fakeBrewery,
  style: 'Pils',
  avgRating: '4.20',
  ratingCount: 5,
};

describe('BeersController (integration, mocked DB)', () => {
  let app: INestApplication<App>;

  const beerRepo = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const breweryRepo = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BeersController],
      providers: [
        BeersService,
        { provide: getRepositoryToken(Beer), useValue: beerRepo },
        { provide: getRepositoryToken(Brewery), useValue: breweryRepo },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
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

  describe('GET /beers', () => {
    it('returns a paginated list of beers', async () => {
      beerRepo.findAndCount.mockResolvedValue([[fakeBeer], 1]);

      const res = await request(app.getHttpServer()).get('/beers?page=1&limit=24').expect(200);

      expect(res.body).toEqual({
        items: [
          {
            id: BEER_ID,
            name: 'Test Pils',
            brewery: 'Test Brauerei',
            country: 'Deutschland',
            type: 'Pils',
            alcohol: 4.8,
            rating: 4.2,
            imageUrl: '/uploads/beers/test.png',
            description: 'Ein frisches Test-Pils.',
          },
        ],
        page: 1,
        limit: 24,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('GET /beers/:id', () => {
    it('returns a single beer', async () => {
      beerRepo.findOne.mockResolvedValue(fakeBeer);

      const res = await request(app.getHttpServer()).get(`/beers/${BEER_ID}`).expect(200);

      expect(res.body).toMatchObject({ id: BEER_ID, name: 'Test Pils', brewery: 'Test Brauerei' });
    });

    it('returns 404 for an unknown beer', async () => {
      beerRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/beers/${BEER_ID}`).expect(404);
      expect(beerRepo.findOne).toHaveBeenCalled();
    });

    it('returns 404 for a malformed (non-UUID) id', async () => {
      await request(app.getHttpServer()).get('/beers/not-a-uuid').expect(404);
      expect(beerRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('POST /beers', () => {
    it('creates a new beer with a style and resolves the brewery', async () => {
      breweryRepo.findOne.mockResolvedValue(fakeBrewery);
      beerRepo.create.mockImplementation((data: Partial<Beer>) => ({ ...data }));
      beerRepo.save.mockImplementation((beer: Beer) =>
        Promise.resolve({ ...beer, id: BEER_ID, ratingCount: 0, avgRating: '0.00' }),
      );

      const res = await request(app.getHttpServer())
        .post('/beers')
        .send({
          name: 'Neues Pils',
          description: 'Frisch gebraut.',
          abv: 5.1,
          style: 'Pils',
          breweryId: BREWERY_ID,
        })
        .expect(201);

      expect(breweryRepo.findOne).toHaveBeenCalledWith({ where: { id: BREWERY_ID } });
      expect(res.body).toMatchObject({
        id: BEER_ID,
        name: 'Neues Pils',
        brewery: 'Test Brauerei',
        type: 'Pils',
        alcohol: 5.1,
        rating: null,
      });
    });

    it('returns 400 when the name is missing', async () => {
      await request(app.getHttpServer()).post('/beers').send({ abv: 5 }).expect(400);
      expect(beerRepo.save).not.toHaveBeenCalled();
    });

    it('returns 404 when the referenced brewery does not exist', async () => {
      breweryRepo.findOne.mockResolvedValue(null);
      beerRepo.create.mockImplementation((data: Partial<Beer>) => ({ ...data }));

      await request(app.getHttpServer())
        .post('/beers')
        .send({ name: 'Waise', breweryId: BREWERY_ID })
        .expect(404);
      expect(beerRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /beers/:id', () => {
    it('updates an existing beer', async () => {
      beerRepo.findOne.mockResolvedValue({ ...fakeBeer });
      beerRepo.save.mockImplementation((beer: Beer) => Promise.resolve(beer));

      const res = await request(app.getHttpServer())
        .patch(`/beers/${BEER_ID}`)
        .send({ name: 'Umbenanntes Pils' })
        .expect(200);

      expect(res.body).toMatchObject({ id: BEER_ID, name: 'Umbenanntes Pils' });
    });

    it('returns 404 for an unknown beer', async () => {
      beerRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/beers/${BEER_ID}`)
        .send({ name: 'Nix' })
        .expect(404);
    });
  });

  describe('DELETE /beers/:id', () => {
    it('soft-deletes an existing beer', async () => {
      beerRepo.findOne.mockResolvedValue({ ...fakeBeer, isActive: true });
      beerRepo.save.mockImplementation((beer: Beer) => Promise.resolve(beer));

      await request(app.getHttpServer()).delete(`/beers/${BEER_ID}`).expect(204);

      expect(beerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: BEER_ID, isActive: false }),
      );
    });

    it('returns 404 for an unknown beer', async () => {
      beerRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).delete(`/beers/${BEER_ID}`).expect(404);
      expect(beerRepo.save).not.toHaveBeenCalled();
    });
  });
});
