import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { BeersService } from './beers.service';

@Controller('beers')
export class BeersController {
  constructor(private readonly beersService: BeersService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
  ) {
    return this.beersService.findAll(page, limit);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.beersService.findOne(id);
  }
}