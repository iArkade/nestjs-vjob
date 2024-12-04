import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateAsientoDto } from './create-asiento.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateAsientoItemDto } from './update-asiento-item.dto';

export class UpdateAsientoDto extends PartialType(
     OmitType(CreateAsientoDto, ['lineItems'] as const), // Excluir lineItems para redefinirlo
) {
     @ApiProperty({
          description: 'Lista de items del asiento a actualizar',
          type: [UpdateAsientoItemDto],
          required: false,
     })
     @IsArray()
     @ValidateNested({ each: true })
     @Type(() => UpdateAsientoItemDto)
     @IsOptional()
     lineItems?: UpdateAsientoItemDto[];
}