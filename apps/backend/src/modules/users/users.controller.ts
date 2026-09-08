import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
