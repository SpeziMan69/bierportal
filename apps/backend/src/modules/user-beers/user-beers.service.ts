import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BeerStatus, UserBeerEntry } from '../../common/entities/user-beer-entry.entity';
import { Beer } from '../../common/entities/beer.entity';
import { User } from '../users/user.entity';
import { CreateUserBeerDto, UpdateUserBeerDto } from '@bierportal/dtos';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class UserBeersService {
  constructor(
    @InjectRepository(UserBeerEntry)
    private readonly entryRepo: Repository<UserBeerEntry>,
    @InjectRepository(Beer)
    private readonly beerRepo: Repository<Beer>,
  ) {}

  async upsert(userId: string, dto: CreateUserBeerDto) {
    const beer = await this.getBeerOrThrow(dto.beerId);

    const existing = await this.entryRepo.findOne({
      where: { user: { id: userId }, beer: { id: beer.id }, status: dto.status },
      relations: ['beer', 'beer.brewery'],
    });

    if (existing) {
      if (dto.note !== undefined) existing.note = dto.note;
      const saved = await this.entryRepo.save(existing);
      return this.mapEntry(saved);
    }

    const entry = this.entryRepo.create({
      status: dto.status,
      note: dto.note,
      user: { id: userId } as User,
      beer,
    });
    const saved = await this.entryRepo.save(entry);
    return this.mapEntry(await this.reload(saved.id));
  }

  async findAllForUser(userId: string, status?: BeerStatus) {
    if (status !== undefined && !Object.values(BeerStatus).includes(status)) {
      throw new NotFoundException(`Unknown status: ${status}`);
    }

    const entries = await this.entryRepo.find({
      where: {
        user: { id: userId },
        ...(status !== undefined ? { status } : {}),
      },
      relations: ['beer', 'beer.brewery'],
      order: { addedAt: 'DESC' },
    });

    return entries.map((entry) => this.mapEntry(entry));
  }

  async update(userId: string, id: string, dto: UpdateUserBeerDto) {
    const entry = await this.getOwnedEntryOrThrow(userId, id);

    if (dto.status !== undefined) entry.status = dto.status;
    if (dto.note !== undefined) entry.note = dto.note;

    const saved = await this.entryRepo.save(entry);
    return this.mapEntry(saved);
  }

  async remove(userId: string, id: string): Promise<void> {
    const entry = await this.getOwnedEntryOrThrow(userId, id);
    await this.entryRepo.remove(entry);
  }

  private async getBeerOrThrow(beerId: string): Promise<Beer> {
    const normalizedId = this.normalizeId(beerId);
    const beer = await this.beerRepo.findOne({ where: { id: normalizedId, isActive: true } });
    if (!beer) {
      throw new NotFoundException(`The beer with ID ${normalizedId} was not found.`);
    }
    return beer;
  }

  private async getOwnedEntryOrThrow(userId: string, id: string): Promise<UserBeerEntry> {
    const normalizedId = this.normalizeId(id);
    const entry = await this.entryRepo.findOne({
      where: { id: normalizedId },
      relations: ['user', 'beer', 'beer.brewery'],
    });
    if (!entry) {
      throw new NotFoundException(`The entry with ID ${normalizedId} was not found.`);
    }
    if (entry.user.id !== userId) {
      throw new ForbiddenException('You can only edit your own entries.');
    }
    return entry;
  }

  private reload(id: string): Promise<UserBeerEntry> {
    return this.entryRepo.findOneOrFail({
      where: { id },
      relations: ['beer', 'beer.brewery'],
    });
  }

  private normalizeId(id: string): string {
    const normalizedId = id.trim();
    if (!UUID_REGEX.test(normalizedId)) {
      throw new NotFoundException(`The ID ${normalizedId} is invalid.`);
    }
    return normalizedId;
  }

  private mapEntry(entry: UserBeerEntry) {
    return {
      id: entry.id,
      status: entry.status,
      note: entry.note ?? null,
      addedAt: entry.addedAt,
      beer: entry.beer
        ? {
            id: entry.beer.id,
            name: entry.beer.name,
            imageUrl: entry.beer.imageUrl ?? null,
            brewery: entry.beer.brewery?.name ?? null,
          }
        : null,
    };
  }
}
