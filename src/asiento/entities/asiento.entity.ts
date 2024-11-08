import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AsientoItem } from "./asiento-item.entity";

@Entity({ name: 'asiento' })
export class Asiento {
     @PrimaryGeneratedColumn()
     id: number;

     @Column({ nullable: true })
     fecha_emision: string;

     @Column({ nullable: true })
     nro_asiento: string;

     @Column({ nullable: true })
     comentario: string;

     @Column()
     tipo_transaccion: string;

     @Column()
     estado: string;

     @Column({ nullable: true })
     nro_referencia: string;

     @Column()
     secuencial: string;

     @Column()
     codigo_centro: string;

     @Column({ nullable: true })
     codigo_empresa: string;

     @Column({ type: 'decimal', precision: 10, scale: 2 })
     total_debe: number;

     @Column({ type: 'decimal', precision: 10, scale: 2 })
     total_haber: number;

     // Relación con AsientoItem
     @OneToMany(() => AsientoItem, (asientoItem) => asientoItem.asiento)
     lineItems: AsientoItem[];
}
