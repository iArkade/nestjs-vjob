import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { AsientoService } from './asiento.service';
import { CreateAsientoDto } from './dto/create-asiento.dto';
import { UpdateAsientoDto } from './dto/update-asiento.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Asiento } from './entities/asiento.entity';

@ApiTags('asientos')
@Controller('asientos')
export class AsientoController {
  constructor(private readonly asientoService: AsientoService) {}

  @Get()
  async findAllWithLineItems(@Query('empresa_id') empresa_id: number): Promise<Asiento[]> {
    return await this.asientoService.findAllWithLineItems(empresa_id);
  }
  

  @Post()
  async createAsiento( 
    @Body() createAsientoDto: CreateAsientoDto,
  ) {
    try {
      const newAsiento = await this.asientoService.createAsientoWithItems(createAsientoDto);
      return {
        message: 'Asiento creado exitosamente',
        data: newAsiento,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error al crear el asiento', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  @Get(':id')
  async getAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresa_id', ParseIntPipe) empresaId: number,
  ): Promise<Asiento> {
    return this.asientoService.findOneWithItems(id, empresaId);
  }

  @Put(':id')
  async updateAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsientoDto: UpdateAsientoDto,
    @Query('empresa_id') empresa_id: number,
  ) {
    try {
      const updatedAsiento = await this.asientoService.updateAsiento(id, updateAsientoDto, empresa_id);
      return {
        message: 'Asiento actualizado exitosamente',
        data: updatedAsiento,
      };
    } catch (error) {
      throw new HttpException(
        { message: 'Error al actualizar el asiento', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  

  @Delete(':id')
  async deleteAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresa_id') empresa_id: number,
  ) {
    try {
      await this.asientoService.deleteAsiento(id, empresa_id);
      return { message: 'Asiento eliminado exitosamente' };
    } catch (error) {
      throw new HttpException(
        { message: 'Error al eliminar el asiento', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
}
