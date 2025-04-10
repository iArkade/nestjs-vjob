import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AccountingPlan } from '../accounting-plan/entities/accounting-plan.entity';
import { AsientoItem } from '../asiento/entities/asiento-item.entity';
import { Asiento } from '../asiento/entities/asiento.entity';
import { Between, LessThan, LessThanOrEqual, Like, Repository } from 'typeorm';
import { BalanceComprobacionItem, BalanceGeneralItem, LibroDiarioItem, MayorGeneralItem, ProfitAndLossItem } from './interfaces/reportes.interfaces';

@Injectable()
export class ReportesService {
    constructor(
        @InjectRepository(Asiento)
        private readonly accountingEntryRepository: Repository<Asiento>,
        @InjectRepository(AsientoItem)
        private accountingEntryItemRepository: Repository<AsientoItem>,
        @InjectRepository(AccountingPlan)
        private accountPlanRepository: Repository<AccountingPlan>,
    ) {}

    private formatDateToISO(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private clasificarTipoCuenta(codigo: string): 'activo' | 'pasivo' | 'patrimonio' | 'ingreso' | 'gasto' {
        const firstChar = codigo[0];
        switch (firstChar) {
            case '1': return 'activo';
            case '2': return 'pasivo';
            case '3': return 'patrimonio';
            case '4': return 'ingreso';
            case '5': return 'gasto';
            default: return 'activo';
        }
    }

    private async getAccountPlans(empresaId: number, filter?: (account: AccountingPlan) => boolean) {
        const accounts = await this.accountPlanRepository.find({
            where: { empresa_id: empresaId },
            order: { code: 'ASC' },
        });
        return filter ? accounts.filter(filter) : accounts;
    }

    async getAccountingEntries(
        empresaId: number,
        { from, to }: { from?: Date; to?: Date }
      ) {
        const query = this.accountingEntryRepository
          .createQueryBuilder('asiento')
          .leftJoinAndSelect('asiento.lineItems', 'lineItems')  // ← Carga los items
          .where('asiento.empresa_id = :empresaId', { empresaId });
      
        if (from) query.andWhere('asiento.fecha_emision >= :from', { from });
        if (to) query.andWhere('asiento.fecha_emision <= :to', { to });
      
        return query.getMany();
      }

    private processEntryItems(entries: Asiento[], accountValues: Record<string, any>) {
        if (!entries || !accountValues) {
            console.error('Datos inválidos:', { entries, accountValues });
            return;
        }
    
        entries.forEach((entry, i) => {
            if (!entry.lineItems) {
                console.error(`Entry ${i} no tiene lineItems:`, entry);
                return;
            }
    
            entry.lineItems.forEach((item, j) => {
                const accountCode = item.cta;
                if (!accountCode) {
                    console.error(`Item ${j} en entry ${i} no tiene cta:`, item);
                    return;
                }
    
                if (!accountValues[accountCode]) {
                    console.warn(`Cuenta ${accountCode} no encontrada en accountValues`);
                    return;
                }
    
                // Asegúrate que los campos existen
                accountValues[accountCode].saldoAnteriorDebe += Number(item.debe) || 0;
                accountValues[accountCode].saldoAnteriorHaber += Number(item.haber) || 0;
            });
        });
    }

    private buildAccountHierarchy(accounts: AccountingPlan[], filter: (code: string) => boolean) {
        const hierarchy: Record<string, any> = {};

        accounts.filter(account => filter(account.code)).forEach(account => {
            const code = account.code;
            const parts = code.split('.').filter(Boolean);
            const level = parts.length;
            const isRoot = ['1.', '2.', '3.', '4.', '5.'].includes(code);
            
            hierarchy[code] = {
                code,
                name: account.name,
                children: [],
                parent: null,
                level,
                isAsset: code.startsWith('1'),
                isLiability: code.startsWith('2'),
                isEquity: code.startsWith('3'),
                isIncome: code.startsWith('4'),
                isExpense: code.startsWith('5'),
                canHaveChildren: code.endsWith('.'),
                isRoot
            };

            if (level > 1) {
                const parentCode = parts.slice(0, -1).join('.') + '.';
                if (hierarchy[parentCode]?.canHaveChildren) {
                    hierarchy[parentCode].children.push(code);
                    hierarchy[code].parent = parentCode;
                }
            }
        });

        return hierarchy;
    }

    async getProfitAndLoss(
        empresaId: number,
        startDate?: Date,
        endDate?: Date,
        level?: number | 'All'
    ) {
        const fromDate = startDate || new Date(new Date().getFullYear(), 0, 1);
        const toDate = endDate || new Date();

        const accountPlans = await this.getAccountPlans(empresaId, account => 
            account.code.startsWith('4') || account.code.startsWith('5')
        );

        const [totalEntries, monthlyEntries] = await Promise.all([
            this.getAccountingEntries(empresaId, { to: toDate }),
            this.getAccountingEntries(empresaId, { from: fromDate, to: toDate })
        ]);

        const accountValues = {
            total: Object.fromEntries(accountPlans.map(a => [a.code, { debe: 0, haber: 0 }])),
            monthly: Object.fromEntries(accountPlans.map(a => [a.code, { debe: 0, haber: 0 }]))
        };

        this.processEntryItems(totalEntries, accountValues.total);
        this.processEntryItems(monthlyEntries, accountValues.monthly);

        const accountHierarchy = this.buildAccountHierarchy(accountPlans, code => 
            code.startsWith('4') || code.startsWith('5')
        );

        const calculateAccountBalance = (accountCode: string, valueType: 'total' | 'monthly') => {
            const account = accountHierarchy[accountCode];
            if (!account) return { debe: 0, haber: 0 };

            const directValues = accountValues[valueType][accountCode] || { debe: 0, haber: 0 };
            let totalDebe = directValues.debe;
            let totalHaber = directValues.haber;

            if (account.canHaveChildren) {
                account.children.forEach((childCode: string) => {
                    const childBalance = calculateAccountBalance(childCode, valueType);
                    totalDebe += childBalance.debe;
                    totalHaber += childBalance.haber;
                });
            }

            return { debe: totalDebe, haber: totalHaber };
        };

        const hasChildrenWithValues = (accountCode: string, valueType: 'total' | 'monthly') => {
            const account = accountHierarchy[accountCode];
            return account?.canHaveChildren && account.children.some((childCode: string) => {
                const childBalance = calculateAccountBalance(childCode, valueType);
                const childValue = account.isIncome 
                    ? childBalance.haber - childBalance.debe 
                    : childBalance.debe - childBalance.haber;
                return childValue !== 0 || hasChildrenWithValues(childCode, valueType);
            });
        };

        const shouldIncludeAccount = (accountCode: string) => {
            const account = accountHierarchy[accountCode];
            if (!account) return false;

            const monthlyBalance = calculateAccountBalance(accountCode, 'monthly');
            const totalBalance = calculateAccountBalance(accountCode, 'total');

            const monthlyValue = account.isIncome
                ? monthlyBalance.haber - monthlyBalance.debe
                : monthlyBalance.debe - monthlyBalance.haber;

            const totalValue = account.isIncome
                ? totalBalance.haber - totalBalance.debe
                : totalBalance.debe - totalBalance.haber;

            return account.isRoot || monthlyValue !== 0 || totalValue !== 0 || (account.canHaveChildren && (hasChildrenWithValues(accountCode, 'monthly') || hasChildrenWithValues(accountCode, 'total')));
        };

        const report: ProfitAndLossItem[] = [];
        let totalIncomeMonthly = 0;
        let totalExpenseMonthly = 0;
        let totalIncomeTotal = 0;
        let totalExpenseTotal = 0;

        const processAccount = (accountCode: string) => {
            const account = accountHierarchy[accountCode];
            if (!account || !shouldIncludeAccount(accountCode)) return;

            const monthlyBalance = calculateAccountBalance(accountCode, 'monthly');
            const totalBalance = calculateAccountBalance(accountCode, 'total');

            let monthlyValue, totalValue;
            if (account.isIncome) {
                monthlyValue = monthlyBalance.haber - monthlyBalance.debe;
                totalValue = totalBalance.haber - totalBalance.debe;

                if (!account.canHaveChildren) {
                    totalIncomeMonthly += monthlyValue;
                    totalIncomeTotal += totalValue;
                }
            } else {
                monthlyValue = monthlyBalance.debe - monthlyBalance.haber;
                totalValue = totalBalance.debe - totalBalance.haber;

                if (!account.canHaveChildren) {
                    totalExpenseMonthly += monthlyValue;
                    totalExpenseTotal += totalValue;
                }
            }

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

            if (account.canHaveChildren) {
                account.children.forEach(processAccount);
            }
        };

        ['4.', '5.'].forEach(rootCode => accountHierarchy[rootCode] && processAccount(rootCode));
        report.sort((a, b) => a.code.localeCompare(b.code));

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
            report,
            startDate: this.formatDateToISO(fromDate),
            endDate: this.formatDateToISO(toDate),
            level: level || 'All',
        };
    }

