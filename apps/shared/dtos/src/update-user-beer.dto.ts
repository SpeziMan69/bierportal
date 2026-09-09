import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BeerStatus } from './beer-status.enum';

export class UpdateUserBeerDto {
  @IsOptional()
  @IsEnum(BeerStatus)
  status?: BeerStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
