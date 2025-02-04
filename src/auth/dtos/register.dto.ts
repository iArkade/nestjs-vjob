import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";


export class RegisterDto{

     @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the user' })
     @IsEmail()
     @IsNotEmpty()
     email: string;

     @ApiProperty({ example: 'Daniel', description: 'The name of the user', required: false })
     @Transform(({value}) => value.trim())
     @IsString()
     @MinLength(1)
     @IsNotEmpty()  
     name: string;

     @ApiProperty({ example: 'Velasco', description: 'The lastname of the user', required: false })
     @Transform(({value}) => value.trim())
     @IsString()
     @MinLength(1)
     @IsNotEmpty()  
     lastname: string;

     @ApiProperty({ example: 'password', description: 'the password of the user' })
     @Transform(({value}) => value.trim())
     @IsString()
     @MinLength(6)
     password: string;

     @ApiProperty({ example: true, description: 'if the user is active or no' })
     @IsBoolean()
     active: boolean;

     @IsString()
     @IsOptional()   
     tokens?: string;

     @IsBoolean()
     @IsOptional()   
     superAdmin?: boolean;

}