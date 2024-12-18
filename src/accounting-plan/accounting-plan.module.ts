import { Module } from "@nestjs/common";
import { AccountingPlanService } from "./accounting-plan.service";
import { AccountingPlanController } from "./accounting-plan.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountingPlan } from "./entities/accounting-plan.entity";
import { AsientoItem } from "src/asiento/entities/asiento-item.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AccountingPlan, AsientoItem])],
  controllers: [AccountingPlanController],
  providers: [AccountingPlanService],
})
export class AccountingPlanModule {}
