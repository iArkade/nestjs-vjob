import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
import { AccountingPlanService } from './accounting-plan.service';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('accounting')
@Controller('accounting-plan')
export class AccountingPlanController {
  constructor(private readonly accountingPlanService: AccountingPlanService) {}

  @Post()
  async create(@Body() createAccountingPlanDto: CreateAccountingPlanDto | CreateAccountingPlanDto[]) {
    // Si es un solo objeto, lo convertimos en un array
    if (!Array.isArray(createAccountingPlanDto)) {
      createAccountingPlanDto = [createAccountingPlanDto];
    }
    return await this.accountingPlanService.createMany(createAccountingPlanDto);
  }

  @Get()
  findAll(
    @Query('page') page: number = 1,  // Página por defecto
    @Query('limit') limit: number = 10 // Límites por defecto
  ) {
    return this.accountingPlanService.findAll(page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountingPlanService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAccountingPlanDto: UpdateAccountingPlanDto) {
    return this.accountingPlanService.update(+id, updateAccountingPlanDto);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.accountingPlanService.remove(code);
  }
}
