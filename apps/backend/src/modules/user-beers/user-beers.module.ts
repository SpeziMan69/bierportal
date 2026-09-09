import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBeerEntry } from '../../common/entities/user-entry.entity';
import { Beer } from '../../common/entities/beer.entity';
import { UserBeersController } from './user-beers.controller';
import { UserBeersService } from './user-beers.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserBeerEntry, Beer])],
  controllers: [UserBeersController],
  providers: [UserBeersService],
})
export class UserBeersModule {}
