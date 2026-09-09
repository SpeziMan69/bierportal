import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BeerStatus } from '../../../common/entities/user-entry.entity';

export class UpdateUserBeerDto {
  @IsOptional()
  @IsEnum(BeerStatus)
  status?: BeerStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
