import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from '../src/users/user.entity';
import { AccountingPlan } from '../src/accounting-plan/entities/accounting-plan.entity';

config(); // Para cargar el archivo .env

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
     type: 'mysql',
     host: configService.get('DB_HOST'),
     port: configService.get('DB_PORT'),
     username: configService.get('DB_USERNAME'),
     password: configService.get('DB_PASSWORD'),
     database: configService.get('DB_DATABASE'),
     entities: [User, AccountingPlan],
     migrations: [__dirname + '/../db/migrations/*.ts'],
     synchronize: configService.get('SINCRONIZE_DB'),
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
