import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto{
     @ApiProperty({
          description: 'The email address of the user',
          example: 'user@example.com',
          format: 'email',
     })
     @IsEmail()
     @IsNotEmpty()
     email!: string;
     
     @ApiProperty({
          description: 'Password for the user account. It should be at least 6 characters long.',
          example: 'password123',
          minLength: 6,
     })
     @Transform(({ value }) => value.trim())
     @IsString()
     @IsNotEmpty()
     @MinLength(6)
     password!: string;

}
