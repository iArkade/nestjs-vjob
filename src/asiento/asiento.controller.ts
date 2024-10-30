import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AsientoService } from './asiento.service';
import { CreateAsientoDto } from './dto/create-asiento.dto';
import { UpdateAsientoDto } from './dto/update-asiento.dto';
import { CreateAsientoItemDto } from './dto/create-asiento-item.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('asientos')
@Controller('asientos')
export class AsientoController {
  constructor(private readonly asientoService: AsientoService) {}

  @Post()
  createAsiento(@Body() createAsientoDto: CreateAsientoDto) {
    return this.asientoService.createAsientoWithItems(createAsientoDto);
  }

  @Get(':id')
  getAsiento(@Param('id') id: string) {
    return this.asientoService.findOneWithItems(+id);
  }

  @Post(':id/items')
  addItemToAsiento(@Param('id') id: number, @Body() createAsientoItemDto: CreateAsientoItemDto) {
    return this.asientoService.addAsientoItem(id, createAsientoItemDto);
  }

  @Delete('items/:itemId')
  removeAsientoItem(@Param('itemId') itemId: number) {
    return this.asientoService.removeAsientoItem(itemId);
  }

  @Get()
  findAll() {
    return this.asientoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.asientoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAsientoDto: UpdateAsientoDto) {
    return this.asientoService.update(+id, updateAsientoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.asientoService.remove(+id);
  }
}
