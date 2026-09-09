import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BreweriesService } from './breweries.service';
import { imageUploadOptions } from '../../common/upload/image-upload.options';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';
import { CreateBreweryDto, UpdateBreweryDto } from '@bierportal/dtos';

@ApiTags('breweries')
@Controller('breweries')
export class BreweriesController {
  constructor(private readonly breweriesService: BreweriesService) {}

  @ApiOperation({
    summary: 'List breweries (paginated, filterable)',
    description:
      'Returns a paginated list of breweries. Supports `page`, `limit`, `q` (name/city search), `city` and `country` query params.',
  })
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('city') city?: string,
    @Query('country') country?: string,
  ) {
    return this.breweriesService.findAll({ page, limit, q, city, country });
  }

  @ApiOperation({
    summary: 'Get a single brewery by id',
    description: 'Returns one brewery by its UUID, or 404 if it does not exist.',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.breweriesService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create a new brewery',
    description: 'Creates a new brewery. Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBreweryDto: CreateBreweryDto) {
    return this.breweriesService.create(createBreweryDto);
  }

  @ApiOperation({
    summary: 'Update an existing brewery',
    description: 'Updates the given fields of a brewery by its UUID. Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBreweryDto: UpdateBreweryDto) {
    return this.breweriesService.update(id, updateBreweryDto);
  }

  @ApiOperation({
    summary: 'Delete a brewery',
    description: 'Deletes a brewery by its UUID. Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.breweriesService.remove(id);
  }

  @ApiOperation({
    summary: 'Upload a brewery logo',
    description: 'Uploads/replaces the logo for a brewery. Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo', imageUploadOptions('breweries')))
  uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.breweriesService.updateLogo(id, file);
  }
}
