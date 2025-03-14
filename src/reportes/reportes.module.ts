import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asiento } from 'src/asiento/entities/asiento.entity';
import { AsientoItem } from 'src/asiento/entities/asiento-item.entity';
import { AccountingPlan } from 'src/accounting-plan/entities/accounting-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Asiento, AsientoItem, AccountingPlan])],
  controllers: [ReportesController],
  providers: [ReportesService]
})
export class ReportesModule {}
