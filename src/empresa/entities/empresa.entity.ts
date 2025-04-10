import { AccountingPlan } from "../../accounting-plan/entities/accounting-plan.entity";
import { Usuario } from "../../users/entities/user.entity";
import { UsuarioEmpresa } from "../../usuario_empresa/entities/usuario_empresa.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "empresa" })
export class Empresa {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    codigo!: string;

    @Column({ unique: true })
    ruc!: string;

    @Column()
    nombre!: string;

    @Column()
    correo!: string;

    @Column()
    telefono!: string;

    @Column()
    direccion!: string;

    @Column({ nullable: true })
    logo?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    // El superadmin que creó esta empresa
    @ManyToOne(() => Usuario, (usuario) => usuario.empresasCreadas, {
        nullable: false
    })
    createdBy: Usuario = new Usuario;

    @OneToMany(() => AccountingPlan, (plan) => plan.empresa)
    accountingPlans!: AccountingPlan[];

    // Usuarios asignados a esta empresa
    @OneToMany(() => UsuarioEmpresa, (usuarioEmpresa) => usuarioEmpresa.empresa)
    usuarios!: UsuarioEmpresa[];
}