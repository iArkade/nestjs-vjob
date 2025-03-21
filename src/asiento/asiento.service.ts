import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateAsientoDto } from "./dto/create-asiento.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Asiento } from "./entities/asiento.entity";
import { AsientoItem } from "./entities/asiento-item.entity";
import { Repository } from "typeorm";
import { UpdateAsientoDto } from "./dto/update-asiento.dto";

@Injectable()
export class AsientoService {
  constructor(
    @InjectRepository(Asiento)
    private asientoRepository: Repository<Asiento>,

    @InjectRepository(AsientoItem)
    private asientoItemRepository: Repository<AsientoItem>,
  ) {}

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
  
      // Verificar si ya existe un asiento con el mismo código de transacción y empresa
      const existingAsiento = await this.asientoRepository.findOne({
        where: { codigo_transaccion, empresa_id },
      });
  
      if (existingAsiento) {
        throw new Error(
          `Ya existe un asiento con el código de transacción ${codigo_transaccion} para esta empresa.`
        );
      }
  
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