    async getBalanceGeneral(
        empresaId: number,
        endDate?: Date,
        level?: number | 'All'
    ) {
        const toDate = endDate || new Date();
        const formatToDate = this.formatDateToISO(toDate);

        const accountPlans = await this.getAccountPlans(empresaId, account => 
            account.code.startsWith('1') || account.code.startsWith('2') || account.code.startsWith('3')
        );

        const entries = await this.getAccountingEntries(empresaId, { to: toDate });

        const accountValues = Object.fromEntries(accountPlans.map(a => [a.code, { debe: 0, haber: 0 }]));
        this.processEntryItems(entries, accountValues);

        const accountHierarchy = this.buildAccountHierarchy(accountPlans, code => 
            code.startsWith('1') || code.startsWith('2') || code.startsWith('3')
        );

        const calculateAccountBalance = (accountCode: string) => {
            const account = accountHierarchy[accountCode];
            if (!account) return { debe: 0, haber: 0 };

            let { debe, haber } = accountValues[accountCode] || { debe: 0, haber: 0 };

            if (account.canHaveChildren) {
                account.children.forEach((childCode: string) => {
                    const childBalance = calculateAccountBalance(childCode);
                    debe += childBalance.debe;
                    haber += childBalance.haber;
                });
            }

            return { debe, haber };
        };

        const hasValueOrChildrenWithValues = (accountCode: string): boolean => {
            const account = accountHierarchy[accountCode];
            if (!account) return false;
            if (account.isRoot) return true;

            const balance = calculateAccountBalance(accountCode);
            const value = account.isAsset 
                ? balance.debe - balance.haber 
                : balance.haber - balance.debe;

            return value !== 0 || (account.canHaveChildren && 
                account.children.some((childCode: string) => hasValueOrChildrenWithValues(childCode)));
        };

        const buildReport = (accountCode: string, targetLevel: number | 'All') => {
            const account = accountHierarchy[accountCode];
            if (!account || !hasValueOrChildrenWithValues(accountCode)) return [];

            const reportItems = [];
            const balance = calculateAccountBalance(accountCode);
            const value = account.isAsset 
                ? balance.debe - balance.haber 
                : balance.haber - balance.debe;

            const isHeader = account.canHaveChildren && (targetLevel === 'All' || account.level < targetLevel);

            if (account.isRoot || value !== 0 || (isHeader && account.children.some(hasValueOrChildrenWithValues))) {
                reportItems.push({
                    code: accountCode,
                    name: account.name,
                    level: account.level,
                    total: value,
                    isHeader,
                    isAsset: account.isAsset,
                    isLiability: account.isLiability,
                    isEquity: account.isEquity
                });

                if (isHeader) {
                    account.children.forEach((childCode: string) => {
                        reportItems.push(...buildReport(childCode, targetLevel));
                    });
                }
            }

            return reportItems;
        };

        const report = [
            ...buildReport('1.', level || 'All'),
            ...buildReport('2.', level || 'All'),
            ...buildReport('3.', level || 'All')
        ].sort((a, b) => a.code.localeCompare(b.code));

        const totalAssets = calculateAccountBalance('1.').debe - calculateAccountBalance('1.').haber;
        const totalLiabilities = calculateAccountBalance('2.').haber - calculateAccountBalance('2.').debe;
        const totalEquity = calculateAccountBalance('3.').haber - calculateAccountBalance('3.').debe;

        if (totalAssets !== 0 || totalLiabilities !== 0 || totalEquity !== 0) {
            report.push(
                { 
                    code: 'TOTALPYP', 
                    name: 'TOTAL PASIVOS + PATRIMONIO', 
                    level: 0, 
                    total: totalLiabilities + totalEquity, 
                    isHeader: true,
                    isAsset: false,
                    isLiability: false,
                    isEquity: false
                },
                {
                    code: 'NET', 
                    name: 'UTILIDAD O PÉRDIDA', 
                    level: 0, 
                    total: totalAssets - totalLiabilities - totalEquity, 
                    isHeader: true,
                    isAsset: false,
                    isLiability: false,
                    isEquity: false
                },
                {
                    code: 'TOTALPYPNET', 
                    name: 'TOTAL PASIVOS + PATRIMONIO + NET', 
                    level: 0, 
                    total: (totalLiabilities + totalEquity) + (totalAssets - totalLiabilities - totalEquity), 
                    isHeader: true,
                    isAsset: false,
                    isLiability: false,
                    isEquity: false
                }
            );
        }

        return {
            report,
            endDate: formatToDate,
            level: level || 'All',
            balanceCorrecto: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        };
    }

