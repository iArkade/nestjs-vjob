import { Controller, Get, Param, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
    constructor(private readonly reportsService: ReportesService) { }

    @Get('perdidas-ganancias/:empresaId')
    async getProfitAndLoss(
        @Param('empresaId') empresaId: number,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('level') level?: number,
    ) {
        return this.reportsService.getProfitAndLoss(
            empresaId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
            level ? Number(level) : undefined,
        );
    }

    @Get('balance-general/:empresaId')
    async getBalanceGeneral(
        @Param('empresaId') empresaId: number,
        @Query('endDate') endDate?: string,
        @Query('level') level?: number,
    ) {        

        return this.reportsService.getBalanceGeneral(
            empresaId,
            endDate ? new Date(endDate) : undefined,
            level ? Number(level) : undefined,
        );
    }
}