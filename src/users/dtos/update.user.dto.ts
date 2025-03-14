import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create.user.dto';
import { IsOptional, IsBoolean, IsString, MinLength, ValidateIf, IsNumber } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
     @ApiPropertyOptional({
          description: 'ID del usuario',
          example: 1,
     })
     @IsOptional()
     @IsNumber()
     id?: number;

     @ApiPropertyOptional({
          description: 'Estado activo del usuario',
          example: true,
     })
     @IsOptional()
     @IsBoolean()
     active?: boolean;

     @ApiPropertyOptional({
          description: 'Contraseña del usuario',
          minLength: 6,
          example: '123456',
     })
     @IsString()
     @MinLength(6)
     @ValidateIf((o) => o.password !== undefined && o.password !== '') // Evita validar si es undefined o vacío
     password?: string;

     @ApiPropertyOptional({
          description: 'Lista de empresas y roles a asignar',
          type: [CreateUserDto['empresas']],
     })
     @IsOptional()
     empresas?: CreateUserDto['empresas'];
}