import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsDate, IsDateString, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { CreateAsientoItemDto } from "./create-asiento-item.dto";

export class CreateAsientoDto {

     @ApiProperty({
          description: 'Fecha de emisión del asiento',
          example: '2023-10-23',
          format: 'date'
     })
     @IsDateString()
     fecha_emision: string;
     // @IsString()
     // fecha_emision: string;

     @ApiProperty({
          description: 'Número único del asiento',
          example: 'AS00123',
     })
     @IsString()
     nro_asiento: string;

     @ApiProperty({
          description: 'Comentario opcional',
          example: 'Comentario sobre el asiento',
          required: false,
     })
     @IsString()
     @IsOptional()
     comentario?: string;

     @ApiProperty({
          description: 'Tipo de transacción',
          example: 'Compra',
     })
     @IsString()
     tipo_transaccion: string;

     @ApiProperty({
          description: 'Estado del asiento',
          example: 'Activo',
     })
     @IsString()
     estado: string;

     @ApiProperty({
          description: 'Número de referencia opcional',
          example: 'REF12345',
          required: false,
     })
     @IsString()
     @IsOptional()
     nro_referencia?: string;

     @ApiProperty({
          description: 'Secuencial del asiento',
          example: '00001',
     })
     @IsString()
     secuencial: string;

     @ApiProperty({
          description: 'Código del centro',
          example: 'CC001',
     })
     @IsString()
     codigo_centro: string;

     @ApiProperty({
          description: 'Código de la empresa',
          example: 'EMP001',
     })
     @IsString()
     @IsOptional()
     codigo_empresa: string;

     @ApiProperty({
          description: 'Total del debe',
          example: 1000.00,
     })
     @IsNumber()
     total_debe: number;

     @ApiProperty({
          description: 'Total del haber',
          example: 1000.00,
     })
     @IsNumber()
     total_haber: number;

     @IsArray()
     @ValidateNested({ each: true })
     @Type(() => CreateAsientoItemDto)
     lineItems: CreateAsientoItemDto[];

}
