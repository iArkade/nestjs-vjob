import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
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
  async createAsiento(@Body() createAsientoDto: CreateAsientoDto) {
    try {
        // Llama al servicio para crear el Asiento y sus AsientoItem asociados
        const newAsiento = await this.asientoService.createAsientoWithItems(createAsientoDto);
        return {
            message: 'Asiento creado exitosamente',
            data: newAsiento,
        };
    } catch (error) {
        // Manejo de errores en caso de fallo al crear el Asiento
        throw new HttpException(
            {
                message: 'Error al crear el asiento',
                error: error.message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
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
