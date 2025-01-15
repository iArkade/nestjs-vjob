import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";

export class CreateDatCentroDto {
     @ApiProperty({
          description: 'El id de la empresa',
          example: '1',
     })
     @IsString()
     empresa_id: number;

     @ApiProperty({
          description: 'Código único del centro', 
          example: 'CENT456',
          nullable: true,
     })
     @IsString()
     codigo: string;
     
     @ApiProperty({
     description: 'Nombre del centro',
     example: 'Centro 1',
     nullable: true,
     })
     @IsString()
     nombre: string;
     
     @ApiProperty({
     description: 'Estado activo del centro',
     example: 'true',
     })
     @IsBoolean()
     activo: boolean;
}
