import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateEmpresaDto } from './create-empresa.dto';

export class UpdateEmpresaDto extends PartialType(
    CreateEmpresaDto,
) {
    @ApiProperty({
        description: 'El codigo de la empresa',
        example: '1',
    })
    @IsOptional()
    @IsString()
    codigo?: string;

    @ApiProperty({
        description: 'El RUC de la empresa',
        example: 'Activo',
    })
    @IsOptional()
    @IsString()
    ruc?: string;

    @ApiProperty({
        description: 'El nombre de la empresa',
        example: 'Activo',
    })
    @IsOptional()
    @IsString()
    nombre?: string;

    @ApiProperty({
        description: 'El correo de la empresa',
        example: 'Activo',
    })
    @IsOptional()
    @IsString()
    correo?: string;

    @ApiProperty({
        description: 'El telefono de la empresa',
        example: 'Activo',
    })
    @IsString()
    @IsOptional()
    telefono?: string;

    @ApiProperty({
        description: 'La direccion de la empresa',
        example: 'Activo',
    })
    @IsString()
    @IsOptional()
    direccion?: string;

    @ApiProperty({
        description: 'El logo de la empresa',
        example: 'Activo',
    })
    @IsString()
    @IsOptional()
    logo?: string;
}
