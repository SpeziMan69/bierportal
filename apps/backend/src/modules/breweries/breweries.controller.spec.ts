import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { BreweriesController } from './breweries.controller';
import { BreweriesService } from './breweries.service';
import { Brewery } from '../../common/entities/brewery.entity';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';

const BREWERY_ID = 'c2222222-2222-4222-8222-222222222222';

const fakeBrewery = {
  id: BREWERY_ID,
  name: 'Test Brauerei',
  city: 'München',
  country: 'Deutschland',
  website: 'https://example.com',
  description: 'Eine Test-Brauerei.',
  logoUrl: '/uploads/breweries/test.png',
  isVerified: false,
};

describe('BreweriesController (integration, mocked DB)', () => {
  let app: INestApplication<App>;

  const breweryRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [BreweriesController],
      providers: [
        BreweriesService,
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

  describe('POST /breweries', () => {
    it('creates a new brewery', async () => {
      breweryRepo.create.mockImplementation((data: Partial<Brewery>) => ({ ...data }));
      breweryRepo.save.mockImplementation((brewery: Brewery) =>
        Promise.resolve({ ...brewery, id: BREWERY_ID, isVerified: false }),
      );

      const res = await request(app.getHttpServer())
        .post('/breweries')
        .send({
          name: 'Neue Brauerei',
          city: 'Berlin',
          country: 'Deutschland',
          website: 'https://brauerei.example',
        })
        .expect(201);

      expect(breweryRepo.save).toHaveBeenCalled();
      expect(res.body).toMatchObject({
        id: BREWERY_ID,
        name: 'Neue Brauerei',
        city: 'Berlin',
        country: 'Deutschland',
      });
    });

    it('returns 400 when the name is missing', async () => {
      await request(app.getHttpServer()).post('/breweries').send({ city: 'Berlin' }).expect(400);
      expect(breweryRepo.save).not.toHaveBeenCalled();
    });

    it('returns 400 for an invalid website URL', async () => {
      await request(app.getHttpServer())
        .post('/breweries')
        .send({ name: 'Kaputt', website: 'not-a-url' })
        .expect(400);
    });
  });

  describe('PATCH /breweries/:id', () => {
    it('updates an existing brewery', async () => {
      breweryRepo.findOne.mockResolvedValue({ ...fakeBrewery });
      breweryRepo.save.mockImplementation((brewery: Brewery) => Promise.resolve(brewery));

      const res = await request(app.getHttpServer())
        .patch(`/breweries/${BREWERY_ID}`)
        .send({ city: 'Hamburg' })
        .expect(200);

      expect(res.body).toMatchObject({ id: BREWERY_ID, city: 'Hamburg' });
    });

    it('returns 404 for an unknown brewery', async () => {
      breweryRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch(`/breweries/${BREWERY_ID}`)
        .send({ city: 'Hamburg' })
        .expect(404);
    });

    it('returns 404 for a malformed (non-UUID) id', async () => {
      await request(app.getHttpServer())
        .patch('/breweries/not-a-uuid')
        .send({ city: 'Hamburg' })
        .expect(404);
      expect(breweryRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /breweries/:id', () => {
    it('deletes an existing brewery', async () => {
      breweryRepo.findOne.mockResolvedValue({ ...fakeBrewery });
      breweryRepo.remove.mockResolvedValue({ ...fakeBrewery });

      await request(app.getHttpServer()).delete(`/breweries/${BREWERY_ID}`).expect(204);

      expect(breweryRepo.remove).toHaveBeenCalledWith(expect.objectContaining({ id: BREWERY_ID }));
    });

    it('returns 404 for an unknown brewery', async () => {
      breweryRepo.findOne.mockResolvedValue(null);

      await request(app.getHttpServer()).delete(`/breweries/${BREWERY_ID}`).expect(404);
      expect(breweryRepo.remove).not.toHaveBeenCalled();
    });
  });
});
