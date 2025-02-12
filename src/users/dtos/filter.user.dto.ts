import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { SystemRole } from "../enums/role.enum";

export class FilterUsersDto {
    @ApiPropertyOptional({ 
        description: 'Filtrar por email',
        example: 'usuario@ejemplo.com' 
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ 
        description: 'Filtrar por rol en el sistema',
        enum: SystemRole 
    })
    @IsOptional()
    @IsEnum(SystemRole)
    systemRole?: SystemRole;

    @ApiPropertyOptional({ 
        description: 'Filtrar por estado activo',
        example: true 
    })
    @IsOptional()
    @IsBoolean()
    active?: boolean;

    @ApiPropertyOptional({ 
        description: 'Número de página',
        example: 1,
        minimum: 1 
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ 
        description: 'Elementos por página',
        example: 10,
        minimum: 1 
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number = 10;
}