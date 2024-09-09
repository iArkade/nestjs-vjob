import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AccountingPlanService } from './accounting-plan.service';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('accounting')
@Controller('accounting-plan')
export class AccountingPlanController {
  constructor(private readonly accountingPlanService: AccountingPlanService) {}

  @Post()
  create(@Body() createAccountingPlanDto: CreateAccountingPlanDto) {
    return this.accountingPlanService.create(createAccountingPlanDto);
  }

  @Get()
  findAll() {
    return this.accountingPlanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountingPlanService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountingPlanDto: UpdateAccountingPlanDto) {
    return this.accountingPlanService.update(+id, updateAccountingPlanDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountingPlanService.remove(+id);
  }
}

