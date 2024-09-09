import { Module } from '@nestjs/common';
import { AccountingPlanService } from './accounting-plan.service';
import { AccountingPlanController } from './accounting-plan.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingPlan } from './entities/accounting-plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AccountingPlan])],
  controllers: [AccountingPlanController],
  providers: [AccountingPlanService],
})
export class AccountingPlanModule {}

