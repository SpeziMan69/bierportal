import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Beer } from '../../common/entities/beer.entity';
import { BeersController } from './beers.controller';
import { BeersService } from './beers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Beer])],
  controllers: [BeersController],
  providers: [BeersService],
})
export class BeersModule {}
