import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AccountingPlanModule } from './accounting-plan/accounting-plan.module';
import { dataSourceOptions } from 'db/data-source';
import { DatCentroModule } from './dat_centro/dat_centro.module';
import { AsientoModule } from './asiento/asiento.module';
import { TransaccionContableModule } from './transaccion-contable/transaccion-contable.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => dataSourceOptions,
    }), 
    UsersModule,
    AuthModule,
    AccountingPlanModule,
    DatCentroModule,
    AsientoModule],
    AccountingPlanModule,
    TransaccionContableModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
