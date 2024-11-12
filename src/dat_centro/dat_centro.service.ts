import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDatCentroDto } from './dto/create-dat_centro.dto';
import { UpdateDatCentroDto } from './dto/update-dat_centro.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DatCentro } from './entities/dat_centro.entity';
import { Not, Repository } from 'typeorm';

@Injectable()
export class DatCentroService {
  constructor(
    @InjectRepository(DatCentro)
    private datCentroRepository: Repository<DatCentro>,
  ) { }

  private normalizeCode(code: string): string {
    return code.endsWith('.') ? code.slice(0, -1) : code;
  }

  async create(createDatCentroDto: CreateDatCentroDto) {
    const { codigo } = createDatCentroDto;
    const normalizedCode = this.normalizeCode(codigo); // Normalizamos el código

    // Verificar si el código ya existe (evitar duplicados como `1.1` y `1.1.`)
    const existingAccount = await this.datCentroRepository.findOne({ where: { codigo: normalizedCode } });
    if (existingAccount) {
      throw new BadRequestException('El código ya existe.');
    }

    // Guardar la cuenta
    return await this.datCentroRepository.save(createDatCentroDto);
  }

  async createMany(createDatCentroDtos: CreateDatCentroDto[]) {
    if (!Array.isArray(createDatCentroDtos)) {
      throw new TypeError('createTransaccionContableDtos debe ser un array');
    }

    // Filtrar filas vacías o incompletas
    const validDtos = createDatCentroDtos.filter(dto => dto.codigo && dto.nombre);
    for (const createTransaccionContableDto of validDtos) {

      await this.create(createTransaccionContableDto);
    }
  }

  async findAll(): Promise<DatCentro[]> {
    // Traer todos los registros de la base de datos
    const result = await this.datCentroRepository.find({
      order: { codigo: 'ASC' }, // Ordenar por el campo 'code'
    });

    return result;
  }


  async findAllPaginated(page: number, limit: number): Promise<{ data: DatCentro[], total: number }> {
    const [result, total] = await this.datCentroRepository.findAndCount({
      order: { codigo: 'ASC' },
    });

    const paginatedResult = result.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedResult,
      total,
    };
  }

  findOne(id: number) {
    return this.datCentroRepository.findOne({ where: { id } });
  }

  async update(id: number, updateDatCentroDto: UpdateDatCentroDto) {
    const costCenter = await this.datCentroRepository.findOne({ where: { id } });
    if (!costCenter) throw new NotFoundException('CostCenter not found');

    // Verificar si se está intentando duplicar el código
    if (updateDatCentroDto.codigo) {
      const newCode = updateDatCentroDto.codigo.trim();
      const codeAlreadyExists = await this.datCentroRepository.findOne({
        where: { codigo: newCode, id: Not(id) }
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

  async remove(codigo: string) {

    let costCenter = await this.datCentroRepository.findOne({ where: { codigo } });
    try {
      await this.datCentroRepository.remove(costCenter);
      return { message: 'Transaccion eliminada exitosamente', codigo_transaccion: costCenter.codigo };
    } catch (error) {
      throw new BadRequestException('Error al eliminar la transaccion. Por favor, inténtelo de nuevo.');
    }

  }
}

