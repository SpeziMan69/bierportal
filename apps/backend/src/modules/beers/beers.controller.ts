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
import { BeersService } from './beers.service';
import { imageUploadOptions } from '../../common/upload/image-upload.options';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';

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

  @UseGuards(JwtAuthGuard)
  @Post(':id/image')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions('beers')))
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.beersService.updateImage(id, file);
  }
}
