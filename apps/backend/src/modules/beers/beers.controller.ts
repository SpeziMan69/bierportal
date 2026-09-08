import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BeersService } from './beers.service';
import { imageUploadOptions } from '../../common/upload/image-upload.options';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';

@ApiTags('beers')
@Controller('beers')
export class BeersController {
  constructor(private readonly beersService: BeersService) {}

  @ApiOperation({
    summary: 'List beers (paginated)',
    description: 'Returns a paginated list of active beers. Use `page` and `limit` query params.',
  })
  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(24), ParseIntPipe) limit: number,
  ) {
    return this.beersService.findAll(page, limit);
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
    summary: 'Upload a beer image',
    description: 'Uploads/replaces the image for a beer. Requires authentication.',
  })
  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions('beers')))
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.beersService.updateImage(id, file);
  }
}
