import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateAsientoDto } from "./dto/create-asiento.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Asiento } from "./entities/asiento.entity";
import { AsientoItem } from "./entities/asiento-item.entity";
import { Repository } from "typeorm";
import { UpdateAsientoDto } from "./dto/update-asiento.dto";
import { TransaccionContable } from "src/transaccion-contable/entities/transaccion-contable.entity";

@Injectable()
export class AsientoService {
  constructor(
    @InjectRepository(TransaccionContable)
    private transactionRepository: Repository<TransaccionContable>,

    @InjectRepository(Asiento)
    private asientoRepository: Repository<Asiento>,

    @InjectRepository(AsientoItem)
    private asientoItemRepository: Repository<AsientoItem>,
  ) { }

  async findAllWithLineItems(empresa_id: number): Promise<Asiento[]> {
    try {
      return await this.asientoRepository.find({
        where: { empresa_id },
        relations: ['lineItems'],
        order: { id: 'DESC' },
      });
    } catch (error) {
      throw new Error(`Error al obtener los asientos: ${error.message}`);
    }
  }

  async createAsientoWithItems(createAsientoDto: CreateAsientoDto) {
    try {
      const { codigo_transaccion, empresa_id } = createAsientoDto;

      // Buscar la transacción por empresa y código
      const transaccion = await this.transactionRepository.findOne({
        where: { empresa_id, codigo_transaccion },
      });

      if (!transaccion) {
        throw new Error(`No se encontró la transacción con código ${codigo_transaccion}`);
      }

      // Incrementar secuencial
      const ultimoSecuencial = parseInt(transaccion.secuencial || '0');
      const nuevoSecuencial = (ultimoSecuencial + 1).toString().padStart(9, '0');

      // Guardar nuevo secuencial en la tabla
      transaccion.secuencial = nuevoSecuencial;
      await this.transactionRepository.save(transaccion);

      const { lineItems, fecha_emision, ...asientoData } = createAsientoDto;
      const fechaEmisionFinal = fecha_emision || new Date();

      const asiento = this.asientoRepository.create({
        ...asientoData,
        fecha_emision: fechaEmisionFinal,
      });

      const savedAsiento = await this.asientoRepository.save(asiento);

      const asientoItems = lineItems.map((item) => {
        return this.asientoItemRepository.create({
          ...item,
          asiento: savedAsiento,
        });
      });

      await this.asientoItemRepository.save(asientoItems);
      return savedAsiento;
    } catch (error) {
      throw new Error(`Error al crear el asiento: ${error.message}`);
    }
  }

  async findOneWithItems(id: number, empresa_id: number): Promise<Asiento> {
    try {
      const asiento = await this.asientoRepository.findOne({
        where: { id, empresa_id },
        relations: ["lineItems"],
      });

      if (!asiento) {
        throw new NotFoundException(`Asiento con ID ${id} no encontrado`);
      }

      return asiento;
    } catch (error) {
      throw new Error(`Error al obtener el asiento: ${error.message}`);
    }
  }

  async updateAsiento(id: number, updateAsientoDto: UpdateAsientoDto, empresa_id: number) {
    try {
      const { lineItems, ...asientoData } = updateAsientoDto;

      const asiento = await this.asientoRepository.findOne({
        where: { id, empresa_id },
        relations: ['lineItems'],
      });

      if (!asiento) {
        throw new NotFoundException(`Asiento con ID ${id} no encontrado`);
      }

      const updatedAsiento = {
        ...asiento,
        ...asientoData,
        lineItems: lineItems,
      };

      await this.asientoRepository.save(updatedAsiento);

      return updatedAsiento;
    } catch (error) {
      throw new Error(`Error al actualizar el asiento: ${error.message}`);
    }
  }

  async deleteAsiento(id: number, empresa_id: number): Promise<void> {
    try {
      const asiento = await this.asientoRepository.findOne({
        where: { id, empresa_id },
        relations: ['lineItems'],
      });

      if (!asiento) {
        throw new NotFoundException(`Asiento con ID ${id} no encontrado`);
      }

      if (asiento.lineItems.length > 0) {
        await this.asientoItemRepository.remove(asiento.lineItems);
      }

      await this.asientoRepository.remove(asiento);
    } catch (error) {
      throw new Error(`Error al eliminar el asiento: ${error.message}`);
    }
  }
}