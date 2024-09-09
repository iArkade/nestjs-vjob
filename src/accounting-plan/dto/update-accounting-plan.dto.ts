import { PartialType } from '@nestjs/swagger';
import { CreateAccountingPlanDto } from './create-accounting-plan.dto';

export class UpdateAccountingPlanDto extends PartialType(CreateAccountingPlanDto) {}
