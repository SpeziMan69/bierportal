import { IsNotEmpty, IsOptional, IsString, IsNumber, IsUUID, Min, Max } from 'class-validator';

export class CreateBeerDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
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
  imageUrl?: string;

  @IsOptional()
  @IsUUID()
  breweryId?: string;

  @IsOptional()
  @IsUUID()
  styleId?: string;
}
