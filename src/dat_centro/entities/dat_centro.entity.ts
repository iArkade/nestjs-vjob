import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'dat_centro' })
@Index(['empresa_id', 'codigo'], { unique: true })
export class DatCentro {

     @PrimaryGeneratedColumn()
     id: number;

     @Column({ nullable: false })
     empresa_id: number;

     @Column({ nullable: false, default: null }) 
     codigo: string;

     @Column({ nullable: true }) 
     nombre: string;

     @Column({ default: true  }) 
     activo: boolean

     @CreateDateColumn({ name: 'created_at' })  // Fecha de creación automática
     createdAt: Date;
     // @UpdateDateColumn({ name: 'updated_at' })  // Fecha de actualización automática
     // updatedAt: Date;
}
