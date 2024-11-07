import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class CreateDatCentroDto {
     @ApiProperty({
          description: 'Código único de la compañía',
          example: 'COMP123',
          nullable: true,
     })
     @IsString()
     @IsOptional()
     codigo_empresa?: string;

     @ApiProperty({
          description: 'Código único del centro',
          example: 'CENT456',
          nullable: true,
     })
     @IsString()
     @IsOptional()
     codigo?: string;
     
     @ApiProperty({
     description: 'Nombre del centro',
     example: 'Centro 1',
     nullable: true,
     })
     @IsString()
     @IsOptional()
     nombre?: string;
     
     @ApiProperty({
     description: 'Estado activo del centro',
     example: true,
     default: true,
     })
     @IsBoolean()
     @IsOptional()
     activo?: boolean;
}
