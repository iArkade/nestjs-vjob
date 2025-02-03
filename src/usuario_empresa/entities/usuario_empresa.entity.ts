import { Empresa } from "src/empresa/entities/empresa.entity";
import { Usuario } from "src/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum Role {
    superadmin = 'superadmin',
    admin = 'admin',
    usuario = 'usuario'
}

@Entity({ name: 'usuario_empresa' })
export class UsuarioEmpresa {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Usuario, usuario => usuario.empresas)
    @JoinColumn({ name: 'usuarioId' })
    usuario: Usuario;

    @ManyToOne(() => Empresa, empresa => empresa.usuarios)
    @JoinColumn({ name: 'empresaId' })
    empresa: Empresa;

    @Column()
    rol: string;
}

