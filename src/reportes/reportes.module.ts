import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asiento } from '../asiento/entities/asiento.entity';
import { AsientoItem } from '../asiento/entities/asiento-item.entity';
import { AccountingPlan } from '../accounting-plan/entities/accounting-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asiento, AsientoItem, AccountingPlan])],
  controllers: [ReportesController],
  providers: [ReportesService]
})
export class ReportesModule {}
