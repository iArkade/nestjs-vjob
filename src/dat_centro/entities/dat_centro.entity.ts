import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'dat_centro' })
export class DatCentro {

     @PrimaryGeneratedColumn()
     id: number;

     @Column({ unique: true, nullable: true, default: null }) 
     codigo: string;

     @Column({ nullable: true }) 
     nombre: string;

     @Column({ default: true  }) 
     activo: boolean

     @Column({nullable: true, default: null }) 
     codigo_empresa: string;


     // @CreateDateColumn({ name: 'created_at' })  // Fecha de creación automática
     // createdAt: Date;
     // @UpdateDateColumn({ name: 'updated_at' })  // Fecha de actualización automática
     // updatedAt: Date;
}
