import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class CreateAsientoItemDto {

     // @ApiProperty({
     //      description: 'Código de la empresa',
     //      example: '1',
     // })
     // @IsNumber()
     // empresa_id: number;

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
     @IsNumber()
     debe: number;

     @ApiProperty({
          description: 'Monto en el haber',
          example: 500.00,
     })
     @IsNumber()
     haber: number;

     @ApiProperty({
          description: 'Nota opcional para el ítem',
          example: 'Pago realizado',
          required: false,
     })
     @IsString()
     nota?: string;
}
