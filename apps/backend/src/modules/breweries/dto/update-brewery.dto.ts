import { PartialType } from '@nestjs/swagger';
import { CreateBreweryDto } from './create-brewery.dto';

export class UpdateBreweryDto extends PartialType(CreateBreweryDto) {}
