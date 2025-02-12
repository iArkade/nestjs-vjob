import { UsuarioEmpresa } from "src/usuario_empresa/entities/usuario_empresa.entity";
import { Column, Entity, OneToMany, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { SystemRole } from "../enums/role.enum";
import { Empresa } from "src/empresa/entities/empresa.entity";

@Entity({ name: 'usuario' })
export class Usuario {
     @PrimaryGeneratedColumn()
     id: number;

     @Column({ unique: true })
     email: string;

     @Column({ nullable: true })
     name?: string;

     @Column({ nullable: true })
     lastname?: string;

     @Column()
     password: string;

     @Column({ default: true })
     active: boolean;

     @Column({ type: 'enum', enum: SystemRole, default: SystemRole.USER })
     systemRole: SystemRole;

     @Column({ nullable: true, length: 2024 })
     tokens?: string;

     @CreateDateColumn({ name: 'created_at' })
     createdAt: Date;

     // El superadmin que creó este usuario (null si es un superadmin)
     @ManyToOne(() => Usuario, (usuario) => usuario.usuariosCreados, {
          nullable: true,
          onDelete: 'SET NULL'
     })
     createdBy: Usuario;

     // Usuarios creados por este superadmin
     @OneToMany(() => Usuario, (usuario) => usuario.createdBy)
     usuariosCreados: Usuario[];

     // Empresas asignadas a través de la tabla pivote
     @OneToMany(() => UsuarioEmpresa, (usuarioEmpresa) => usuarioEmpresa.usuario)
     empresas: UsuarioEmpresa[];

     // Empresas creadas por este superadmin
     @OneToMany(() => Empresa, (empresa) => empresa.createdBy)
     empresasCreadas: Empresa[];
}