import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'empresa' })
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
     logo: string;

     @CreateDateColumn({ name: 'created_at' })
     createdAt: Date;

}

