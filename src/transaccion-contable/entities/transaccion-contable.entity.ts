import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Index } from "typeorm";

@Entity({ name: 'transaccion-contable' })
@Index(['empresa_id', 'codigo_transaccion'], { unique: true })
export class TransaccionContable {

    @PrimaryGeneratedColumn() 
    id: number;

    @Column({ nullable: false })
    empresa_id: number;

    @Column({ nullable: false, default: null }) 
    codigo_transaccion: string;

    @Column({ nullable: true, default: null }) 
    nombre: string;

    @Column({ nullable: true, default: null }) 
    secuencial: string;

    @Column({ nullable: true, default: 0 }) 
    lectura: number;

    @Column({ nullable: true, default: 0 }) 
    activo: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

}

