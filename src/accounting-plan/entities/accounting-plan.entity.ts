import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'accounting_plan' })
export class AccountingPlan {

     @PrimaryGeneratedColumn()
     id: number;

     @Column({unique: true, nullable: false})
     code: string;

     @Column({ nullable: false }) 
     name: string;

     @Column({ unique: true, nullable: true }) 
     company_code: string;

     @CreateDateColumn({ name: 'created_at' })
     createdAt: Date;

}

