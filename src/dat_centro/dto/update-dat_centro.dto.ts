import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateDatCentroDto } from './create-dat_centro.dto';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateDatCentroDto extends PartialType(CreateDatCentroDto) {
    @ApiProperty({
            description: 'El codigo de la transaccion',
            example: 'ABCD', // Parent account could be '1.', for example
        })
        @IsOptional()
        @IsString()
        codigo?: string;  // Optional field
    
        @ApiProperty({
            description: 'El nombre de la transaccion contable',
            example: 'Asiento',
        })
        @IsOptional()
        @IsString()
        nombre?: string;  // Optional field
    
    
        @ApiProperty({
            description: '1 campo bloqueado y 0 campo no bloqueado)',
            example: 'true',
        })
        @IsOptional()
        @IsBoolean()
        activo: boolean;
}
