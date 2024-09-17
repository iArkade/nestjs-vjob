import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AccountingPlanModule } from './accounting-plan/accounting-plan.module';
import { dataSourceOptions } from 'db/data-source';

// Type ORM para Oracle, tener en cuenta que aqui no funciona eso de enum
// TypeOrmModule.forRoot({
//   type: 'oracle',
//   host: 'DESKTOP-7GSSPPR',
//   port: 1521,
//   username: 'HOSPI',
//   password: 'HOSPI24d',
//   serviceName: 'HOSPI',
//   database: 'HOSPI',
//   entities: [__dirname + '/**/*.entity{.ts,.js}'],
// }),

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions
    }), 
    UsersModule,
    AuthModule,
    AccountingPlanModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
