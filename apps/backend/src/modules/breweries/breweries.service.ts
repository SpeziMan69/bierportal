import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Brewery } from '../../common/entities/brewery.entity';
import { UPLOAD_ROOT } from '../../common/upload/image-upload.options';
import { CreateBreweryDto, UpdateBreweryDto } from '@bierportal/dtos';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  async findAll(page = 1, limit = 24) {
    const [items, total] = await this.breweryRepository.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Brewery> {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    const brewery = await this.breweryRepository.findOne({ where: { id: normalizedId } });
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

    const brewery = await this.breweryRepository.findOne({ where: { id: normalizedId } });
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

    const brewery = await this.breweryRepository.findOne({ where: { id: normalizedId } });
    if (!brewery) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    try {
      await this.breweryRepository.remove(brewery);
    } catch (error) {
      // Postgres foreign-key violation: beers still reference this brewery.
      if (error instanceof QueryFailedError && (error.driverError as { code?: string }).code === '23503') {
        throw new ConflictException(
          'The brewery cannot be deleted while beers are still assigned to it.',
        );
      }
      throw error;
    }
  }

  async updateLogo(id: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file was uploaded.');
    }

    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The brewery with ID ${normalizedId} was not found.`);
    }

    const brewery = await this.breweryRepository.findOne({ where: { id: normalizedId } });
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
