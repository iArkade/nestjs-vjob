import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core'; // Importa esto
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AccountingPlanModule } from './accounting-plan/accounting-plan.module';
import { dataSourceOptions } from './db/data-source';
import { DatCentroModule } from './dat_centro/dat_centro.module';
import { AsientoModule } from './asiento/asiento.module';
import { TransaccionContableModule } from './transaccion-contable/transaccion-contable.module';
import { EmpresaModule } from './empresa/empresa.module';
import { UsuarioEmpresa } from './usuario_empresa/entities/usuario_empresa.entity';
import { Permisos } from './permisos/entities/permisos.entity';
import { ReportesModule } from './reportes/reportes.module';
import { LoginHistoryModule } from './login-history/login-history.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Importa tu filtro
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions,
    }),
    TypeOrmModule.forFeature([UsuarioEmpresa, Permisos]),
    UsersModule,
    AuthModule,
    AccountingPlanModule,
    DatCentroModule,
    AsientoModule,
    TransaccionContableModule,
    EmpresaModule,
    ReportesModule,
    LoginHistoryModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Registra el filtro global como provider
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}