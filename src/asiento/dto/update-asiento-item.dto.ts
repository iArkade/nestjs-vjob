import { PartialType } from '@nestjs/swagger';
import { CreateAsientoItemDto } from './create-asiento-item.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateAsientoItemDto extends PartialType(CreateAsientoItemDto) {
     @IsOptional()
     @IsNumber()
     id?: number;
}