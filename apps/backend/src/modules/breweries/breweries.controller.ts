import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BreweriesService } from './breweries.service';
import { imageUploadOptions } from '../../common/upload/image-upload.options';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';
import { CreateBreweryDto } from './dto/create-brewery.dto';
import { UpdateBreweryDto } from './dto/update-brewery.dto';

@ApiTags('breweries')
@Controller('breweries')
export class BreweriesController {
  constructor(private readonly breweriesService: BreweriesService) {}

  @ApiOperation({
    summary: 'Create a new brewery',
    description: 'Creates a new brewery. Requires authentication.',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBreweryDto: CreateBreweryDto) {
    return this.breweriesService.create(createBreweryDto);
  }

  @ApiOperation({
    summary: 'Update an existing brewery',
    description: 'Updates the given fields of a brewery by its UUID. Requires authentication.',
  })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBreweryDto: UpdateBreweryDto) {
    return this.breweriesService.update(id, updateBreweryDto);
  }

  @ApiOperation({
    summary: 'Delete a brewery',
    description: 'Deletes a brewery by its UUID. Requires authentication.',
  })
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
  @UseGuards(JwtAuthGuard)
  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo', imageUploadOptions('breweries')))
  uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.breweriesService.updateLogo(id, file);
  }
}
