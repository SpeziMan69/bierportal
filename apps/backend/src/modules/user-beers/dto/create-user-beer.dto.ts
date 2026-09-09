import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BeerStatus } from '../../../common/entities/user-entry.entity';

export class CreateUserBeerDto {
  @IsUUID()
  beerId!: string;

  @IsEnum(BeerStatus)
  status!: BeerStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
