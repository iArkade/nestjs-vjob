import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum Role {
     USER = 'USER',
     ADMIN = 'ADMIN',
}

@Entity({ name: 'users' })
export class User {
     @PrimaryGeneratedColumn()
     id: number;

     @Column({unique: true})
     email: string;

     @Column({ nullable: true }) // nullable: true indica que este campo es opcional en la base de datos
     name?: string;

     @Column({ nullable: true })
     lastname?: string;

     @Column({
          type: "enum",
          enum: Role,
          default: Role.USER // O puedes definir un valor por defecto
     })
     role: Role;

     @Column()
     password: string;

     @Column({ default: true }) // Puedes definir un valor por defecto si es necesario
     active: boolean;

     @Column({ nullable: true })
     tokens?: string;

}

