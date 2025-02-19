import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyRole, SystemRole } from '../enums/role.enum';

export class AssignCompanyDto {
     @ApiProperty({ description: 'ID de la empresa' })
     @IsNotEmpty()
     @IsNumber()
     empresaId: number;

     @ApiProperty({
          description: 'Rol del usuario en la empresa',
          enum: CompanyRole
     })
     @IsEnum(CompanyRole)
     @IsNotEmpty()
     companyRole: CompanyRole;
}

export class CreateUserDto {
     @ApiProperty({
          description: 'Correo electrónico del usuario',
          example: 'usuario@ejemplo.com'
     })
     @IsEmail()
     @IsNotEmpty()
     email: string;

     @ApiProperty({
          description: 'Contraseña del usuario',
          minLength: 6,
          example: '123456'
     })
     @IsString()
     @MinLength(6)
     password: string;

     @ApiPropertyOptional({
          description: 'Nombre del usuario',
          example: 'Juan'
     })
     @IsString()
     @IsOptional()
     name?: string;

     @ApiPropertyOptional({
          description: 'Apellido del usuario',
          example: 'Pérez'
     })
     @IsString()
     @IsOptional()
     lastname?: string;

     @ApiPropertyOptional({
          description: 'Lista de empresas y roles a asignar',
          type: [AssignCompanyDto]
     })
     @IsOptional()
     @ValidateNested({ each: true })
     @Type(() => AssignCompanyDto)
     empresas?: AssignCompanyDto[];
}