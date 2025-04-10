import { ApiProperty } from "@nestjs/swagger";
import { SystemRole } from "../enums/role.enum";
import { AssignCompanyDto } from "./create.user.dto";

export class UserResponseDto {
    @ApiProperty({ example: 1 })
    id!: number;

    @ApiProperty({ example: 'usuario@ejemplo.com' })
    email!: string;

    @ApiProperty({ example: 'Juan' })
    name!: string;

    @ApiProperty({ example: 'Pérez' })
    lastname!: string;

    @ApiProperty({ enum: SystemRole, example: SystemRole.USER })
    systemRole!: SystemRole;

    @ApiProperty({ example: true })
    active!: boolean;

    @ApiProperty({
        description: 'Lista de empresas asignadas',
        type: [AssignCompanyDto]
    })
    empresas!: AssignCompanyDto[];

    @ApiProperty({ example: '2024-02-11T12:00:00.000Z' })
    createdAt!: Date;
}