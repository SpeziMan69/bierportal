import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserBeersService } from './user-beers.service';
import { JwtAuthGuard } from '../auth/guards/jwt.authguard';
import { CreateUserBeerDto } from './dto/create-user-beer.dto';
import { UpdateUserBeerDto } from './dto/update-user-beer.dto';
import { BeerStatus } from '../../common/entities/user-entry.entity';

type AuthedRequest = Request & { user: { id: string } };

@ApiTags('user-beers')
@UseGuards(JwtAuthGuard)
@Controller('user-beers')
export class UserBeersController {
  constructor(private readonly userBeersService: UserBeersService) {}

  @ApiOperation({
    summary: 'List your beer entries',
    description: "Returns the current user's beer entries, optionally filtered by `status`.",
  })
  @Get()
  findAll(@Req() req: AuthedRequest, @Query('status') status?: BeerStatus) {
    return this.userBeersService.findAllForUser(req.user.id, status);
  }

  @ApiOperation({
    summary: 'Add or update a beer entry',
    description:
      'Marks a beer as tried/wishlist/cellar for the current user. Updates the entry if it already exists.',
  })
  @Post()
  upsert(@Req() req: AuthedRequest, @Body() dto: CreateUserBeerDto) {
    return this.userBeersService.upsert(req.user.id, dto);
  }

  @ApiOperation({
    summary: 'Update a beer entry',
    description: 'Updates the status/note of one of your beer entries.',
  })
  @Patch(':id')
  update(@Req() req: AuthedRequest, @Param('id') id: string, @Body() dto: UpdateUserBeerDto) {
    return this.userBeersService.update(req.user.id, id, dto);
  }

  @ApiOperation({
    summary: 'Remove a beer entry',
    description: 'Removes one of your beer entries.',
  })
  @Delete(':id')
  @HttpCode(204)
  remove(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.userBeersService.remove(req.user.id, id);
  }
}
