import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Beer } from '../../common/entities/beer.entity';
import { Brewery } from '../../common/entities/brewery.entity';
import { UPLOAD_ROOT } from '../../common/upload/image-upload.options';
import { CreateBeerDto } from './dto/create-beer.dto';
import { UpdateBeerDto } from './dto/update-beer.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BeerResponse {
  id: string;
  name: string;
  brewery: string;
  country: string;
  type: string;
  alcohol: number | null;
  rating: number | null;
  imageUrl: string;
  description: string;
}

@Injectable()
export class BeersService {
  constructor(
    @InjectRepository(Beer)
    private readonly beerRepository: Repository<Beer>,
    @InjectRepository(Brewery)
    private readonly breweryRepository: Repository<Brewery>,
  ) {}

  async create(dto: CreateBeerDto): Promise<BeerResponse> {
    const beer = this.beerRepository.create({
      name: dto.name,
      description: dto.description,
      abv: dto.abv,
      ibu: dto.ibu,
      ebc: dto.ebc,
      imageUrl: dto.imageUrl,
      style: dto.style,
    });

    if (dto.breweryId) {
      beer.brewery = await this.resolveBrewery(dto.breweryId);
    }

    const saved = await this.beerRepository.save(beer);
    return this.mapBeerToResponse(saved);
  }

  async update(id: string, dto: UpdateBeerDto): Promise<BeerResponse> {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    const beer = await this.beerRepository.findOne({
      where: { id: normalizedId },
      relations: ['brewery'],
    });
    if (!beer) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    if (dto.name !== undefined) beer.name = dto.name;
    if (dto.description !== undefined) beer.description = dto.description;
    if (dto.abv !== undefined) beer.abv = dto.abv;
    if (dto.ibu !== undefined) beer.ibu = dto.ibu;
    if (dto.ebc !== undefined) beer.ebc = dto.ebc;
    if (dto.imageUrl !== undefined) beer.imageUrl = dto.imageUrl;
    if (dto.style !== undefined) beer.style = dto.style;
    if (dto.breweryId !== undefined) {
      beer.brewery = await this.resolveBrewery(dto.breweryId);
    }

    const saved = await this.beerRepository.save(beer);
    return this.mapBeerToResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    const beer = await this.beerRepository.findOne({ where: { id: normalizedId, isActive: true } });
    if (!beer) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    beer.isActive = false;
    await this.beerRepository.save(beer);
  }

  private async resolveBrewery(breweryId: string): Promise<Brewery> {
    const brewery = await this.breweryRepository.findOne({ where: { id: breweryId } });
    if (!brewery) {
      throw new NotFoundException(`The brewery with ID ${breweryId} was not found.`);
    }
    return brewery;
  }

  async findAll(page = 1, limit = 24) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const [beers, total] = await this.beerRepository.findAndCount({
      where: { isActive: true },
      relations: ['brewery'],
      order: { name: 'ASC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      items: beers.map((beer) => this.mapBeerToResponse(beer)),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(id: string): Promise<BeerResponse> {
    const normalizedId = id.trim();

    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    const beer = await this.beerRepository.findOne({
      where: { id: normalizedId, isActive: true },
      relations: ['brewery'],
    });

    if (!beer) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    return this.mapBeerToResponse(beer);
  }

  async updateImage(id: string, file?: Express.Multer.File): Promise<BeerResponse> {
    if (!file) {
      throw new BadRequestException('No image file was uploaded.');
    }

    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    const beer = await this.beerRepository.findOne({
      where: { id: normalizedId },
      relations: ['brewery'],
    });

    if (!beer) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }

    const previousImageUrl = beer.imageUrl;
    beer.imageUrl = `/uploads/beers/${file.filename}`;
    await this.beerRepository.save(beer);

    if (previousImageUrl?.startsWith('/uploads/beers/')) {
      await unlink(
        join(UPLOAD_ROOT, 'beers', previousImageUrl.replace('/uploads/beers/', '')),
      ).catch(() => undefined);
    }

    return this.mapBeerToResponse(beer);
  }

  private mapBeerToResponse(beer: Beer): BeerResponse {
    const breweryName = beer.brewery?.name ?? 'Unknown brewery';

    return {
      id: beer.id,
      name: beer.name,
      brewery: breweryName,
      country: beer.brewery?.country ?? 'Unknown',
      type: beer.style ?? 'Beer',
      alcohol: beer.abv != null ? Number(beer.abv) : null,
      rating: beer.ratingCount > 0 ? Number(beer.avgRating) : null,
      imageUrl: beer.imageUrl ?? '/public/beer-placeholder.png',
      description: beer.description ?? `${beer.name} by ${breweryName}.`,
    };
  }
}
