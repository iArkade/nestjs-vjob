import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

if (!process.env.DB_HOST || !process.env.DB_PORT) {
     throw new Error('Faltan variables de entorno para la DB');
}

export const dataSourceOptions: DataSourceOptions = {
     type: 'mysql',
     host: process.env.DB_HOST,
     port: parseInt(process.env.DB_PORT ?? '3306'),
     username: process.env.DB_USERNAME,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_DATABASE,
     entities: [__dirname + '/../**/*.entity{.ts,.js}'],
     migrations: [__dirname + '/migrations/*{.ts,.js}'],
     synchronize: false, 
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
