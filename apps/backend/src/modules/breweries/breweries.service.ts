import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Brewery } from '../../common/entities/brewery.entity';
import { UPLOAD_ROOT } from '../../common/upload/image-upload.options';
import { CreateBreweryDto, UpdateBreweryDto } from '@bierportal/dtos';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BrewerySearchOptions {
  page?: number;
  limit?: number;
  q?: string;
  city?: string;
  country?: string;
}

@Injectable()
export class BreweriesService {
  constructor(
    @InjectRepository(Brewery)
    private readonly breweryRepository: Repository<Brewery>,
  ) {}

  async create(dto: CreateBreweryDto): Promise<Brewery> {
    const brewery = this.breweryRepository.create(dto);
    return this.breweryRepository.save(brewery);
  }

  async findAll(options: BrewerySearchOptions = {}) {
    const safePage = Math.max(1, options.page ?? 1);
    const safeLimit = Math.min(Math.max(1, options.limit ?? 24), 100);

    const qb = this.breweryRepository
      .createQueryBuilder('brewery')
      .where('brewery.isActive = :active', { active: true });

    if (options.q?.trim()) {
      qb.andWhere('(brewery.name ILIKE :q OR brewery.city ILIKE :q)', {
        q: `%${options.q.trim()}%`,
      });
    }
    if (options.city?.trim()) {
      qb.andWhere('brewery.city ILIKE :city', { city: `%${options.city.trim()}%` });
    }
    if (options.country?.trim()) {
      qb.andWhere('brewery.country ILIKE :country', { country: `%${options.country.trim()}%` });
    }

    qb.orderBy('brewery.name', 'ASC')
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async findOne(id: string): Promise<Brewery> {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    const brewery = await this.breweryRepository.findOne({
      where: { id: normalizedId, isActive: true },
    });
    if (!brewery) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }
    return brewery;
  }

  async update(id: string, dto: UpdateBreweryDto): Promise<Brewery> {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    const brewery = await this.breweryRepository.findOne({
      where: { id: normalizedId, isActive: true },
    });
    if (!brewery) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    Object.assign(brewery, dto);
    return this.breweryRepository.save(brewery);
  }

  async remove(id: string): Promise<void> {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    const brewery = await this.breweryRepository.findOne({
      where: { id: normalizedId, isActive: true },
    });
    if (!brewery) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    // Soft-delete: keep the row (and its beers) but hide it from listings.
    brewery.isActive = false;
    await this.breweryRepository.save(brewery);
  }

  async updateLogo(id: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file was uploaded.');
    }

    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    const brewery = await this.breweryRepository.findOne({
      where: { id: normalizedId, isActive: true },
    });
    if (!brewery) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    const previousLogoUrl = brewery.logoUrl;
    brewery.logoUrl = `/uploads/breweries/${file.filename}`;
    await this.breweryRepository.save(brewery);

    if (previousLogoUrl?.startsWith('/uploads/breweries/')) {
      await unlink(
        join(UPLOAD_ROOT, 'breweries', previousLogoUrl.replace('/uploads/breweries/', '')),
      ).catch(() => undefined);
    }

    return brewery;
  }
}