    async getLibroDiario(
        empresaId: number,
        fechaDesde?: Date | string,
        fechaHasta?: Date | string,
        codigoTransaccion?: string
    ) {
        if (!fechaDesde || !fechaHasta) {
            throw new BadRequestException('Debe proporcionar fechas de inicio y fin');
        }

        const fromDate = new Date(fechaDesde);
        fromDate.setUTCHours(0, 0, 0, 0);

        const toDate = new Date(fechaHasta);
        toDate.setUTCHours(23, 59, 59, 999);

        const where: any = {
            empresa_id: empresaId,
            fecha_emision: Between(fromDate, toDate),
        };

        if (codigoTransaccion) {
            where.codigo_transaccion = Like(`%${codigoTransaccion}%`);
        }

        const asientos = await this.accountingEntryRepository.find({
            where,
            relations: ['lineItems'],
            order: { fecha_emision: 'ASC', nro_asiento: 'ASC' },
        });

        const asientosFormateados = asientos.map(asiento => {
            const items = asiento.lineItems.map(item => ({
                cta: item.cta,
                cta_nombre: item.cta_nombre,
                codigo_centro: item.codigo_centro || '',
                debe: Number(item.debe) || 0,
                haber: Number(item.haber) || 0,
                nota: item.nota || '',
            }));

            const total_debe = items.reduce((sum, item) => sum + item.debe, 0);
            const total_haber = items.reduce((sum, item) => sum + item.haber, 0);

            return {
                id: asiento.id,
                fecha_emision: asiento.fecha_emision,
                nro_asiento: asiento.nro_asiento,
                codigo_transaccion: asiento.codigo_transaccion,
                comentario: asiento.comentario || '',
                nro_referencia: asiento.nro_referencia || '',
                total_debe,
                total_haber,
                items,
            };
        });

        const totalDebe = asientosFormateados.reduce((sum, asiento) => sum + asiento.total_debe, 0);
        const totalHaber = asientosFormateados.reduce((sum, asiento) => sum + asiento.total_haber, 0);

        return {
            asientos: asientosFormateados,
            fechaDesde: this.formatDateToISO(fromDate),
            fechaHasta: this.formatDateToISO(toDate),
            codigoTransaccion: codigoTransaccion || null,
            totalDebe,
            totalHaber,
            totalDiferencia: Math.abs(totalDebe - totalHaber),
        };
    }

