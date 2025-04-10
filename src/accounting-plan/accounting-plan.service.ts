/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from './entities/accounting-plan.entity';
import { Like, Repository } from 'typeorm';
import { AsientoItem } from '../asiento/entities/asiento-item.entity';

@Injectable()
export class AccountingPlanService {
  constructor(
    @InjectRepository(AccountingPlan)
    private accountRepository: Repository<AccountingPlan>,

    @InjectRepository(AsientoItem)
    private asientoItemRepository: Repository<AsientoItem>,
  ) {}

  private normalizeCode(code: string): string {
    return code.endsWith('.') ? code.slice(0, -1) : code;
  }

  async importData(
    records: { code: string; name: string; empresa_id: number }[]
  ) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('No hay datos válidos para procesar.');
    }

    const errors: string[] = [];
    const allCodes = new Set<string>();

    // Filtrar y normalizar registros, eliminando entradas inválidas
    const normalizedRecords = records
      .map((record, index) => {
        // Validar que record no sea undefined y tenga propiedades
        if (!record || typeof record !== 'object') {
          errors.push(`Fila ${index + 2}: Registro inválido o vacío.`);
          return null;
        }

        const code = record.code?.toString().trim() ?? '';
        const name = record.name?.toString().trim() ?? '';
        const empresaId = record.empresa_id;

        // Validar que código y nombre no estén vacíos
        if (!code || !name || !empresaId) {
          errors.push(
            `Fila ${index + 2}: Los campos "code", "name" y "empresa_id" son obligatorios.`,
          );
          return null;
        }

        return {
          originalRecord: record,
          code,
          name,
          empresaId,
          normalizedCode: this.normalizeCodeExcel(code),
          rowNumber: index + 2,
        };
      })
      .filter((record) => record !== null);

    // Verificar duplicados
    const duplicateCodes = new Set<string>();
    normalizedRecords.forEach((record) => {
      if (duplicateCodes.has(record.normalizedCode)) {
        errors.push(
          `Fila ${record.rowNumber}: El código "${record.code}" está duplicado.`,
        );
      } else {
        duplicateCodes.add(record.normalizedCode);
        allCodes.add(record.normalizedCode);
      }
    });

    // Validar jerarquía de códigos
    normalizedRecords.forEach((record) => {
      // Verificar si el código original termina con punto
      const endsWithDot = record.code.endsWith('.');

      // Buscar código padre
      const parentCode = this.findParentCode(record.normalizedCode);

      // Ignorar validación de padre para códigos de primer nivel (1., 2., 3.)
      if (record.normalizedCode.split('.').length === 1) {
        return; // Skip parent validation for top-level codes
      }

      // Si termina con punto, debe tener un padre
      if (endsWithDot && (!parentCode || !allCodes.has(parentCode))) {
        errors.push(
          `Fila ${record.rowNumber}: El código "${record.code}" que termina en punto debe tener un código padre válido.`,
        );
      }

      // Si no termina con punto, debe tener un padre existente
      if (!endsWithDot && parentCode && !allCodes.has(parentCode)) {
        errors.push(
          `Fila ${record.rowNumber}: El código "${record.code}" no tiene un código padre válido "${parentCode}".`,
        );
      }
    });

    // Si hay errores, no continuar con la importación
    if (errors.length > 0) {
      console.log(errors);
      return {
        totalRecords: records.length,
        validRecords: 0,
        errors,
      };
    }

    // Preparar registros para guardar, manteniendo el código original
    const validRecords = normalizedRecords.map((record) => ({
      code: record.code,
      name: record.name,
      empresa_id: record.empresaId,
    }));

    // Guardar en lotes
    const batchSize = 100;
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      await this.accountRepository.save(batch);
    }

    return {
      totalRecords: records.length,
      validRecords: validRecords.length,
      errors: [],
    };
  }

  // Método para normalizar códigos (eliminar puntos finales redundantes)
  private normalizeCodeExcel(code: string): string {
    // Validar que code sea un string
    if (typeof code !== 'string') {
      return '';
    }
    // Eliminar puntos finales redundantes
    return code.replace(/\.+$/, '');
  }

  // Método para encontrar el código padre
  private findParentCode(code: string): string | null {
    // Validar que code sea un string
    if (typeof code !== 'string') {
      return null;
    }

    // Normalizar código antes de buscar padre
    const normalizedCode = this.normalizeCodeExcel(code);

    // Si no hay punto, no hay padre
    if (!normalizedCode.includes('.')) return null;

    // Dividir el código por puntos
    const parts = normalizedCode.split('.');

    // Si solo hay un nivel, no hay padre
    if (parts.length <= 1) return null;

    // Construir el código padre
    return parts.slice(0, -1).join('.');
  }

  async create(createAccountingPlanDto: CreateAccountingPlanDto & { empresa_id: number }) {
    const { code, empresa_id } = createAccountingPlanDto;
    const normalizedCode = this.normalizeCode(code);

    // Verificar si es una cuenta principal (1., 2., 3., etc.)
    const isPrincipalAccount = /^\d+\.$/.test(code);

    // Verificar si la tabla está vacía para esta empresa
    const isTableEmptyForCompany = (
      await this.accountRepository.count({ 
        where: { empresa_id } 
      })
    ) === 0;

    // Permitir la creación de cuentas principales cuando la tabla esté vacía o si el código es principal
    if (isTableEmptyForCompany || isPrincipalAccount) {
      if (!code.endsWith('.')) {
        throw new BadRequestException(
          'El código principal debe terminar con un punto.',
        );
      }
      return await this.accountRepository.save(createAccountingPlanDto);
    }

    // Para subcuentas, obtener el código padre
    const parentCode = code.endsWith('.')
      ? code.slice(0, code.lastIndexOf('.', code.length - 2))
      : code.slice(0, code.lastIndexOf('.'));

    // Buscar el código padre que termina con un punto para esta empresa
    const parentAccount = await this.accountRepository.findOne({
      where: { 
        code: `${parentCode}.`,
        empresa_id 
      },
    });

    // Verificar que el código padre exista y termine con un punto
    if (!parentAccount) {
      throw new BadRequestException(
        'El código padre no existe o no termina en un punto.',
      );
    }

    // Verificar si el código ya existe para esta empresa
    const existingAccount = await this.accountRepository.findOne({
      where: { 
        code: normalizedCode,
        empresa_id 
      },
    });
    if (existingAccount) {
      throw new BadRequestException('El código ya existe para esta empresa.');
    }

    // Guardar la cuenta
    return await this.accountRepository.save(createAccountingPlanDto);
  }

  async createMany(createAccountingPlanDtos: (CreateAccountingPlanDto & { empresa_id: number })[]) {
    console.log('Inicio del proceso createMany...');
    const validDtos = createAccountingPlanDtos.filter(
      (dto) => dto.code && dto.name && dto.empresa_id,
    );

    console.log('Registros válidos:', validDtos);

    for (const createAccountingPlanDto of validDtos) {
      try {
        const result = await this.create(createAccountingPlanDto);
        console.log('Resultado de guardar registro:', result);
      } catch (error) {
        console.error(
          'Error al guardar el registro:',
          createAccountingPlanDto,
          error,
        );
      }
    }

    console.log('Fin del proceso createMany.');
  }

  async findAllPaginated(
    page: number,
    limit: number,
    empresaId: number
  ): Promise<{ data: AccountingPlan[]; total: number }> {
    const [result, total] = await this.accountRepository.findAndCount({
      where: { empresa_id: empresaId },
      order: { code: 'ASC' },
    });

    const sortedResult = this.sortAccountsHierarchically(result);
    const paginatedResult = sortedResult.slice(
      (page - 1) * limit,
      page * limit,
    );

    return {
      data: paginatedResult,
      total,
    };
  }

  async findAll(empresaId: number): Promise<AccountingPlan[]> {
    // Traer todos los registros de la base de datos para esta empresa
    const result = await this.accountRepository.find({
      where: { empresa_id: empresaId },
      order: { code: 'ASC' },
    });

    // Ordenar jerárquicamente
    const sortedResult = this.sortAccountsHierarchically(result);

    return sortedResult;
  }

  async findOne(id: number, empresaId: number) {
    const account = await this.accountRepository.findOne({ 
      where: { 
        id,
        empresa_id: empresaId 
      } 
    });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(
    id: number, 
    updateAccountingPlanDto: UpdateAccountingPlanDto, 
    empresaId: number
  ) {
    const account = await this.accountRepository.findOne({ 
      where: { 
        id,
        empresa_id: empresaId 
      } 
    });
    if (!account) throw new NotFoundException('Account not found');

    // Verificar si existe un asiento vinculado al código
    const linkedAsiento = await this.asientoItemRepository.findOne({
      where: { 
        cta: account.code,
      },
    });
  
    if (linkedAsiento) {
      throw new BadRequestException(
        'No se puede actualizar esta cuenta porque tiene un asiento vinculado.',
      );
    }

    // Check if the account has subaccounts
    const hasSubaccounts = await this.hasSubaccounts(account.code, empresaId);

    if (hasSubaccounts) {
      // If the account has subaccounts, only allow name updates
      if (updateAccountingPlanDto.code) {
        throw new BadRequestException(
          'No se puede editar el código de una cuenta que tiene subcuentas.',
        );
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
          ? newCode.slice(0, newCode.lastIndexOf('.', newCode.length - 2))
          : newCode.slice(0, newCode.lastIndexOf('.'));

        // Verificar si el padre existe (con punto al final)
        const parentExists = await this.accountRepository.findOne({
          where: { 
            code: `${parentCode}.`,
            empresa_id: empresaId 
          },
        });
        if (!parentExists && parentCode) {
          throw new BadRequestException(
            'El código padre no existe o no termina en un punto.',
          );
        }

        // Verificar si se está intentando duplicar el código
        const codeAlreadyExists = await this.accountRepository.findOne({
          where: { 
            code: newCode,
            empresa_id: empresaId 
          },
        });
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

  async remove(code: string, empresaId: number) {
    // Buscar la cuenta (intentar con y sin punto final)
    let account = await this.accountRepository.findOne({ 
      where: { 
        code,
        empresa_id: empresaId 
      } 
    });
  
    if (!account && !code.endsWith('.')) {
      // Si no se encuentra y no termina en punto, intentar con punto
      account = await this.accountRepository.findOne({
        where: { 
          code: code + '.',
          empresa_id: empresaId 
        },
      });
    } else if (!account && code.endsWith('.')) {
      // Si no se encuentra y termina en punto, intentar sin punto
      account = await this.accountRepository.findOne({
        where: { 
          code: code.slice(0, -1),
          empresa_id: empresaId 
        },
      });
    }
  
    if (!account) {
      throw new NotFoundException(
        `Cuenta no encontrada con el código: ${code}`,
      );
    }
  
    // Verificar si tiene subcuentas
    const hasSubaccounts = await this.hasSubaccounts(account.code, empresaId);
  
    if (hasSubaccounts) {
      throw new BadRequestException(
        'No se puede eliminar una cuenta que tiene subcuentas.',
      );
    }
  
    // Verificar si existe un asiento vinculado al código
    const linkedAsiento = await this.asientoItemRepository.findOne({
      where: { 
        cta: account.code,
      },
    });
  
    if (linkedAsiento) {
      throw new BadRequestException(
        'No se puede eliminar esta cuenta porque tiene un asiento vinculado.',
      );
    }
  
    // Eliminar la cuenta
    try {
      await this.accountRepository.remove(account);
      return { message: 'Cuenta eliminada exitosamente', code: account.code };
    } catch (error) {
      throw new BadRequestException(
        'Error al eliminar la cuenta. Por favor, inténtelo de nuevo.',
      );
    }
  }
  

  private sortAccountsHierarchically(
    accounts: AccountingPlan[],
  ): AccountingPlan[] {
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

  private async hasSubaccounts(
    code: string, 
    empresaId: number
  ): Promise<boolean> {
    const baseCode = code.endsWith('.') ? code : code + '.';
    const subaccounts = await this.accountRepository.find({
      where: { 
        code: Like(`${baseCode}%`),
        empresa_id: empresaId 
      },
    });

    // Filtramos para excluir la cuenta actual
    return subaccounts.some(
      (account) => account.code !== code && account.code !== baseCode,
    );
  }

  async countRecords(empresaId?: number): Promise<number> {
    return empresaId 
      ? this.accountRepository.count({ where: { empresa_id: empresaId } })
      : this.accountRepository.count();
  }

  async deleteAllRecords(empresaId?: number): Promise<void> {
    if (empresaId) {
      await this.accountRepository.delete({ empresa_id: empresaId });
    } else {
      await this.accountRepository.clear();
    }
  }
}
