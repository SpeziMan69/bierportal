import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { imageUploadOptions } from '../../common/upload/image-upload.options';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';
import { UpdateMeDto } from '@bierportal/dtos';

type AuthedRequest = Request & { user: { id: string } };

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Update your own profile',
    description: "Updates the authenticated user's username and/or picture. Requires auth.",
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: AuthedRequest, @Body() dto: UpdateMeDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Upload your avatar',
    description: "Uploads/replaces the authenticated user's profile picture. Requires auth.",
  })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar', imageUploadOptions('users')))
  uploadAvatar(@Req() req: AuthedRequest, @UploadedFile() file: Express.Multer.File) {
    return this.usersService.updateAvatar(req.user.id, file);
  }

  @ApiOperation({
    summary: 'Get a user profile',
    description:
      'Returns the public profile (username, picture, created date) plus review and like counts.',
  })
  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @ApiOperation({
    summary: "Get a user's reviews",
    description: 'Returns the ratings and comments the user has written, newest first.',
  })
  @Get(':id/reviews')
  getReviews(@Param('id') id: string) {
    return this.usersService.getReviews(id);
  }

  @ApiOperation({
    summary: "Get a user's likes",
    description: 'Returns the reviews the user has liked, newest first.',
  })
  @Get(':id/likes')
  getLikes(@Param('id') id: string) {
    return this.usersService.getLikes(id);
  }
}
