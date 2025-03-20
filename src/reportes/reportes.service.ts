import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from 'src/accounting-plan/entities/accounting-plan.entity';
import { AsientoItem } from 'src/asiento/entities/asiento-item.entity';
import { Asiento } from 'src/asiento/entities/asiento.entity';
import { Between, LessThanOrEqual, Repository } from 'typeorm';

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

    async getBalanceGeneral(
        empresaId: number,
        endDate?: Date,
        level?: number | 'All'
    ) {
        // Definir fecha de corte
        const toDate = endDate || new Date();
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        const formatToDate = formatDate(toDate);
    
        // Obtener todas las cuentas de la empresa
        const accountPlans = await this.accountPlanRepository.find({
            where: { empresa_id: empresaId },
            order: { code: 'ASC' },
        });
    
        // Filtrar cuentas por Activos, Pasivos y Patrimonio
        const filteredAccounts = accountPlans.filter(account =>
            account.code.startsWith('1') || account.code.startsWith('2') || account.code.startsWith('3')
        );
    
        // Obtener los asientos contables hasta la fecha seleccionada
        const entries = await this.accountingEntryRepository.find({
            where: {
                empresa_id: empresaId,
                fecha_emision: LessThanOrEqual(new Date(formatToDate)),
            },
            relations: ['lineItems'],
        });
    
        // Mapa de valores para cada cuenta (Debe y Haber)
        const accountValues: Record<string, { debe: number; haber: number }> = {};
    
        // Inicializar cuentas con valores en 0
        filteredAccounts.forEach(account => {
            accountValues[account.code] = { debe: 0, haber: 0 };
        });
    
        // Procesar los asientos contables
        entries.forEach(entry => {
            entry.lineItems.forEach(item => {
                const accountCode = item.cta;
                if (accountValues[accountCode]) {
                    accountValues[accountCode].debe += Number(item.debe) || 0;
                    accountValues[accountCode].haber += Number(item.haber) || 0;
                }
            });
        });
    
        // Mapa de jerarquía de cuentas
        const accountHierarchy: Record<string, any> = {};
        filteredAccounts.forEach(account => {
            accountHierarchy[account.code] = {
                code: account.code,
                name: account.name,
                children: [],
                parent: null,
                level: account.code.split('.').filter(Boolean).length,
                isAsset: account.code.startsWith('1'),
                isLiability: account.code.startsWith('2'),
                isEquity: account.code.startsWith('3'),
                canHaveChildren: account.code.endsWith('.'),
            };
        });
    
        // Establecer relaciones padre-hijo
        filteredAccounts.forEach(account => {
            const code = account.code;
            const parts = code.split('.').filter(Boolean);
    
            if (parts.length > 1) {
                const parentCode = parts.slice(0, -1).join('.') + '.';
                if (accountHierarchy[parentCode] && accountHierarchy[parentCode].canHaveChildren) {
                    accountHierarchy[parentCode].children.push(code);
                    accountHierarchy[code].parent = parentCode;
                }
            }
        });
    
        // Función para calcular el saldo total de una cuenta
        const calculateAccountBalance = (accountCode: string) => {
            const account = accountHierarchy[accountCode];
            if (!account) return { debe: 0, haber: 0 };
    
            let { debe, haber } = accountValues[accountCode] || { debe: 0, haber: 0 };
    
            if (account.canHaveChildren) {
                account.children.forEach(childCode => {
                    const childBalance = calculateAccountBalance(childCode);
                    debe += childBalance.debe;
                    haber += childBalance.haber;
                });
            }
    
            return { debe, haber };
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
    
        // Obtener cuentas según nivel
        const getAccountsByLevel = (targetLevel: number | 'All') => {
            const accounts = [];
            const processedCodes = new Set(); // Para evitar duplicados
    
            const traverse = (accountCode: string) => {
                const account = accountHierarchy[accountCode];
                if (!account) return;
    
                if (targetLevel === 'All' || account.level <= targetLevel) {
                    // Solo incluir si no hay un padre que ya esté incluido en el reporte
                    if (!processedCodes.has(accountCode)) {
                        accounts.push(accountCode);
                        processedCodes.add(accountCode);
                    }
                }
    
                if (targetLevel === 'All' || targetLevel > account.level) {
                    account.children.forEach(childCode => {
                        // Si incluimos al padre, no incluimos a los hijos para evitar duplicación
                        if (targetLevel !== 'All' && account.level === targetLevel) {
                            return;
                        }
                        traverse(childCode);
                    });
                }
            };
    
            traverse('1.');
            traverse('2.');
            traverse('3.');
    
            return accounts;
        };
    
        // Obtener cuentas a incluir en el reporte
        const accountsToInclude = getAccountsByLevel(level || 'All');
    
        // Construcción del reporte
        const report = accountsToInclude.map(accountCode => {
            const account = accountHierarchy[accountCode];
            const balance = calculateAccountBalance(accountCode);
    
            // Calcular el valor de la cuenta según su tipo (Activo, Pasivo o Patrimonio)
            let value;
            if (account.isAsset) {
                value = balance.debe - balance.haber; // Activos: Debe - Haber
            } else if (account.isLiability || account.isEquity) {
                value = balance.haber - balance.debe; // Pasivos y Patrimonio: Haber - Debe
            } else {
                value = 0; // Por defecto, en caso de que no coincida con ninguna categoría
            }
    
            // Determinar si la cuenta es un "header" según el nivel
            const isHeader = isHeaderAccount(accountCode, level || 'All');
    
            return {
                code: accountCode,
                name: account.name,
                level: account.level,
                total: value,
                isHeader: isHeader,
            };
        });
    
        // Ordenar reporte por código
        report.sort((a, b) => a.code.localeCompare(b.code));
    
        // Calcular totales solo con las cuentas principales (1., 2., 3.)
        const totalAssets = calculateAccountBalance('1.').debe - calculateAccountBalance('1.').haber;
        const totalLiabilities = calculateAccountBalance('2.').haber - calculateAccountBalance('2.').debe;
        const totalEquity = calculateAccountBalance('3.').haber - calculateAccountBalance('3.').debe;
    
        // Agregar líneas de resumen al reporte
        report.push(
            { code: 'TOTALACT', name: 'TOTAL ACTIVOS', level: 0, total: totalAssets, isHeader: true },
            { code: 'TOTALPAS', name: 'TOTAL PASIVOS', level: 0, total: totalLiabilities, isHeader: true },
            { code: 'TOTALPAT', name: 'TOTAL PATRIMONIO', level: 0, total: totalEquity, isHeader: true },
            { code: 'TOTALPYP', name: 'TOTAL PASIVOS + PATRIMONIO', level: 0, total: totalLiabilities + totalEquity, isHeader: true }
        );
    
        // Verificación de ecuación contable
        const balanceCorrecto = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01; // Permitir pequeña diferencia por redondeo
    
        return {
            report,
            endDate: formatToDate,
            level: level || 'All',
            balanceCorrecto,
        };
    }
    
}