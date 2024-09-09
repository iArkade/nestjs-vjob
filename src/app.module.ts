import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AccountingPlanModule } from './accounting-plan/accounting-plan.module';

// Type ORM para Oracle, tener en cuenta que aqui no funciona eso de enum
//TypeOrmModule.forRoot({
  // type: 'oracle',
  // host: 'DESKTOP-7GSSPPR',
  // port: 1521,
  // username: 'HOSPI',
  // password: 'HOSPI24d',
  // serviceName: 'HOSPI',
  // database: 'HOSPI',
  // entities: [__dirname + '/**/*.entity{.ts,.js}'],
 //}),

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que el ConfigModule esté disponible globalmente
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // No usar esto en producción
      }),
    }),
    UsersModule,
    AuthModule,
    AccountingPlanModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
