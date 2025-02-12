import { Empresa } from "src/empresa/entities/empresa.entity";
import { Usuario } from "src/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CompanyRole } from "src/users/enums/role.enum";

@Entity({ name: 'usuario_empresa' })
export class UsuarioEmpresa {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Usuario, (usuario) => usuario.empresas)
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @ManyToOne(() => Empresa, (empresa) => empresa.usuarios)
    @JoinColumn({ name: 'empresaId' })
    empresa: Empresa;

    @Column({ type: 'enum', enum: CompanyRole, default: CompanyRole.USER })
    companyRole: CompanyRole;

    @CreateDateColumn({ name: 'assigned_at' })
    assignedAt: Date;

    // El superadmin que realizó esta asignación
    @ManyToOne(() => Usuario)
    @JoinColumn({ name: 'assigned_by' })
    assignedBy: Usuario;
}