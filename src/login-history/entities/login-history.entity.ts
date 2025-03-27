import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "login-history" })
export class LoginHistory {
     @PrimaryGeneratedColumn()
     id: number;

     @Column()
     ip: string;

     @Column()
     browser: string;

     @Column()
     os: string;

     @Column()
     userId: number;

     @Column()
     userName: string;

     @CreateDateColumn({ type: 'timestamp' })
     timestamp: Date;

}
