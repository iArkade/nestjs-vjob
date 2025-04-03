import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from 'src/accounting-plan/entities/accounting-plan.entity';
import { AsientoItem } from 'src/asiento/entities/asiento-item.entity';
import { Asiento } from 'src/asiento/entities/asiento.entity';
import { Between, LessThanOrEqual, Like, Repository } from 'typeorm';

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

        // Get all entries for TOTAL values (from beginning of period to endDate)
        const totalEntries = await this.accountingEntryRepository.find({
            where: {
                empresa_id: empresaId,
                fecha_emision: Between(formatDate(new Date(0)), formattoDate),
            },
            relations: ['lineItems'],
        });

        // Get all entries for MONTHLY values (between startDate and endDate)
        const monthlyEntries = await this.accountingEntryRepository.find({
            where: {
                empresa_id: empresaId,
                fecha_emision: Between(formatfromDate, formattoDate),
            },
            relations: ['lineItems'],
        });

        // Inicializar mapas para almacenar valores
        const accountValues = {
            total: {},
            monthly: {}
        };

        filteredAccounts.forEach(account => {
            accountValues.total[account.code] = { debe: 0, haber: 0 };
            accountValues.monthly[account.code] = { debe: 0, haber: 0 };
        });

        // Procesar asientos para valores TOTALES
        totalEntries.forEach(entry => {
            entry.lineItems.forEach(item => {
                const accountCode = item.cta;
                if (accountValues.total[accountCode]) {
                    const debe = typeof item.debe === 'string' ? parseFloat(item.debe) : (item.debe || 0);
                    const haber = typeof item.haber === 'string' ? parseFloat(item.haber) : (item.haber || 0);

                    accountValues.total[accountCode].debe += debe;
                    accountValues.total[accountCode].haber += haber;
                }
            });
        });

        // Procesar asientos para valores MENSUALES
        monthlyEntries.forEach(entry => {
            entry.lineItems.forEach(item => {
                const accountCode = item.cta;
                if (accountValues.monthly[accountCode]) {
                    const debe = typeof item.debe === 'string' ? parseFloat(item.debe) : (item.debe || 0);
                    const haber = typeof item.haber === 'string' ? parseFloat(item.haber) : (item.haber || 0);

                    accountValues.monthly[accountCode].debe += debe;
                    accountValues.monthly[accountCode].haber += haber;
                }
            });
        });

        // Crear mapa de jerarquía de cuentas
        const accountHierarchy = {};
        filteredAccounts.forEach(account => {
            const code = account.code;
            accountHierarchy[code] = {
                code: code,
                name: account.name,
                children: [],
                parent: null,
                level: code.split('.').filter(Boolean).length,
                isIncome: code.startsWith('4'),
                isExpense: code.startsWith('5'),
                canHaveChildren: code.endsWith('.'),
                isRoot: code === '4.' || code === '5.' // Identificar cuentas raíz
            };
        });

        // Establecer relaciones padre-hijo
        filteredAccounts.forEach(account => {
            const code = account.code;
            const parts = code.split('.').filter(Boolean);
            if (parts.length > 1) {
                let parentParts = parts.slice(0, -1);
                let parentCode = parentParts.join('.') + '.';
                if (accountHierarchy[parentCode] && accountHierarchy[parentCode].canHaveChildren) {
                    accountHierarchy[parentCode].children.push(code);
                    accountHierarchy[code].parent = parentCode;
                }
            }
        });

        // Función para calcular saldo incluyendo hijos
        const calculateAccountBalance = (accountCode, valueType: 'total' | 'monthly') => {
            const account = accountHierarchy[accountCode];
            if (!account) return { debe: 0, haber: 0 };

            const directValues = accountValues[valueType][accountCode] || { debe: 0, haber: 0 };
            let totalDebe = directValues.debe;
            let totalHaber = directValues.haber;

            if (account.canHaveChildren) {
                account.children.forEach(childCode => {
                    const childBalance = calculateAccountBalance(childCode, valueType);
                    totalDebe += childBalance.debe;
                    totalHaber += childBalance.haber;
                });
            }

            return { debe: totalDebe, haber: totalHaber };
        };

        // Función para verificar si una cuenta tiene hijos con valores
        const hasChildrenWithValues = (accountCode, valueType: 'total' | 'monthly') => {
            const account = accountHierarchy[accountCode];
            if (!account || !account.canHaveChildren) return false;

            return account.children.some(childCode => {
                const childBalance = calculateAccountBalance(childCode, valueType);
                const childValue = accountHierarchy[childCode].isIncome
                    ? childBalance.haber - childBalance.debe
                    : childBalance.debe - childBalance.haber;

                return childValue !== 0 || hasChildrenWithValues(childCode, valueType);
            });
        };

        // Función para determinar si mostrar la cuenta
        const shouldIncludeAccount = (accountCode) => {
            const account = accountHierarchy[accountCode];
            if (!account) return false;

            // Calcular valores para monthly y total
            const monthlyBalance = calculateAccountBalance(accountCode, 'monthly');
            const totalBalance = calculateAccountBalance(accountCode, 'total');

            const monthlyValue = account.isIncome
                ? monthlyBalance.haber - monthlyBalance.debe
                : monthlyBalance.debe - monthlyBalance.haber;

            const totalValue = account.isIncome
                ? totalBalance.haber - totalBalance.debe
                : totalBalance.debe - totalBalance.haber;

            // Si es cuenta raíz, siempre incluir
            if (account.isRoot) return true;

            // Si tiene valores distintos de cero, incluir
            if (monthlyValue !== 0 || totalValue !== 0) return true;

            // Si es header y tiene hijos con valores, incluir
            if (account.canHaveChildren &&
                (hasChildrenWithValues(accountCode, 'monthly') || hasChildrenWithValues(accountCode, 'total'))) {
                return true;
            }

            return false;
        };

        // Construir el reporte
        const report = [];
        let totalIncomeMonthly = 0;
        let totalExpenseMonthly = 0;
        let totalIncomeTotal = 0;
        let totalExpenseTotal = 0;

        // Procesar primero ingresos (4.) y luego gastos (5.)
        ['4.', '5.'].forEach(rootCode => {
            if (!accountHierarchy[rootCode]) return;

            const processAccount = (accountCode) => {
                const account = accountHierarchy[accountCode];
                if (!account || !shouldIncludeAccount(accountCode)) return;

                // Calcular balances
                const monthlyBalance = calculateAccountBalance(accountCode, 'monthly');
                const totalBalance = calculateAccountBalance(accountCode, 'total');

                // Calcular valores según tipo de cuenta
                let monthlyValue, totalValue;
                if (account.isIncome) {
                    monthlyValue = monthlyBalance.haber - monthlyBalance.debe;
                    totalValue = totalBalance.haber - totalBalance.debe;

                    // Acumular para cálculo de NET
                    if (!account.canHaveChildren) {
                        totalIncomeMonthly += monthlyValue;
                        totalIncomeTotal += totalValue;
                    }
                } else {
                    monthlyValue = monthlyBalance.debe - monthlyBalance.haber;
                    totalValue = totalBalance.debe - totalBalance.haber;

                    // Acumular para cálculo de NET
                    if (!account.canHaveChildren) {
                        totalExpenseMonthly += monthlyValue;
                        totalExpenseTotal += totalValue;
                    }
                }

                // Agregar al reporte
                report.push({
                    code: accountCode,
                    name: account.name,
                    level: account.level,
                    monthly: monthlyValue,
                    total: totalValue,
                    isHeader: account.canHaveChildren,
                    isIncome: account.isIncome,
                    isExpense: account.isExpense
                });

                // Procesar hijos si es header
                if (account.canHaveChildren) {
                    account.children.forEach(childCode => processAccount(childCode));
                }
            };

            processAccount(rootCode);
        });

        // Ordenar el reporte por código
        report.sort((a, b) => a.code.localeCompare(b.code));

        // Calcular NET solo si hay valores
        const netMonthly = totalIncomeMonthly - totalExpenseMonthly;
        const netTotal = totalIncomeTotal - totalExpenseTotal;

        if (totalIncomeMonthly !== 0 || totalExpenseMonthly !== 0 || totalIncomeTotal !== 0 || totalExpenseTotal !== 0) {
            report.push({
                code: 'NET',
                name: 'UTILIDAD O PÉRDIDA',
                level: 0,
                monthly: netMonthly,
                total: netTotal,
                isHeader: true,
                isIncome: false,
                isExpense: false
            });
        }

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
        const formatToDate = toDate.toISOString().split('T')[0];

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
                fecha_emision: LessThanOrEqual(new Date(`${formatToDate}T23:59:59.999Z`)),
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
                isRoot: account.code === '1.' || account.code === '2.' || account.code === '3.' // Cuentas raíz
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

        // Función para verificar si una cuenta tiene valores o hijos con valores
        const hasValueOrChildrenWithValues = (accountCode: string): boolean => {
            const account = accountHierarchy[accountCode];
            if (!account) return false;

            // Si es cuenta raíz, siempre incluir
            if (account.isRoot) return true;

            const balance = calculateAccountBalance(accountCode);
            let value = 0;

            if (account.isAsset) {
                value = balance.debe - balance.haber;
            } else if (account.isLiability || account.isEquity) {
                value = balance.haber - balance.debe;
            }

            // Si tiene valor distinto de cero, incluir
            if (value !== 0) return true;

            // Si es header y tiene hijos con valores, incluir
            if (account.canHaveChildren) {
                return account.children.some(childCode => hasValueOrChildrenWithValues(childCode));
            }

            return false;
        };

        // Función recursiva para construir el reporte
        const buildReport = (accountCode: string, targetLevel: number | 'All') => {
            const account = accountHierarchy[accountCode];
            if (!account || !hasValueOrChildrenWithValues(accountCode)) return [];

            const reportItems = [];
            const balance = calculateAccountBalance(accountCode);

            // Calcular el valor de la cuenta según su tipo
            let value;
            if (account.isAsset) {
                value = balance.debe - balance.haber;
            } else if (account.isLiability || account.isEquity) {
                value = balance.haber - balance.debe;
            } else {
                value = 0;
            }

            // Determinar si es header según el nivel
            const isHeader = account.canHaveChildren &&
                (targetLevel === 'All' || account.level < targetLevel);

            // Solo incluir si:
            // 1. Es cuenta raíz (1., 2., 3.) O
            // 2. Tiene valor distinto de cero O
            // 3. Es header con hijos que tienen valores
            if (account.isRoot || value !== 0 || (isHeader && account.children.some(childCode => hasValueOrChildrenWithValues(childCode)))) {
                reportItems.push({
                    code: accountCode,
                    name: account.name,
                    level: account.level,
                    total: value,
                    isHeader: isHeader,
                    isAsset: account.isAsset,
                    isLiability: account.isLiability,
                    isEquity: account.isEquity
                });

                // Procesar hijos si es header
                if (isHeader) {
                    account.children.forEach(childCode => {
                        const childItems = buildReport(childCode, targetLevel);
                        reportItems.push(...childItems);
                    });
                }
            }

            return reportItems;
        };

        // Construir el reporte para cada categoría principal
        const report = [
            ...buildReport('1.', level || 'All'),
            ...buildReport('2.', level || 'All'),
            ...buildReport('3.', level || 'All')
        ];

        // Ordenar reporte por código
        report.sort((a, b) => a.code.localeCompare(b.code));

        // Calcular totales solo con las cuentas principales (1., 2., 3.)
        const totalAssets = calculateAccountBalance('1.').debe - calculateAccountBalance('1.').haber;
        const totalLiabilities = calculateAccountBalance('2.').haber - calculateAccountBalance('2.').debe;
        const totalEquity = calculateAccountBalance('3.').haber - calculateAccountBalance('3.').debe;

        // Agregar líneas de resumen solo si hay valores
        if (totalAssets !== 0 || totalLiabilities !== 0 || totalEquity !== 0) {
            report.push(
                { code: 'TOTALPYP', name: 'TOTAL PASIVOS + PATRIMONIO', level: 0, total: totalLiabilities + totalEquity, isHeader: true },
                { code: 'NET', name: 'UTILIDAD O PÉRDIDA', level: 0, total: totalAssets - totalLiabilities - totalEquity, isHeader: true },
                { code: 'TOTALPYPNET', name: 'TOTAL PASIVOS + PATRIMONIO + NET', level: 0, total: (totalLiabilities + totalEquity)+(totalAssets - totalLiabilities - totalEquity), isHeader: true }
            );
        }

        // Verificación de ecuación contable
        const balanceCorrecto = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

        return {
            report,
            endDate: formatToDate,
            level: level || 'All',
            balanceCorrecto,
        };
    }

    async getLibroDiario(
        empresaId: number,
        fechaDesde?: Date | string,
        fechaHasta?: Date | string,
        codigoTransaccion?: string
    ) {
        // Validar fechas
        if (!fechaDesde || !fechaHasta) {
            throw new Error('Debe proporcionar fechas de inicio y fin');
        }
    
        // Ajustar fechas
        const fromDate = new Date(fechaDesde);
        fromDate.setUTCHours(0, 0, 0, 0);
        
        const toDate = new Date(fechaHasta);
        toDate.setUTCHours(23, 59, 59, 999);
    
        // Crear condiciones de búsqueda
        const where: any = {
            empresa_id: empresaId,
            fecha_emision: Between(fromDate, toDate),
        };
    
        if (codigoTransaccion) {
            where.codigo_transaccion = Like(`%${codigoTransaccion}%`);
        }
    
        // Obtener asientos
        const asientos = await this.accountingEntryRepository.find({
            where,
            relations: ['lineItems'],
            order: {
                fecha_emision: 'ASC',
                nro_asiento: 'ASC',
            },
        });
    
        // Formatear respuesta
        const asientosFormateados = asientos.map(asiento => {
            const items = asiento.lineItems.map(item => ({
                cta: item.cta,
                cta_nombre: item.cta_nombre,
                codigo_centro: item.codigo_centro || '',
                debe: typeof item.debe === 'string' ? parseFloat(item.debe) : Number(item.debe) || 0,
                haber: typeof item.haber === 'string' ? parseFloat(item.haber) : Number(item.haber) || 0,
                nota: item.nota || '',
            }));
    
            return {
                id: asiento.id,
                fecha_emision: asiento.fecha_emision,
                nro_asiento: asiento.nro_asiento,
                codigo_transaccion: asiento.codigo_transaccion,
                comentario: asiento.comentario || '',
                nro_referencia: asiento.nro_referencia || '',
                total_debe: items.reduce((sum, item) => sum + item.debe, 0),
                total_haber: items.reduce((sum, item) => sum + item.haber, 0),
                items,
            };
        });
    
        // Calcular totales generales
        const totalDebe = asientosFormateados.reduce((sum, asiento) => sum + asiento.total_debe, 0);
        const totalHaber = asientosFormateados.reduce((sum, asiento) => sum + asiento.total_haber, 0);
        const totalDiferencia = Math.abs(totalDebe - totalHaber);
    
        return {
            asientos: asientosFormateados,
            fechaDesde: this.formatDateToISO(fromDate),
            fechaHasta: this.formatDateToISO(toDate),
            codigoTransaccion: codigoTransaccion || null,
            totalDebe,
            totalHaber,
            totalDiferencia,
        };
    }
    
    private formatDateToISO(date: Date): string {
        return date.toISOString().split('T')[0];
    }
    
    
}