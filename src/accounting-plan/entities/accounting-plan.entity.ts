import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Entity({ name: 'accounting_plan' })
export class AccountingPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  code: string; // Hacemos que `code` no sea único globalmente, ya que dependerá del contexto de empresa

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false })
  empresa_id: number; // Renombrado para mayor claridad

  @ManyToOne(() => Empresa, (empresa) => empresa.accountingPlans, {
    onDelete: 'CASCADE',
  }) // Relación con tabla `Company`
  @JoinColumn({ name: 'empresa_id' })
  empresa: Empresa;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
