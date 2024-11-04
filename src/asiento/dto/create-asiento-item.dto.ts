import { ApiProperty } from "@nestjs/swagger";
import { IsDecimal, IsNumber, IsString } from "class-validator";

export class CreateAsientoItemDto {
     // @ApiProperty({
     //      description: 'Número del asiento al que pertenece el ítem',
     //      example: 'AS00123',
     // })
     // @IsString()
     // nro_asiento: string;

     // @ApiProperty({
     //      description: 'Número de línea del ítem',
     //      example: 1,
     // })
     // @IsNumber()
     // nro_linea: number;

     // @ApiProperty({
     //      description: 'Código contable asociado',
     //      example: 'C001',
     // })
     // @IsString()
     // codigo_contable: string;

     @ApiProperty({
          description: 'Código del centro',
          example: 'CC001',
     })
     @IsString()
     codigo_centro: string;

     @ApiProperty({
          description: 'Código contable ',
          example: '1.1',
     })
     @IsString()
     cta: string;

     @ApiProperty({
          description: 'Descripcion del código contable asociado',
          example: 'Activos Empresa',
     })
     @IsString()
     cta_nombre: string;

     @ApiProperty({
          description: 'Monto en el debe',
          example: 500.00,
     })
     @IsDecimal()
     debe: number;

     @ApiProperty({
          description: 'Monto en el haber',
          example: 500.00,
     })
     @IsDecimal()
     haber: number;

     @ApiProperty({
          description: 'Nota opcional para el ítem',
          example: 'Pago realizado',
          required: false,
     })
     @IsString()
     nota?: string;
}