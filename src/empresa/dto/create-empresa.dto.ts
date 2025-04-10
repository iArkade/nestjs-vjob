import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class CreateEmpresaDto {

     @ApiProperty({
          description: 'El codigo de la empresa',
          example: '1',
     })
     @IsNotEmpty()
     @IsString()
     codigo!: string;

     @ApiProperty({
          description: 'El RUC de la empresa',
          example: 'Activo',
     })
     @IsNotEmpty()
     @IsString()
     ruc!: string;

     @ApiProperty({
          description: 'El nombre de la empresa',
          example: 'Activo',
     })
     @IsNotEmpty()
     @IsString()
     nombre!: string;

     @ApiProperty({
          description: 'El correo de la empresa',
          example: 'Activo',
     })
     @IsNotEmpty()
     @IsEmail()
     correo!: string;

     @ApiProperty({
          description: 'El telefono de la empresa',
          example: 'Activo',
     })
     @IsNotEmpty()
     @IsString()
     telefono!: string;

     @ApiProperty({
          description: 'La direccion de la empresa',
          example: 'Activo',
     })
     @IsNotEmpty()
     @IsString()
     direccion!: string;

     @ApiProperty({
          description: 'La URL del logo de la empresa',
          example: 'Activo',
     })
     @IsOptional()
     @IsString()
     logo?: string;

}
