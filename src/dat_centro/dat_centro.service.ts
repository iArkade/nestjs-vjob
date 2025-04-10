import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDatCentroDto } from './dto/create-dat_centro.dto';
import { UpdateDatCentroDto } from './dto/update-dat_centro.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DatCentro } from './entities/dat_centro.entity';
import { Not, Repository } from 'typeorm';
import { Asiento } from '../asiento/entities/asiento.entity';

@Injectable()
export class DatCentroService {
  constructor(
    @InjectRepository(DatCentro)
    private datCentroRepository: Repository<DatCentro>,
    @InjectRepository(Asiento)
    private asientoRepository: Repository<Asiento>,
  ) { }

  private normalizeCode(code: string): string {
    return code.endsWith('.') ? code.slice(0, -1) : code;
  }

  async create(createDatCentroDto: CreateDatCentroDto & { empresa_id: number }) {
    const { codigo, empresa_id } = createDatCentroDto;
    const normalizedCode = this.normalizeCode(codigo); // Normalizamos el código

    // Verificar si el código ya existe (evitar duplicados como `1.1` y `1.1.`)
    const existingAccount = await this.datCentroRepository.findOne({ where: { codigo: normalizedCode, empresa_id } });
    if (existingAccount) {
      throw new BadRequestException('El código ya existe.');
    }

    // Guardar la cuenta
    return await this.datCentroRepository.save(createDatCentroDto);
  }

  async createMany(createDatCentroDtos: (CreateDatCentroDto & { empresa_id: number })[]) {
    if (!Array.isArray(createDatCentroDtos)) {
      throw new TypeError('createTransaccionContableDtos debe ser un array');
    }

    // Filtrar filas vacías o incompletas
    const validDtos = createDatCentroDtos.filter(dto => dto.codigo && dto.nombre && dto.empresa_id);
    for (const createTransaccionContableDto of validDtos) {

      await this.create(createTransaccionContableDto);
    }
  }

  async findAll(empresaId: number): Promise<DatCentro[]> {
    // Traer todos los registros de la base de datos
    const result = await this.datCentroRepository.find({
      where: { empresa_id: empresaId },
      order: { codigo: 'ASC' }, // Ordenar por el campo 'code'
    });

    return result;
  }


  async findAllPaginated(page: number, limit: number, empresaId: number): Promise<{ data: DatCentro[], total: number }> {
    const [result, total] = await this.datCentroRepository.findAndCount({
      where: { empresa_id: empresaId },
      order: { codigo: 'ASC' },
    });

    const paginatedResult = result.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedResult,
      total,
    };
  }

  async findOne(id: number, empresaId: number) {
  
    const dataCentro = await this.datCentroRepository.findOne({ where: { id, empresa_id: empresaId } });
    if (!dataCentro) throw new NotFoundException('Data Center not found');
    return dataCentro;
  }

  async update(id: number, updateDatCentroDto: UpdateDatCentroDto, empresaId: number) {
    const costCenter = await this.datCentroRepository.findOne({ where: { id, empresa_id: empresaId } });
    if (!costCenter) throw new NotFoundException('CostCenter not found');

    // Verificar si el código está relacionado en la tabla asiento
    const relatedAsiento = await this.asientoRepository.findOne({ where: { codigo_centro: costCenter.codigo, empresa_id: empresaId } });
    if (relatedAsiento) {
      throw new BadRequestException('No se puede actualizar el centro porque está relacionado con un asiento.');
    }

    // Verificar si se está intentando duplicar el código
    if (updateDatCentroDto.codigo) {
      const newCode = updateDatCentroDto.codigo.trim();
      const codeAlreadyExists = await this.datCentroRepository.findOne({
        where: { codigo: newCode, empresa_id: empresaId, id: Not(id) }
      });
      if (codeAlreadyExists) {
        throw new BadRequestException('El código ya existe.');
      }
      costCenter.codigo = newCode;
    }

    // Actualizar los demás campos
    costCenter.nombre = updateDatCentroDto.nombre || costCenter.nombre;

    // Actualizar el campo "activo"
    if (updateDatCentroDto.activo !== undefined) {
      costCenter.activo = updateDatCentroDto.activo;
    }

    return await this.datCentroRepository.save(costCenter);
  }

  async remove(codigo: string, empresaId: number) {

    // Verificar si el centro existe en la tabla datCentro
    const costCenter = await this.datCentroRepository.findOne({ where: { codigo, empresa_id: empresaId } });
    if (!costCenter) {
      throw new BadRequestException('El centro no existe.');
    }

    // Verificar si el código está relacionado en la tabla asiento
    const relatedAsiento = await this.asientoRepository.findOne({ where: { codigo_centro: codigo, empresa_id: empresaId } });
    if (relatedAsiento) {
      throw new BadRequestException('No se puede eliminar el centro porque está relacionado con un asiento.');
    }

    try {
      // Eliminar el centro
      await this.datCentroRepository.remove(costCenter);
      return { message: 'Transacción eliminada exitosamente', codigo_transaccion: costCenter.codigo };
    } catch (error) {
      throw new BadRequestException('Error al eliminar la transacción. Por favor, inténtelo de nuevo.');
    }

  }
}

