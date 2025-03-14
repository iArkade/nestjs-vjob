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
        const accountTotals = this.calculateAccountTotals(entries, accountPlans);

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

    private calculateAccountTotals(entries: Asiento[], accounts: AccountingPlan[]) {
        const accountTotals = {};

        // Initialize all accounts with zero
        accounts.forEach(account => {
            accountTotals[account.code] = {
                monthly: 0,
                total: 0
            };
        });

        // Process each entry and its items
        entries.forEach(entry => {
            entry.lineItems.forEach(item => {
                const accountCode = item.cta;
                if (accountTotals[accountCode]) {
                    // For income accounts (4.x), debit increases
                    if (accountCode.startsWith('4')) {
                        accountTotals[accountCode].monthly += item.debe - item.haber;
                        accountTotals[accountCode].total += item.debe - item.haber;
                    }
                    // For expense accounts (5.x), credit increases
                    else if (accountCode.startsWith('5')) {
                        accountTotals[accountCode].monthly += item.haber - item.debe;
                        accountTotals[accountCode].total += item.haber - item.debe;
                    }
                }
            });
        });

        return accountTotals;
    }

    private buildReportStructure(hierarchy, accountTotals, level = null) {
        const report = [];

        // Get root accounts (4.x and 5.x)
        const rootAccounts = Object.values(hierarchy).filter((account: any) =>
            account.parent === null && (account.isIncome || account.isExpense)
        );

        // Sort by code
        rootAccounts.sort((a: any, b: any) => a.code.localeCompare(b.code));

        // Process each root account and its descendants
        rootAccounts.forEach((rootAccount: any) => {
            // Check if we should include this account based on level
            if (level === null || rootAccount.level <= level) {
                report.push({
                    code: rootAccount.code,
                    name: rootAccount.name,
                    level: rootAccount.level,
                    monthly: accountTotals[rootAccount.code]?.monthly || 0,
                    total: accountTotals[rootAccount.code]?.total || 0,
                    isHeader: true
                });
            }

            // Process children recursively
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

    private addChildrenToReport(
        report,
        parentAccount,
        hierarchy,
        accountTotals,
        level = null
    ) {
        // Sort children by code
        const sortedChildren = [...parentAccount.children].sort();

        sortedChildren.forEach(childCode => {
            const childAccount = hierarchy[childCode];

            // Check if we should include this account based on level
            if (level === null || childAccount.level <= level) {
                report.push({
                    code: childAccount.code,
                    name: childAccount.name,
                    level: childAccount.level,
                    monthly: accountTotals[childAccount.code]?.monthly || 0,
                    total: accountTotals[childAccount.code]?.total || 0,
                    isHeader: childAccount.children.length > 0
                });
            }

            // Recursively add children
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
        // Calculate subtotals for parent accounts
        for (let i = report.length - 1; i >= 0; i--) {
            const account = report[i];

            if (account.isHeader) {
                // Find all direct children
                const childrenIndices = [];
                let level = account.level;

                for (let j = i + 1; j < report.length; j++) {
                    if (report[j].level <= level) {
                        break;
                    }

                    if (report[j].level === level + 1) {
                        childrenIndices.push(j);
                    }
                }

                // Sum up children values
                let monthlySum = 0;
                let totalSum = 0;

                childrenIndices.forEach(idx => {
                    monthlySum += report[idx].monthly;
                    totalSum += report[idx].total;
                });

                // Update parent account
                account.monthly = monthlySum;
                account.total = totalSum;
            }
        }

        // Calculate total income and expenses
        let totalIncome = 0;
        let totalExpenses = 0;

        report.forEach(item => {
            if (item.code.startsWith('4') && item.level === 1) {
                totalIncome += item.total;
            } else if (item.code.startsWith('5') && item.level === 1) {
                totalExpenses += item.total;
            }
        });

        // Add net profit/loss row
        report.push({
            code: 'NET',
            name: 'UTILIDAD O PÉRDIDA',
            level: 0,
            monthly: totalIncome - totalExpenses,
            total: totalIncome - totalExpenses,
            isHeader: true
        });
    }
}