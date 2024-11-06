import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TransaccionContableService } from './transaccion-contable.service';
import { CreateTransaccionContableDto } from './dto/create-transaccion-contable.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateTransaccionContablenDto } from './dto/update-transaccion-contable.dto';

@ApiTags('transaccion-contable')
@Controller('transaccion-contable')
export class TransaccionContableController {
    constructor(private readonly transaccionContableService: TransaccionContableService) { }

    @Post()
    async create(@Body() createTransaccionContableDto: CreateTransaccionContableDto | CreateTransaccionContableDto[]) {
        // Si es un solo objeto, lo convertimos en un array
        if (!Array.isArray(createTransaccionContableDto)) {
            createTransaccionContableDto = [createTransaccionContableDto];
        }
        return await this.transaccionContableService.createMany(createTransaccionContableDto);    
    }


    @Get('paginated')
    findAllPaginated(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        return this.transaccionContableService.findAllPaginated(page, limit);
    }

    @Get('all')
    findAll() {
        return this.transaccionContableService.findAll();
    }


    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.transaccionContableService.findOne(+id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateAccountingPlanDto: UpdateTransaccionContablenDto) {
        return this.transaccionContableService.update(+id, updateAccountingPlanDto);
    }

    @Delete(':code')
    remove(@Param('code') code: string) {
        return this.transaccionContableService.remove(code);
    }
}
