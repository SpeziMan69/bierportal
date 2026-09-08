import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Brewery } from '../../common/entities/brewery.entity';
import { UPLOAD_ROOT } from '../../common/upload/image-upload.options';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class BreweriesService {
  constructor(
    @InjectRepository(Brewery)
    private readonly breweryRepository: Repository<Brewery>,
  ) {}

  async updateLogo(id: string, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Es wurde keine Bilddatei hochgeladen.');
    }

    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`Die Brauerei mit der ID ${normalizedId} wurde nicht gefunden.`);
    }

    const brewery = await this.breweryRepository.findOne({ where: { id: normalizedId } });
    if (!brewery) {
      throw new NotFoundException(`Die Brauerei mit der ID ${normalizedId} wurde nicht gefunden.`);
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
