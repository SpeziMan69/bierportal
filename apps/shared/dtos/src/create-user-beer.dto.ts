import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BeerStatus } from './beer-status.enum';

export class CreateUserBeerDto {
  @IsUUID()
  beerId!: string;

  @IsEnum(BeerStatus)
  status!: BeerStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