    async getMayorGeneral(
        empresaId: number,
        initialAccount?: string,
        finalAccount?: string,
        startDate?: Date,
        endDate?: Date,
        transaction?: string,
    ) {
        const saldoAnteriorPorCuenta = await this.obtenerSaldosAnteriores(
            empresaId,
            startDate,
            initialAccount,
            finalAccount,
        );

        const query = this.accountingEntryItemRepository
            .createQueryBuilder('item')
            .innerJoinAndSelect('item.asiento', 'asiento')
            .where('asiento.empresa_id = :empresaId', { empresaId });

        if (startDate) {
            query.andWhere('asiento.fecha_emision >= :startDate', {
                startDate: this.formatDateToISO(startDate)
            });
        }

        if (endDate) {
            query.andWhere('asiento.fecha_emision <= :endDate', {
                endDate: this.formatDateToISO(endDate)
            });
        }

        if (initialAccount && finalAccount) {
            query.andWhere('item.cta BETWEEN :initialAccount AND :finalAccount', {
                initialAccount,
                finalAccount,
            });
        }

        if (transaction) {
            query.andWhere('asiento.codigo_transaccion = :transaction', {
                transaction,
            });
        }

        const items = await query
            .orderBy('item.cta', 'ASC')
            .addOrderBy('asiento.fecha_emision', 'ASC')
            .addOrderBy('asiento.nro_asiento', 'ASC')
            .getMany();

        return this.groupByCuenta(items, saldoAnteriorPorCuenta);
    }

