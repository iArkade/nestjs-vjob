import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  Query,
  HttpCode,
} from '@nestjs/common';
import { AsientoService } from './asiento.service';
import { CreateAsientoDto } from './dto/create-asiento.dto';
import { UpdateAsientoDto } from './dto/update-asiento.dto';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Asiento } from './entities/asiento.entity';

@ApiTags('asientos')
@Controller('asientos')
export class AsientoController {
  constructor(private readonly asientoService: AsientoService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Lista de asientos', type: [Asiento] })
  @ApiResponse({ status: 500, description: 'Error interno del servidor' })
  async findAllWithLineItems(@Query('empresa_id') empresa_id: number): Promise<Asiento[]> {
    return this.asientoService.findAllWithLineItems(empresa_id);
  }

  @Post()
  @HttpCode(201)
  @ApiResponse({ status: 201, description: 'Asiento creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Conflicto al crear el asiento' })
  async createAsiento(@Body() createAsientoDto: CreateAsientoDto) {
    const newAsiento = await this.asientoService.createAsientoWithItems(createAsientoDto);
    return {
      message: 'Asiento creado exitosamente',
      data: newAsiento,
    };
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Asiento encontrado', type: Asiento })
  @ApiResponse({ status: 404, description: 'Asiento no encontrado' })
  async getAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresa_id', ParseIntPipe) empresaId: number,
  ): Promise<Asiento> {
    return this.asientoService.findOneWithItems(id, empresaId);
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'Asiento actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Asiento no encontrado' })
  async updateAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAsientoDto: UpdateAsientoDto,
    @Query('empresa_id') empresa_id: number,
  ) {
    const updatedAsiento = await this.asientoService.updateAsiento(id, updateAsientoDto, empresa_id);
    return {
      message: 'Asiento actualizado exitosamente',
      data: updatedAsiento,
    };
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Asiento eliminado exitosamente' })
  @ApiResponse({ status: 404, description: 'Asiento no encontrado' })
  async deleteAsiento(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresa_id') empresa_id: number,
  ) {
    await this.asientoService.deleteAsiento(id, empresa_id);
    return { message: 'Asiento eliminado exitosamente' };
  }
}