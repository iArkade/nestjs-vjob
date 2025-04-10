import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Empresa } from '../../empresa/entities/empresa.entity';

@Entity({ name: 'accounting_plan' })
@Index(['empresa_id', 'code'], { unique: true })

export class AccountingPlan {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  code!: string; // Hacemos que `code` no sea único globalmente, ya que dependerá del contexto de empresa

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: false })
  empresa_id!: number;

  @ManyToOne(() => Empresa, (empresa) => empresa.accountingPlans, {
    onDelete: 'CASCADE',
  }) // Relación con tabla `Company`
  @JoinColumn({ name: 'empresa_id' })
  empresa!: Empresa;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
