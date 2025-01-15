import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'dat_centro' })
export class DatCentro {

     @PrimaryGeneratedColumn()
     id: number;

     @Column({ nullable: false })
     empresa_id: number;

     @Column({ unique: true, nullable: true, default: null }) 
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
