import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from './entities/accounting-plan.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class AccountingPlanService {

  constructor(
      @InjectRepository(AccountingPlan)
      private accountRepository: Repository<AccountingPlan>,
  ) { }

  async create(createAccountingPlanDto: CreateAccountingPlanDto) {
    const code = createAccountingPlanDto.code;
    if (!code.endsWith('.')) {
      createAccountingPlanDto.code += '.';
    }
    return await this.accountRepository.save(createAccountingPlanDto);
  }
  

  async createMany(createAccountingPlanDtos: CreateAccountingPlanDto[]) {
    return await this.accountRepository.save(createAccountingPlanDtos);
  }

  // Paginación con ordenamiento personalizado
  async findAll(page: number, limit: number): Promise<{ data: AccountingPlan[], total: number }> {

    const [result, total] = await this.accountRepository.findAndCount({
      order: { code: 'ASC' },
      // skip: (page - 1) * limit,
      // take: limit,
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

  async findOne(id: number) {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }
  

  async update(id: number, updateAccountingPlanDto: UpdateAccountingPlanDto) {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');

    if(updateAccountingPlanDto.code && updateAccountingPlanDto.code !== account.code) {
      const newCode = updateAccountingPlanDto.code;
      if (!newCode.endsWith('.')) {
        updateAccountingPlanDto.code += '.';
      }
      account.code = updateAccountingPlanDto.code;
    }

    if (updateAccountingPlanDto.name) {
      account.name = updateAccountingPlanDto.name;
    }

    return this.accountRepository.save(account);
  }
  
  

  async remove(code: string) {
    // Verificar si la cuenta tiene hijos usando el código
    const childAccounts = await this.accountRepository.find({
      where: { code: Like(`${code}.%`) },  // Busca subcuentas con el prefijo del código
    });
  
    if (childAccounts.length > 0) {
      throw new BadRequestException('No se puede eliminar una cuenta que tiene subcuentas.');
    }
  
    const result = await this.accountRepository.delete({ code });
    if (result.affected === 0) {
      throw new NotFoundException('Cuenta no encontrada');
    }
  }

  // Helper method to determine if a code belongs to a parent account
  private async isParentAccount(code: string): Promise<boolean> {
    // Check if there are any accounts that have a code starting with this one followed by a dot
    const childAccounts = await this.accountRepository.find({
      where: { code: Like(`${code}.%`) },
    });

    return childAccounts.length === 0;
  }

  
}
