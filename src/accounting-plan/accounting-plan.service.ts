import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from './entities/accounting-plan.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AccountingPlanService {

  constructor(
      @InjectRepository(AccountingPlan)
      private accountRepository: Repository<AccountingPlan>,
  ) { }

  async create(createAccountingPlanDto: CreateAccountingPlanDto) {
    return await this.accountRepository.save(createAccountingPlanDto)
  }

  async createMany(createAccountingPlanDtos: CreateAccountingPlanDto[]) {
    // El método save acepta un array de objetos
    return await this.accountRepository.save(createAccountingPlanDtos);
  }

  async findAll(): Promise<AccountingPlan[]> {
    return await this.accountRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} accountingPlan`;
  }

  update(id: number, updateAccountingPlanDto: UpdateAccountingPlanDto) {
    return `This action updates a #${id} accountingPlan`;
  }

  async remove(id: number) {
    try {
      const result = await this.accountRepository.delete({id});
      // Verifica si algún registro fue afectado (eliminado)
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    } catch (error) {
        throw new InternalServerErrorException(`Failed to delete user with ID ${id}`);
    }
  }
}