    private async obtenerSaldosAnteriores(
        empresaId: number,
        startDate?: Date,
        initialAccount?: string,
        finalAccount?: string,
    ) {
        if (!startDate) return {};

        const query = this.accountingEntryItemRepository
            .createQueryBuilder('item')
            .innerJoin('item.asiento', 'asiento')
            .select('item.cta', 'cuenta')
            .addSelect('SUM(item.debe)', 'totalDebe')
            .addSelect('SUM(item.haber)', 'totalHaber')
            .where('asiento.empresa_id = :empresaId', { empresaId })
            .andWhere('asiento.fecha_emision < :startDate', {
                startDate: this.formatDateToISO(startDate)
            });

        if (initialAccount && finalAccount) {
            query.andWhere('item.cta BETWEEN :initialAccount AND :finalAccount', {
                initialAccount,
                finalAccount,
            });
        }

        const resultados = await query.groupBy('item.cta').getRawMany();

        return resultados.reduce((saldos, row) => {
            saldos[row.cuenta] = parseFloat(row.totalDebe || 0) - parseFloat(row.totalHaber || 0);
            return saldos;
        }, {});
    }

    private groupByCuenta(items: AsientoItem[], saldoAnteriorPorCuenta: Record<string, number> = {}) {
        const resultado: Record<string, any> = {};

        items.forEach(item => {
            const cuentaClave = `${item.cta} ${item.cta_nombre}`;
            if (!resultado[cuentaClave]) {
                resultado[cuentaClave] = {
                    cuenta: cuentaClave,
                    movimientos: [],
                    saldoInicial: saldoAnteriorPorCuenta[item.cta] || 0,
                };
            }

            const asiento = item.asiento;
            resultado[cuentaClave].movimientos.push({
                fecha: asiento.fecha_emision,
                nro_asiento: asiento.nro_asiento,
                descripcion: asiento.comentario,
                nota: item.nota,
                debe: Number(item.debe),
                haber: Number(item.haber),
            });
        });

        return Object.values(resultado).map((cuenta: any) => {
            let saldo = cuenta.saldoInicial;
            cuenta.movimientos = cuenta.movimientos.map((m: any) => {
                saldo += m.debe - m.haber;
                return { ...m, saldo };
            });
            return cuenta;
        });
    }

