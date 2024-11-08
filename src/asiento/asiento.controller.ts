import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { AsientoService } from './asiento.service';
import { CreateAsientoDto } from './dto/create-asiento.dto';
import { UpdateAsientoDto } from './dto/update-asiento.dto';
import { CreateAsientoItemDto } from './dto/create-asiento-item.dto';
import { ApiTags } from '@nestjs/swagger';
import { Asiento } from './entities/asiento.entity';

@ApiTags('asientos')
@Controller('asientos')
export class AsientoController {
  constructor(private readonly asientoService: AsientoService) {}

  @Get()
  async findAllWithLineItems(): Promise<Asiento[]> {
    return await this.asientoService.findAllWithLineItems();
  }

  @Post()
  async createAsiento(@Body() createAsientoDto: CreateAsientoDto) {
    try {
        const newAsiento = await this.asientoService.createAsientoWithItems(createAsientoDto);
        return {
            message: 'Asiento creado exitosamente',
            data: newAsiento,
        };
    } catch (error) {
        throw new HttpException(
            {
                message: 'Error al crear el asiento',
                error: error.message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
  }

  // @Get(':id')
  // async getAsiento(@Param('id') id: string) {
  //   return this.asientoService.findOneWithItems(+id);
  // }

  // @Post(':id/items')
  // addItemToAsiento(@Param('id') id: number, @Body() createAsientoItemDto: CreateAsientoItemDto) {
  //   return this.asientoService.addAsientoItem(id, createAsientoItemDto);
  // }

  // @Delete('items/:itemId')
  // removeAsientoItem(@Param('itemId') itemId: number) {
  //   return this.asientoService.removeAsientoItem(itemId);
  // }
}
