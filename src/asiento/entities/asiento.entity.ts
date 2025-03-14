import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AsientoItem } from './asiento-item.entity';

@Entity({ name: 'asiento' })
@Index(['empresa_id', 'codigo_transaccion'], { unique: true })
export class Asiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  empresa_id: number;

  @Column({ type: 'date', nullable: true })
  fecha_emision: Date;

  @Column({ nullable: true })
  nro_asiento: string;

  @Column({ nullable: true })
  comentario: string;

  @Column()
  codigo_transaccion: string;

  @Column()
  estado: string;

  @Column({ nullable: true })
  nro_referencia: string;

  // @Column()
  // secuencial: string;

  @Column()
  codigo_centro: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_debe: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_haber: number;

  // Relación con AsientoItem
  @OneToMany(() => AsientoItem, (asientoItem) => asientoItem.asiento, {
    cascade: true,
    eager: false,
  })
  lineItems: AsientoItem[];
}
