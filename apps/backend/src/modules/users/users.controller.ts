import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Get(':id/reviews')
  getReviews(@Param('id') id: string) {
    return this.usersService.getReviews(id);
  }

  @Get(':id/likes')
  getLikes(@Param('id') id: string) {
    return this.usersService.getLikes(id);
  }
}
