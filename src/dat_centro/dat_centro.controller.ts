import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, BadRequestException } from '@nestjs/common';
import { DatCentroService } from './dat_centro.service';
import { CreateDatCentroDto } from './dto/create-dat_centro.dto';
import { UpdateDatCentroDto } from './dto/update-dat_centro.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('dat_centro')
@Controller('dat-centro')
export class DatCentroController {
  constructor(private readonly datCentroService: DatCentroService) {}

  @Post()
  async create(@Body() createDatCentroDto: CreateDatCentroDto | CreateDatCentroDto[]) {
      // Si es un solo objeto, lo convertimos en un array
      if (!Array.isArray(createDatCentroDto)) {
        createDatCentroDto = [createDatCentroDto];
      }
      return await this.datCentroService.createMany(createDatCentroDto);    
  }

  @Get('paginated')
  findAllPaginated(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('empresa_id') empresa_id: number
  ) {
      if (!empresa_id) {
          throw new BadRequestException('empresa_id is required');
      }
      return this.datCentroService.findAllPaginated(page, limit, empresa_id);
  }

  @Get('all')
  findAll(@Query('empresa_id') empresa_id: number) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
    }
      return this.datCentroService.findAll(empresa_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('empresa_id') empresa_id: number) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
  }
    return this.datCentroService.findOne(+id, empresa_id);
  }

  @Put(':id')
  update(
    @Param('id') id: string, 
    @Body() UpdateDatCentroDto: UpdateDatCentroDto,
    @Query('empresa_id') empresa_id: number,
  ) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
  }
      return this.datCentroService.update(+id, UpdateDatCentroDto, empresa_id);
  }

  @Delete(':code')
  remove(@Param('code') code: string, @Query('empresa_id') empresa_id: number) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
  }  
    return this.datCentroService.remove(code,empresa_id);
  }
}

