import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from 'src/accounting-plan/entities/accounting-plan.entity';
import { AsientoItem } from 'src/asiento/entities/asiento-item.entity';
import { Asiento } from 'src/asiento/entities/asiento.entity';
import { Between, Repository } from 'typeorm';

@Injectable()
export class ReportesService {
    constructor(
        @InjectRepository(Asiento)
        private readonly accountingEntryRepository: Repository<Asiento>,
        @InjectRepository(AsientoItem)
        private accountingEntryItemRepository: Repository<AsientoItem>,
        @InjectRepository(AccountingPlan)
        private accountPlanRepository: Repository<AccountingPlan>,
    ) { }

    async getProfitAndLoss(
        empresaId: number,
        startDate?: Date,
        endDate?: Date,
        level?: number | 'All'
    ) {
        // Default dates if not provided
        const fromDate = startDate || new Date(new Date().getFullYear(), 0, 1);
        const toDate = endDate || new Date();
    
        const formatDate = (date) => date.toISOString().split('T')[0];
        const formatfromDate = formatDate(fromDate);
        const formattoDate = formatDate(toDate);
    
        // Get all account plans for this company
        const accountPlans = await this.accountPlanRepository.find({
            where: { empresa_id: empresaId },
            order: { code: 'ASC' },
        });
    
        // Filtrar solo cuentas 4.x y 5.x
        const filteredAccounts = accountPlans.filter(account =>
            account.code.startsWith('4') || account.code.startsWith('5')
        );
    
        // Get all entries within date range
        const entries = await this.accountingEntryRepository.find({
            where: {
                empresa_id: empresaId,
                fecha_emision: Between(formatfromDate, formattoDate),
            },
            relations: ['lineItems'],
        });
    
        // Inicializar un mapa para almacenar los valores de cada cuenta
        const accountValues = {};
    
        // Inicializar todas las cuentas con valores en cero
        filteredAccounts.forEach(account => {
            accountValues[account.code] = {
                debe: 0,
                haber: 0
            };
        });
    
        // Procesar los asientos y calcular valores directos para cada cuenta
        entries.forEach(entry => {
            entry.lineItems.forEach(item => {
                const accountCode = item.cta;
                if (accountValues[accountCode]) {
                    const debe = typeof item.debe === 'string' ? parseFloat(item.debe) : (item.debe || 0);
                    const haber = typeof item.haber === 'string' ? parseFloat(item.haber) : (item.haber || 0);
    
                    accountValues[accountCode].debe += debe;
                    accountValues[accountCode].haber += haber;
                }
            });
        });
    
        // Crear un mapa de padres e hijos
        const accountHierarchy = {};
        filteredAccounts.forEach(account => {
            // Mantener el punto final si existe
            const code = account.code;
            accountHierarchy[code] = {
                code: code,
                name: account.name,
                children: [],
                parent: null,
                level: code.split('.').filter(Boolean).length, // Nivel basado en el número de partes no vacías
                isIncome: code.startsWith('4'),
                isExpense: code.startsWith('5'),
                canHaveChildren: code.endsWith('.') // Flag para indicar si puede tener hijos
            };
        });
    
        // Establecer relaciones padre-hijo
        filteredAccounts.forEach(account => {
            const code = account.code;
    
            const parts = code.split('.').filter(Boolean);
            if (parts.length > 1) {
                // Construir el código del padre
                let parentParts = parts.slice(0, -1);
                let parentCode = parentParts.join('.') + '.'; // Añadir punto al final
    
                if (accountHierarchy[parentCode] && accountHierarchy[parentCode].canHaveChildren) {
                    accountHierarchy[parentCode].children.push(code);
                    accountHierarchy[code].parent = parentCode;
                }
            }
        });
    
        // Función para calcular el saldo de una cuenta sumando los valores de sus hijos
        const calculateAccountBalance = (accountCode) => {
            const account = accountHierarchy[accountCode];
            if (!account) return { debe: 0, haber: 0 };
    
            // Valores directos de la cuenta
            const directValues = accountValues[accountCode] || { debe: 0, haber: 0 };
            let totalDebe = directValues.debe;
            let totalHaber = directValues.haber;
    
            // Sumar valores de los hijos si esta cuenta puede tenerlos
            if (account.canHaveChildren) {
                account.children.forEach(childCode => {
                    const childBalance = calculateAccountBalance(childCode);
                    totalDebe += childBalance.debe;
                    totalHaber += childBalance.haber;
                });
            }
    
            return { debe: totalDebe, haber: totalHaber };
        };
    
        // Función para determinar si una cuenta es un "header" según el nivel
        const isHeaderAccount = (accountCode: string, targetLevel: number | 'All') => {
            const account = accountHierarchy[accountCode];
            if (!account) return false;
    
            if (targetLevel === 'All') {
                // En nivel "All", todas las cuentas que tienen hijos son "headers"
                return account.canHaveChildren;
            } else {
                // En niveles específicos, solo las cuentas padres son "headers"
                return account.canHaveChildren && account.level < targetLevel;
            }
        };
    
        // Función para obtener todas las cuentas de un nivel y sus hijos
        const getAccountsByLevel = (targetLevel: number | 'All') => {
            const accounts = [];
    
            const traverse = (accountCode: string) => {
                const account = accountHierarchy[accountCode];
                if (!account) return;
    
                // Si el nivel es "All", incluir todas las cuentas
                if (targetLevel === 'All') {
                    accounts.push(accountCode);
                } else {
                    // Si el nivel es un número, incluir cuentas del nivel objetivo y sus hijos
                    if (account.level <= targetLevel) {
                        accounts.push(accountCode);
                    }
                }
    
                // Recorrer hijos si el nivel objetivo es mayor que el nivel actual
                if (targetLevel === 'All' || targetLevel > account.level) {
                    account.children.forEach(childCode => traverse(childCode));
                }
            };
    
            // Iniciar el recorrido desde las cuentas raíz (4. y 5.)
            traverse('4.');
            traverse('5.');
    
            return accounts;
        };
    
        // Obtener las cuentas que corresponden al nivel seleccionado y sus hijos
        const accountsToInclude = getAccountsByLevel(level || 'All');
    
        // Construir el reporte
        const report = [];
    
        // Procesar las cuentas seleccionadas
        accountsToInclude.forEach(accountCode => {
            const account = accountHierarchy[accountCode];
    
            // Calcular saldo sumando los valores de los hijos
            const balance = calculateAccountBalance(accountCode);
    
            // Determinar valor según el tipo de cuenta
            let value;
            if (account.isIncome) {
                value = balance.haber - balance.debe; // Ingresos: Haber - Debe
            } else {
                value = balance.debe - balance.haber; // Gastos: Debe - Haber
            }
    
            // Determinar si la cuenta es un "header" según el nivel
            const isHeader = isHeaderAccount(accountCode, level || 'All');
    
            report.push({
                code: accountCode,
                name: account.name,
                level: account.level,
                monthly: value,  // Usando el mismo valor para monthly y total
                total: value,
                isHeader: isHeader, // Asignar correctamente si es un "header"
            });
        });
    
        // Ordenar el reporte por código
        report.sort((a, b) => a.code.localeCompare(b.code));
    
        // Calcular NET (Utilidad o Pérdida)
        let totalIncome = 0;
        let totalExpense = 0;
    
        report.forEach(item => {
            if (item.code === '4.') { // Cuenta raíz de ingresos
                totalIncome = item.total;
            } else if (item.code === '5.') { // Cuenta raíz de gastos
                totalExpense = item.total;
            }
        });
    
        // Agregar NET al reporte
        report.push({
            code: 'NET',
            name: 'UTILIDAD O PÉRDIDA',
            level: 0,
            monthly: totalIncome - totalExpense,
            total: totalIncome - totalExpense,
            isHeader: true
        });
    
        return {
            report: report,
            startDate: fromDate.toISOString().split('T')[0],
            endDate: toDate.toISOString().split('T')[0],
            level: level || 'All',
        };
    }
}