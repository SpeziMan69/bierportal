import { IsNotEmpty, MinLength, Matches, IsEmail } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @MinLength(4)
  @Matches(/^[^ ,/!\\]+$/, {
    message: 'Username cannot contain space, comma, slash, backslash or exclamation mark',
  })
  username!: string;

  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).*$/, {
    message: 'Password must contain upper- and lowercase letters and numbers/special characters',
  })
  password!: string;
}
