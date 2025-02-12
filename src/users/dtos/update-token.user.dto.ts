import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateUserTokenDto {
    @ApiProperty({ 
        description: 'Token de autenticación del usuario',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' 
    })
    @IsString()
    @IsOptional()
    tokens?: string;
}