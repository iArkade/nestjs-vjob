import { DataSourceOptions } from "typeorm";

if (!process.env.DB_HOST || !process.env.DB_PORT) {
     throw new Error("Faltan variables de entorno para la DB");
}

export const dataSourceOptions: DataSourceOptions = {
     type: 'mysql',
     host: process.env.DB_HOST || 'localhost',
     port: parseInt(process.env.DB_PORT ?? '3306'),
     username: process.env.DB_USERNAME || 'root',
     password: process.env.DB_PASSWORD || '',
     database: process.env.DB_DATABASE || 'nest_type_orm',
     entities: [__dirname + '/../**/*.entity{.ts,.js}'],
     migrations: [__dirname + '/../db/migrations/*.ts'],
     synchronize: process.env.SYNCHRONIZE_DB === 'true', // false en producción
};
