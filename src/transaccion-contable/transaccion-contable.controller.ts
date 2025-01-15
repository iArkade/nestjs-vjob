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

        const transaccionesWithCompany = createTransaccionContableDto.map((item) => ({
            ...item,
        }));

        return await this.transaccionContableService.createMany(transaccionesWithCompany);    
    }


    @Get('paginated')
    findAllPaginated(
        @Query('page') page: number = 1,  
        @Query('limit') limit: number = 10,
        @Query('empresa_id') empresa_id: number,
    ) {
        if (!empresa_id) {
            throw new BadRequestException('empresa_id is required');
        }
        return this.transaccionContableService.findAllPaginated(page, limit, empresa_id);
    }

    @Get('all')
    findAll(@Query('empresa_id') empresa_id: number) {
        if (!empresa_id) {
            throw new BadRequestException('empresa_id is required');
        }
        return this.transaccionContableService.findAll(empresa_id);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Query('empresa_id') empresa_id: number) {
        if (!empresa_id) {
            throw new BadRequestException('empresa_id is required');
        }
        return this.transaccionContableService.findOne(+id, empresa_id);
    }

    @Put(':id')
    update(
        @Param('id') id: string, 
        @Body() UpdateTransaccionContablenDto: UpdateTransaccionContablenDto,
        @Query('empresa_id') empresa_id: number,
    ) {
        if (!empresa_id) {
            throw new BadRequestException('empresa_id is required');
        }
        return this.transaccionContableService.update(+id, UpdateTransaccionContablenDto, empresa_id);
    }

    @Delete(':code')
    remove(@Param('code') code: string, @Query('empresa_id') empresa_id: number) {
        if (!empresa_id) {
            throw new BadRequestException('empresa_id is required');
        }
        return this.transaccionContableService.remove(code, empresa_id);
    }
}
