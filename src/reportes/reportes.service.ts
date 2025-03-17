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
        level?: number
    ) {
        // Default dates if not provided
        const fromDate = startDate || new Date(new Date().getFullYear(), 0, 1);
        const toDate = endDate || new Date();

        // Get all account plans for this company
        const accountPlans = await this.accountPlanRepository.find({
            where: { empresa_id: empresaId },
            order: { code: 'ASC' },
        });

        // Get all entries within date range
        const entries = await this.accountingEntryRepository.find({
            where: {
                empresa_id: empresaId,
                fecha_emision: Between(fromDate, toDate),
            },
            relations: ['lineItems'], // Asegúrate de que la relación esté correctamente nombrada
        });

        // Create account hierarchy map
        const accountHierarchy = this.buildAccountHierarchy(accountPlans);

        // Calculate totals for each account
        const accountTotals = this.calculateAccountTotals(entries, accountPlans, fromDate, toDate);

        // Build the report structure
        const report = this.buildReportStructure(accountHierarchy, accountTotals, level);

        // Calculate monthly and total columns
        this.calculateReportTotals(report);

        return {
            report,
            startDate: fromDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
            endDate: toDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
            level: level || 'All',
        };
    }

    private buildAccountHierarchy(accounts: AccountingPlan[]) {
        const hierarchy = {};

        // First pass: create all account nodes
        accounts.forEach(account => {
            hierarchy[account.code] = {
                code: account.code,
                name: account.name,
                children: [],
                parent: null,
                level: account.code.split('.').length,
                isIncome: account.code.startsWith('4'),
                isExpense: account.code.startsWith('5'),
            };
        });

        // Second pass: build parent-child relationships
        Object.values(hierarchy).forEach((account: any) => {
            const codeParts = account.code.split('.');
            if (codeParts.length > 1) {
                codeParts.pop();
                const parentCode = codeParts.join('.');
                if (hierarchy[parentCode]) {
                    hierarchy[parentCode].children.push(account.code);
                    account.parent = parentCode;
                }
            }
        });

        return hierarchy;
    }

    private calculateAccountTotals(entries: Asiento[], accounts: AccountingPlan[], startDate: Date, endDate: Date) {
        const accountTotals = {};
    
        // Inicializar todas las cuentas con valores en cero
        accounts.forEach(account => {
            accountTotals[account.code] = {
                debeMonthly: 0,
                haberMonthly: 0,
                debeTotal: 0,
                haberTotal: 0,
            };
        });
    
        console.log(entries);
        
        // Procesar cada asiento y sus items
        entries.forEach(entry => {
            const entryDate = new Date(entry.fecha_emision);
    
            entry.lineItems.forEach(item => {
                const accountCode = item.cta;
                if (accountTotals[accountCode]) {
                    // Sumar para el período mensual (dentro del rango de fechas)
                    if (entryDate >= startDate && entryDate <= endDate) {
                        accountTotals[accountCode].debeMonthly += item.debe;
                        accountTotals[accountCode].haberMonthly += item.haber;

                        console.log(accountTotals);
                    }
                    // Sumar para el total acumulado (desde el inicio del período hasta endDate)
                    if (entryDate <= endDate) {
                        accountTotals[accountCode].debeTotal += item.debe;
                        accountTotals[accountCode].haberTotal += item.haber;
                    }
                }
            });
        });
    
        return accountTotals;
    }

    private buildReportStructure(hierarchy, accountTotals, level = null) {
        const report = [];
    
        // Obtener las cuentas raíz (4.x y 5.x)
        const rootAccounts = Object.values(hierarchy).filter((account: any) =>
            account.parent === null && (account.isIncome || account.isExpense)
        );
    
        // Ordenar por código
        rootAccounts.sort((a: any, b: any) => a.code.localeCompare(b.code));
    
        // Procesar cada cuenta raíz y sus descendientes
        rootAccounts.forEach((rootAccount: any) => {
            // Verificar si debemos incluir esta cuenta basado en el nivel
            if (level === null || rootAccount.level <= level) {
                const monthlyDebe = this.sumAccountTotals(rootAccount, accountTotals, 'debeMonthly');
                const monthlyHaber = this.sumAccountTotals(rootAccount, accountTotals, 'haberMonthly');
                const totalDebe = this.sumAccountTotals(rootAccount, accountTotals, 'debeTotal');
                const totalHaber = this.sumAccountTotals(rootAccount, accountTotals, 'haberTotal');
    
                report.push({
                    code: rootAccount.code,
                    name: rootAccount.name,
                    level: rootAccount.level,
                    debeMonthly: monthlyDebe,
                    haberMonthly: monthlyHaber,
                    debeTotal: totalDebe,
                    haberTotal: totalHaber,
                    isHeader: true
                });
            }
    
            // Procesar hijos recursivamente
            this.addChildrenToReport(
                report,
                rootAccount,
                hierarchy,
                accountTotals,
                level
            );
        });
    
        return report;
    }
    
    private sumAccountTotals(account, accountTotals, field) {
        let total = accountTotals[account.code]?.[field] || 0;
    
        // Sumar los valores de los hijos
        account.children.forEach(childCode => {
            const childAccount = accountTotals[childCode];
            if (childAccount) {
                total += childAccount[field] || 0;
            }
        });
    
        return total;
    }

    private addChildrenToReport(
        report,
        parentAccount,
        hierarchy,
        accountTotals,
        level = null
    ) {
        // Ordenar hijos por código
        const sortedChildren = [...parentAccount.children].sort();
    
        sortedChildren.forEach(childCode => {
            const childAccount = hierarchy[childCode];
    
            // Verificar si debemos incluir esta cuenta basado en el nivel
            if (level === null || childAccount.level <= level) {
                const monthlyDebe = accountTotals[childAccount.code]?.debeMonthly || 0;
                const monthlyHaber = accountTotals[childAccount.code]?.haberMonthly || 0;
                const totalDebe = accountTotals[childAccount.code]?.debeTotal || 0;
                const totalHaber = accountTotals[childAccount.code]?.haberTotal || 0;
    
                report.push({
                    code: childAccount.code,
                    name: childAccount.name,
                    level: childAccount.level,
                    debeMonthly: monthlyDebe,
                    haberMonthly: monthlyHaber,
                    debeTotal: totalDebe,
                    haberTotal: totalHaber,
                    isHeader: childAccount.children.length > 0
                });
            }
    
            // Agregar hijos recursivamente
            if (childAccount.children.length > 0) {
                this.addChildrenToReport(
                    report,
                    childAccount,
                    hierarchy,
                    accountTotals,
                    level
                );
            }
        });
    }

    private calculateReportTotals(report) {
        let totalIncome = 0;
        let totalExpenses = 0;

        //console.log(report);
        
    
        // Calcular ingresos y gastos totales
        report.forEach(item => {
            if (item.code.startsWith('4') && item.level === 1) {
                totalIncome += item.haberTotal - item.debeTotal;
            } else if (item.code.startsWith('5') && item.level === 1) {
                totalExpenses += item.debeTotal - item.haberTotal;
            }
        });
    
        // Agregar fila de utilidad o pérdida
        report.push({
            code: 'NET',
            name: 'UTILIDAD O PÉRDIDA',
            level: 0,
            debeMonthly: 0,
            haberMonthly: totalIncome - totalExpenses,
            debeTotal: 0,
            haberTotal: totalIncome - totalExpenses,
            isHeader: true
        });
    }
}


// report.push({
//     code: 'NET',
//     name: 'UTILIDAD O PÉRDIDA',
//     level: 0,
//     monthly: totalIncome - totalExpenses,
//     total: totalIncome - totalExpenses,
//     isHeader: true
// });