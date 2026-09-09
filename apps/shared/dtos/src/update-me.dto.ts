import { IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'The username may only contain letters, numbers and underscores.',
  })
  username?: string;

  @IsOptional()
  @IsUrl({}, { message: 'The picture must be a valid URL.' })
  @MaxLength(2048)
  picture?: string;
}
