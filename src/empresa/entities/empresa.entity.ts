import { AccountingPlan } from "src/accounting-plan/entities/accounting-plan.entity";
import { UsuarioEmpresa } from "src/usuario_empresa/entities/usuario_empresa.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "empresa" })
export class Empresa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  codigo: string;

  @Column({ unique: true })
  ruc: string;

  @Column()
  nombre: string;

  @Column()
  correo: string;

  @Column()
  telefono: string;

  @Column()
  direccion: string;

  @Column({ nullable: true })
  logo?: string;

  @OneToMany(() => AccountingPlan, (plan) => plan.empresa)
  accountingPlans: AccountingPlan[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @OneToMany(() => UsuarioEmpresa, (usuarioEmpresa) => usuarioEmpresa.empresa)
  usuarios: UsuarioEmpresa[];
}
