import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DatCentroService } from './dat_centro.service';
import { CreateDatCentroDto } from './dto/create-dat_centro.dto';
import { UpdateDatCentroDto } from './dto/update-dat_centro.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('dat_centro')
@Controller('dat-centro')
export class DatCentroController {
  constructor(private readonly datCentroService: DatCentroService) {}

  @Post()
  create(@Body() createDatCentroDto: CreateDatCentroDto) {
    return this.datCentroService.create(createDatCentroDto);
  }

  @Get()
  findAll() {
    return this.datCentroService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datCentroService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDatCentroDto: UpdateDatCentroDto) {
    return this.datCentroService.update(+id, updateDatCentroDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.datCentroService.remove(+id);
  }
}

