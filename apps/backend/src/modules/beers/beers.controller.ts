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
import { BeersService, type BeerSort } from './beers.service';
import { imageUploadOptions } from '../../common/upload/image-upload.options';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';
import { CreateBeerDto, UpdateBeerDto } from '@bierportal/dtos';

@ApiTags('beers')
@Controller('beers')
export class BeersController {
  constructor(private readonly beersService: BeersService) {}

  @ApiOperation({
    summary: 'List beers (paginated, filterable)',
    description:
      'Returns a paginated list of active beers. Supports `page`, `limit`, `q` (name/brewery search), `style`, `country` and `sort` query params.',
  })
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
    @Query('q') q?: string,
    @Query('style') style?: string,
    @Query('country') country?: string,
    @Query('sort') sort?: BeerSort,
  ) {
    return this.beersService.findAll({ page, limit, q, style, country, sort });
  }
  @ApiOperation({
    summary: 'Get a single beer by id',
    description: 'Returns one active beer by its UUID, or 404 if it does not exist.',
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.beersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create a new beer',
    description: 'Creates a new beer. Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBeerDto: CreateBeerDto) {
    return this.beersService.create(createBeerDto);
  }

  @ApiOperation({
    summary: 'Update an existing beer',
    description: 'Updates the given fields of a beer by its UUID. Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBeerDto: UpdateBeerDto) {
    return this.beersService.update(id, updateBeerDto);
  }

  @ApiOperation({
    summary: 'Delete a beer',
    description: 'Soft-deletes a beer by its UUID (marks it inactive). Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.beersService.remove(id);
  }

  @ApiOperation({
    summary: 'Upload a beer image',
    description: 'Uploads/replaces the image for a beer. Requires authentication.',
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions('beers')))
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.beersService.updateImage(id, file);
  }
}
