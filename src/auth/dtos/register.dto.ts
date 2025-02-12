import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
     @ApiProperty({ example: 'john@example.com' })
     @IsEmail()
     @IsNotEmpty()
     email: string;

     @ApiProperty({ example: 'John' })
     @IsString()
     @IsOptional()
     name?: string;

     @ApiProperty({ example: 'Doe' })
     @IsString()
     @IsOptional()
     lastname?: string;

     @ApiProperty({ example: '123456' })
     @IsString()
     @MinLength(6)
     password: string;
}
