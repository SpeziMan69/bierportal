import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brewery } from '../../common/entities/brewery.entity';
import { BreweriesController } from './breweries.controller';
import { BreweriesService } from './breweries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Brewery])],
  controllers: [BreweriesController],
  providers: [BreweriesService],
})
export class BreweriesModule {}
