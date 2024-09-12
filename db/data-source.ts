import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config(); // Para cargar el archivo .env

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
     type: 'mysql',
     host: configService.get('DB_HOST'),
     port: configService.get('DB_PORT'),
     username: configService.get('DB_USERNAME'),
     password: configService.get('DB_PASSWORD'),
     database: configService.get('DB_DATABASE'),
     entities: [__dirname + '/../**/*.entity.ts'], 
     migrations: [__dirname + '/../db/migrations/*.ts'],
     synchronize: false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
