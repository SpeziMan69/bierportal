import { Controller, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BreweriesService } from './breweries.service';
import { imageUploadOptions } from '../../common/upload/image-upload.options';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';

@Controller('breweries')
export class BreweriesController {
  constructor(private readonly breweriesService: BreweriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo', imageUploadOptions('breweries')))
  uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.breweriesService.updateLogo(id, file);
  }
}
