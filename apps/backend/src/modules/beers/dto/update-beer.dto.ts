import { PartialType } from '@nestjs/swagger';
import { CreateBeerDto } from './create-beer.dto';

export class UpdateBeerDto extends PartialType(CreateBeerDto) {}
