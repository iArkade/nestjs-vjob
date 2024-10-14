import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from './entities/accounting-plan.entity';
import { Like, Raw, Repository } from 'typeorm';

@Injectable()
export class AccountingPlanService {
  constructor(
    @InjectRepository(AccountingPlan)
    private accountRepository: Repository<AccountingPlan>,
  ) {}

  // Función para normalizar el código eliminando el punto final si existe
  private normalizeCode(code: string): string {
    return code.endsWith('.') ? code.slice(0, -1) : code;
  }

  async create(createAccountingPlanDto: CreateAccountingPlanDto) {
    const { code } = createAccountingPlanDto;
    const normalizedCode = this.normalizeCode(code); // Normalizamos el código
  
    // Verificar si es una cuenta principal (1., 2., 3., etc.)
    const isPrincipalAccount = /^\d+\.$/.test(code);
  
    // Verificar si la tabla está vacía
    const isTableEmpty = await this.accountRepository.count() === 0;
  
    // Permitir la creación de cuentas principales cuando la tabla esté vacía o si el código es principal
    if (isTableEmpty || isPrincipalAccount) {
      if (!code.endsWith('.')) {
        throw new BadRequestException('El código principal debe terminar con un punto.');
      }
      return await this.accountRepository.save(createAccountingPlanDto);
    }
  
    // Para subcuentas, obtener el código padre (quitar el último segmento del código actual)
    const parentCode = code.endsWith('.') 
      ? code.slice(0, code.lastIndexOf('.', code.length - 2)) // Quitar último punto
      : code.slice(0, code.lastIndexOf('.')); // Obtener padre
  
    // Buscar el código padre que termina con un punto
    const parentAccount = await this.accountRepository.findOne({ where: { code: `${parentCode}.` } });
  
    // Verificar que el código padre exista y termine con un punto
    if (!parentAccount) {
      throw new BadRequestException('El código padre no existe o no termina en un punto.');
    }
  
    // Verificar si el código ya existe (evitar duplicados como `1.1` y `1.1.`)
    const existingAccount = await this.accountRepository.findOne({ where: { code: normalizedCode } });
    if (existingAccount) {
      throw new BadRequestException('El código ya existe.');
    }
  
    // Guardar la cuenta
    return await this.accountRepository.save(createAccountingPlanDto);
  }

  async createMany(createAccountingPlanDtos: CreateAccountingPlanDto[]) {
      if (!Array.isArray(createAccountingPlanDtos)) {
          throw new TypeError('createAccountingPlanDtos debe ser un array');
      }

      // Filtrar filas vacías o incompletas
      const validDtos = createAccountingPlanDtos.filter(dto => dto.code && dto.name);
      for (const createAccountingPlanDto of validDtos) {
        
          await this.create(createAccountingPlanDto);
      }
  }


  async findAllPaginated(page: number, limit: number): Promise<{ data: AccountingPlan[], total: number }> {
    const [result, total] = await this.accountRepository.findAndCount({
      order: { code: 'ASC' },
    });

    const sortedResult = this.sortAccountsHierarchically(result);
    const paginatedResult = sortedResult.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedResult,
      total,
    };
  }

  async findAll(): Promise<AccountingPlan[]> {
    // Traer todos los registros de la base de datos
    const result = await this.accountRepository.find({
      order: { code: 'ASC' }, // Ordenar por el campo 'code'
    });
  
    // Ordenar jerárquicamente (igual que en el método paginado)
    const sortedResult = this.sortAccountsHierarchically(result);
  
    return sortedResult;
  }
  

  async findOne(id: number) {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(id: number, updateAccountingPlanDto: UpdateAccountingPlanDto) {
    const account = await this.accountRepository.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Account not found');
  
    // Check if the account has subaccounts
    const hasSubaccounts = await this.hasSubaccounts(account.code);
  
    if (hasSubaccounts) {
      // If the account has subaccounts, only allow name updates
      if (updateAccountingPlanDto.code) {
        throw new BadRequestException('No se puede editar el código de una cuenta que tiene subcuentas.');
      }
  
      if (updateAccountingPlanDto.name) {
        account.name = updateAccountingPlanDto.name;
      }
    } else {
      // If the account doesn't have subaccounts, allow both code and name updates
      if (updateAccountingPlanDto.code) {
        const newCode = updateAccountingPlanDto.code.trim();
  
        // Validar jerarquía del código
        const parentCode = newCode.endsWith('.')
          ? newCode.slice(0, newCode.lastIndexOf('.', newCode.length - 2)) // Para códigos con punto, quitar último punto
          : newCode.slice(0, newCode.lastIndexOf('.')); // Para subcuentas sin punto
  
        // Verificar si el padre existe (con punto al final)
        const parentExists = await this.accountRepository.findOne({ where: { code: `${parentCode}.` } });
        if (!parentExists && parentCode) {
          throw new BadRequestException('El código padre no existe o no termina en un punto.');
        }
  
        // Verificar si se está intentando duplicar el código
        const codeAlreadyExists = await this.accountRepository.findOne({ where: { code: newCode } });
        if (codeAlreadyExists && codeAlreadyExists.id !== id) {
          throw new BadRequestException('El código ya existe.');
        }
  
        // Actualizar el código sin añadir un punto automáticamente
        account.code = newCode;
      }
  
      if (updateAccountingPlanDto.name) {
        account.name = updateAccountingPlanDto.name;
      }
    }
  
    // Guardar cambios
    return await this.accountRepository.save(account);
  }
  
  async remove(code: string) {

    // Buscar la cuenta (intentar con y sin punto final)
    let account = await this.accountRepository.findOne({ where: { code } });
    
    if (!account && !code.endsWith('.')) {
      // Si no se encuentra y no termina en punto, intentar con punto
      account = await this.accountRepository.findOne({ where: { code: code + '.' } });
    } else if (!account && code.endsWith('.')) {
      // Si no se encuentra y termina en punto, intentar sin punto
      account = await this.accountRepository.findOne({ where: { code: code.slice(0, -1) } });
    }

    if (!account) {
      throw new NotFoundException(`Cuenta no encontrada con el código: ${code}`);
    }

    // Verificar si tiene subcuentas
    const hasSubaccounts = await this.hasSubaccounts(account.code);

    if (hasSubaccounts) {
      throw new BadRequestException('No se puede eliminar una cuenta que tiene subcuentas.');
    }

    // Eliminar la cuenta
    try {
      await this.accountRepository.remove(account);
      return { message: 'Cuenta eliminada exitosamente', code: account.code };
    } catch (error) {
      throw new BadRequestException('Error al eliminar la cuenta. Por favor, inténtelo de nuevo.');
    }
  }


  private sortAccountsHierarchically(accounts: AccountingPlan[]): AccountingPlan[] {
    return accounts.sort((a, b) => {
      const partsA = a.code.split('.');
      const partsB = b.code.split('.');

      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
        const numA = Number(partsA[i]);
        const numB = Number(partsB[i]);

        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return partsA[i].localeCompare(partsB[i]);
      }
      return partsA.length - partsB.length;
    });
  }

  private async hasSubaccounts(code: string): Promise<boolean> {
    const baseCode = code.endsWith('.') ? code : code + '.';
    const subaccounts = await this.accountRepository.find({
      where: { code: Like(`${baseCode}%`) },
    });

    // Filtramos para excluir la cuenta actual
    return subaccounts.some(account => account.code !== code && account.code !== baseCode);
  }
}
