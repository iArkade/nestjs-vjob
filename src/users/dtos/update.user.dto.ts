import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create.user.dto';
import { IsOptional, IsBoolean, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateUserDto extends PartialType(
     OmitType(CreateUserDto, ['systemRole'] as const) // Excluir systemRole de la herencia
) {
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
     @ValidateIf((o) => o.password !== undefined) // Solo validar si se proporciona
     password?: string;

     @ApiPropertyOptional({
          description: 'Lista de empresas y roles a asignar',
          type: [CreateUserDto['empresas']],
     })
     @IsOptional()
     empresas?: CreateUserDto['empresas'];
}