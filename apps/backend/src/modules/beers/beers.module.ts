import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Beer } from '../../common/entities/beer.entity';
import { Brewery } from '../../common/entities/brewery.entity';
import { BeerStyle } from '../../common/entities/beer-style.entity';
import { BeersController } from './beers.controller';
import { BeersService } from './beers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Beer, Brewery, BeerStyle])],
  controllers: [BeersController],
  providers: [BeersService],
})
export class BeersModule {}