    async getBalanceComprobacion(
        empresaId: number,
        startDate?: Date,
        endDate?: Date,
        initialAccount?: string,
        finalAccount?: string,
        level?: number
    ) {
        if (!startDate || !endDate) {
            throw new BadRequestException('Debe proporcionar fechas de inicio y fin');
        }

        const fromDate = new Date(startDate);
        fromDate.setUTCHours(0, 0, 0, 0);

        const toDate = new Date(endDate);
        toDate.setUTCHours(23, 59, 59, 999);

        const accountPlans = await this.getAccountPlans(empresaId);
        let filteredAccounts = accountPlans;

        if (initialAccount && finalAccount) {
            filteredAccounts = accountPlans.filter(account =>
                account.code >= initialAccount && account.code <= finalAccount
            );
        }
        

        if (level) {
            filteredAccounts = filteredAccounts.filter(account =>
                account.code.split('.').filter(Boolean).length <= level
            );
        }

        const [saldoAnteriorEntries, movimientosEntries] = await Promise.all([
            this.getAccountingEntries(empresaId, { to: fromDate }),
            this.getAccountingEntries(empresaId, { from: fromDate, to: toDate })
        ]);

        const accountValues: Record<string, any> = {};

        filteredAccounts.forEach(account => {
            accountValues[account.code] = {
                saldoAnteriorDebe: 0,
                saldoAnteriorHaber: 0,
                movimientosDebe: 0,
                movimientosHaber: 0,
                tipoCuenta: this.clasificarTipoCuenta(account.code)
            };
        });       
        

        this.processEntryItems(saldoAnteriorEntries, accountValues);
        this.processEntryItems(movimientosEntries, accountValues);


        const reportItems: { codigo: string; nombre: string; saldoAnteriorDebe: any; saldoAnteriorHaber: any; movimientosDebe: any; movimientosHaber: any; saldoDebe: number; saldoHaber: number; tipoCuenta: any; level: number; }[] = [];
        let totals = {
            saldoAnteriorDebe: 0,
            saldoAnteriorHaber: 0,
            movimientosDebe: 0,
            movimientosHaber: 0,
            saldosDebe: 0,
            saldosHaber: 0
        };

        filteredAccounts.forEach(account => {
            const values = accountValues[account.code];
            const tipo = values.tipoCuenta;

            let saldoDebe = 0;
            let saldoHaber = 0;

            if (tipo === 'activo' || tipo === 'gasto') {
                const saldoAnterior = values.saldoAnteriorDebe - values.saldoAnteriorHaber;
                const saldoMovimientos = -values.movimientosHaber + values.movimientosDebe;
                const saldoFinal = saldoAnterior + saldoMovimientos;

                if (saldoFinal > 0) saldoDebe = saldoFinal;
                else saldoHaber = Math.abs(saldoFinal);
            } else {
                const saldoAnterior = values.saldoAnteriorHaber - values.saldoAnteriorDebe;
                const saldoMovimientos = values.movimientosHaber - values.movimientosDebe;
                const saldoFinal = saldoAnterior + saldoMovimientos;

                if (saldoFinal > 0) saldoHaber = saldoFinal;
                else saldoDebe = Math.abs(saldoFinal);
            }

            const tieneSaldo = saldoDebe !== 0 || saldoHaber !== 0 ||
                values.saldoAnteriorDebe !== 0 || values.saldoAnteriorHaber !== 0 ||
                values.movimientosDebe !== 0 || values.movimientosHaber !== 0;

            if (tieneSaldo) {
                totals.saldoAnteriorDebe += values.saldoAnteriorDebe;
                totals.saldoAnteriorHaber += values.saldoAnteriorHaber;
                totals.movimientosDebe += values.movimientosDebe;
                totals.movimientosHaber += values.movimientosHaber;
                totals.saldosDebe += saldoDebe;
                totals.saldosHaber += saldoHaber;

                reportItems.push({
                    codigo: account.code,
                    nombre: account.name,
                    saldoAnteriorDebe: values.saldoAnteriorDebe,
                    saldoAnteriorHaber: values.saldoAnteriorHaber,
                    movimientosDebe: values.movimientosDebe,
                    movimientosHaber: values.movimientosHaber,
                    saldoDebe,
                    saldoHaber,
                    tipoCuenta: tipo,
                    level: account.code.split('.').filter(Boolean).length
                });
            }
        });

        

        return {
            report: reportItems,
            startDate: this.formatDateToISO(fromDate),
            endDate: this.formatDateToISO(toDate),
            initialAccount,
            finalAccount,
            level,
            ...totals,
            diferenciaMovimientos: totals.movimientosDebe - totals.movimientosHaber,
            diferenciaSaldos: totals.saldosDebe - totals.saldosHaber
        };
    }
}