import { IsOptional, IsString, IsNumber, IsUUID, Min, Max, MaxLength } from 'class-validator';

export class UpdateBeerDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  abv?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ibu?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ebc?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  style?: string;

  @IsOptional()
  @IsUUID()
  breweryId?: string;
}
