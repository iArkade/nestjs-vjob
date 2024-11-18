import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put } from '@nestjs/common';
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
      @Query('limit') limit: number = 10
  ) {
      return this.datCentroService.findAllPaginated(page, limit);
  }

  @Get('all')
  findAll() {
      return this.datCentroService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datCentroService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAccountingPlanDto: UpdateDatCentroDto) {
      return this.datCentroService.update(+id, updateAccountingPlanDto);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
      return this.datCentroService.remove(code);
  }
}

