import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNumber, isNumber, IsOptional, isString, IsString, Matches } from 'class-validator';
import { CreateTransaccionContableDto } from './create-transaccion-contable.dto';

export class UpdateTransaccionContablenDto extends PartialType(CreateTransaccionContableDto) {

    @ApiProperty({
        description: 'El codigo de la transaccion',
        example: 'ABCD', // Parent account could be '1.', for example
    })
    @IsOptional()
    @IsString()
    codigo_transaccion?: string;  // Optional field

    @ApiProperty({
        description: 'El nombre de la transaccion contable',
        example: 'Asiento',
    })
    @IsOptional()
    @IsString()
    nombre?: string;  // Optional field

    @ApiProperty({
        description: 'El secuencial de la transaccion contable',
        example: 'Asiento',
    })
    @IsOptional()
    @IsString()
    secuencial?: string;  // Optional field

    @ApiProperty({
        description: '1 si es creada por default y 0 es creada manualmente(puede eliminar y editar)',
        example: '1',
    })
    @IsOptional()
    @IsNumber()
    lectura: number;

    @ApiProperty({
        description: '1 campo bloqueado y 0 campo no bloqueado)',
        example: 'true',
    })
    @IsOptional()
    @IsBoolean()
    activo: boolean;
}
