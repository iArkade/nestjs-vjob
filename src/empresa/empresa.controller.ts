import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException, ParseIntPipe } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { ApiTags } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { Empresa } from './entities/empresa.entity';

@ApiTags('empresa')
@Controller('empresa')
export class EmpresaController {
    constructor(private readonly empresaService: EmpresaService) { }
    @Get('all')
    async findAll(): Promise<Empresa[]> {
        return await this.empresaService.findAll();
    }

    @Post()
    async create(@Body() createEmpresaDTO: CreateEmpresaDto): Promise<Empresa> {
        return await this.empresaService.create(createEmpresaDTO);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEmpresaDTO: UpdateEmpresaDto,
    ): Promise<Empresa> {
        return await this.empresaService.update(id, updateEmpresaDTO);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return await this.empresaService.delete(id);
    }
}
