import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Beer } from '../../common/entities/beer.entity';

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
  ) {}

  async findAll(page = 1, limit = 24) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 100);

    const [beers, total] = await this.beerRepository.findAndCount({
      where: { isActive: true },
      relations: ['brewery', 'style'],
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
      throw new NotFoundException(`Das Bier mit der ID ${normalizedId} wurde nicht gefunden.`);
    }

    const beer = await this.beerRepository.findOne({
      where: { id: normalizedId, isActive: true },
      relations: ['brewery', 'style'],
    });

    if (!beer) {
      throw new NotFoundException(`Das Bier mit der ID ${normalizedId} wurde nicht gefunden.`);
    }

    return this.mapBeerToResponse(beer);
  }

  private mapBeerToResponse(beer: Beer): BeerResponse {
    const breweryName = beer.brewery?.name ?? 'Unbekannte Brauerei';

    return {
      id: beer.id,
      name: beer.name,
      brewery: breweryName,
      country: beer.brewery?.country ?? 'Unbekannt',
      type: beer.style?.name ?? 'Bier',
      alcohol: beer.abv != null ? Number(beer.abv) : null,
      rating: beer.ratingCount > 0 ? Number(beer.avgRating) : null,
      imageUrl: beer.imageUrl ?? '/public/beer-placeholder.png',
      description: beer.description ?? `${beer.name} von ${breweryName}.`,
    };
  }
}
