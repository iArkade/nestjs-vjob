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
    return await this.accountRepository.save(createAccountingPlanDto);
  }

  async createMany(createAccountingPlanDtos: CreateAccountingPlanDto[]) {
    return await this.accountRepository.save(createAccountingPlanDtos);
  }

  // Paginación con ordenamiento personalizado
  async findAll(page: number, limit: number): Promise<{ data: AccountingPlan[], total: number }> {
    const [result, total] = await this.accountRepository.findAndCount({
      order: { code: 'ASC' },
    });
  
    // Función para comparar códigos y considerar la jerarquía
    const compareCodes = (a: AccountingPlan, b: AccountingPlan) => {
      const partsA = a.code.split('.');
      const partsB = b.code.split('.');
    
      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
        const partA = partsA[i];
        const partB = partsB[i];
    
        // Verificar si ambas partes son números válidos antes de convertir
        const numA = Number(partA);
        const numB = Number(partB);
    
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        } else {
          // Si alguno no es un número, comparar lexicográficamente las partes correspondientes
          return partA.localeCompare(partB);
        }
      }
    
      // Si se han comparado todos los niveles y son iguales hasta ahora,
      // el código más largo se considera mayor
      return partsA.length - partsB.length;
    };
  
    // Ordenar los resultados considerando la jerarquía
    const sortedResult = result.sort(compareCodes);
  
    // Paginar los resultados ordenados
    const paginatedResult = sortedResult.slice((page - 1) * limit, page * limit);
  
    return {
      data: paginatedResult,
      total,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} accountingPlan`;
  }

  update(id: number, updateAccountingPlanDto: UpdateAccountingPlanDto) {
    return `This action updates a #${id} accountingPlan`;
  }

  async remove(id: number) {
    try {
      const result = await this.accountRepository.delete({ id });
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to delete user with ID ${id}`);
    }
  }
}
