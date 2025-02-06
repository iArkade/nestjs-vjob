import { UsuarioEmpresa } from "src/usuario_empresa/entities/usuario_empresa.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../enums/role.enum";


@Entity({ name: 'usuarios' })
export class Usuario {
     @PrimaryGeneratedColumn()
     id: number;

     @Column({unique: true})
     email: string;

     @Column({ nullable: true }) // nullable: true indica que este campo es opcional en la base de datos
     name?: string;

     @Column({ nullable: true })
     lastname?: string;

     @Column()
     password: string;

     @Column({ default: true }) // Puedes definir un valor por defecto si es necesario
     active: boolean;

     @Column({ type: 'enum', enum: Role, default: Role.USER })
     role: Role;

     @Column({ nullable: true, length: 2024 })
     tokens?: string;

     @Column({ default: false })
     superAdmin: boolean;

     @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
     createdAt: Date;
          
     @OneToMany(() => UsuarioEmpresa, (usuarioEmpresa) => usuarioEmpresa.usuario)
     empresas: UsuarioEmpresa[];
}

