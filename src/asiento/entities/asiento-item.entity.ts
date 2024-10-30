import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Asiento } from "./asiento.entity";


@Entity({ name: 'asiento_item' })
export class AsientoItem {
     @PrimaryGeneratedColumn()
     id: number;

     // @Column()
     // nro_asiento: string;

     // @Column()
     // nro_linea: number;

     // @Column()
     // codigo_contable: string;

     @Column()
     id_asiento_item: string;

     @Column()
     codigo_centro: string;

     @Column()
     cta: string;

     @Column()
     cta_nombre: string;

     @Column({ type: 'decimal', precision: 10, scale: 2 })
     debe: number;

     @Column({ type: 'decimal', precision: 10, scale: 2 })
     haber: number;

     @Column({ nullable: true })
     nota: string;

     // Relación con Asiento
     @ManyToOne(() => Asiento, (asiento) => asiento.items)
     @JoinColumn({ name: 'nro_asiento', referencedColumnName: 'nro_asiento' })
     asiento: Asiento;
}