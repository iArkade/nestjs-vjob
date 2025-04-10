import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: "permisos" })
export class Permisos {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    rol!: string; // Ej: 'admin', 'editor', 'lector'

    @Column()
    recurso!: string; // Ej: 'usuarios', 'empresas', 'reportes'

    @Column()
    accion!: string; // Ej: 'crear', 'leer', 'actualizar', 'eliminar'
}