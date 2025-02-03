import { IsString, IsNotEmpty, IsBoolean, IsIn, IsOptional, IsEnum, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateUserRequestDto {

     @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the user' })
     @IsEmail()
     @IsOptional()
     email?: string;

     @ApiProperty({ example: 'Daniel', description: 'The name of the user' })
     @Transform(({value}) => value.trim())
     @IsString()
     @MinLength(1)
     @IsOptional()  
     name?: string;
     
     @ApiProperty({ example: 'Velasco', description: 'The lastname of the user' })
     @Transform(({value}) => value.trim())
     @IsString()
     @MinLength(1)
     @IsOptional()    
     lastname?: string;

     @ApiProperty({ example: 'password', description: 'the password of the user' })
     @IsString()
     @IsOptional()   
     password?: string;
     
     @ApiProperty({ example: true, description: 'if the user is active or no' })
     @IsBoolean()
     @IsOptional()
     active?: boolean;  

     @IsString()
     @IsOptional()   
     tokens?: string;
}
