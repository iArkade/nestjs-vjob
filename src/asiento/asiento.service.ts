import { Injectable, NotFoundException, ConflictException, InternalServerErrorException, BadRequestException } from "@nestjs/common";
import { CreateAsientoDto } from "./dto/create-asiento.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Asiento } from "./entities/asiento.entity";
import { AsientoItem } from "./entities/asiento-item.entity";
import { Repository } from "typeorm";
import { UpdateAsientoDto } from "./dto/update-asiento.dto";
import { TransaccionContable } from "../transaccion-contable/entities/transaccion-contable.entity";

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
    return this.asientoRepository.find({
      where: { empresa_id },
      relations: ['lineItems'],
      order: { id: 'DESC' },
    });
  }

  async createAsientoWithItems(createAsientoDto: CreateAsientoDto): Promise<Asiento> {
    const { codigo_transaccion, empresa_id } = createAsientoDto;

    // Validación de transacción
    const transaccion = await this.transactionRepository.findOne({
      where: { empresa_id, codigo_transaccion },
    });

    if (!transaccion) {
      throw new NotFoundException(`No se encontró la transacción con código ${codigo_transaccion}`);
    }

    // Manejo del secuencial
    const ultimoSecuencial = parseInt(transaccion.secuencial || '0');
    const nuevoSecuencial = (ultimoSecuencial + 1).toString().padStart(9, '0');

    try {
      // Actualizar secuencial
      transaccion.secuencial = nuevoSecuencial;
      await this.transactionRepository.save(transaccion);

      const { lineItems, fecha_emision, ...asientoData } = createAsientoDto;
      const fechaEmisionFinal = fecha_emision || new Date();

      // Crear asiento
      const asiento = this.asientoRepository.create({
        ...asientoData,
        fecha_emision: fechaEmisionFinal,
      });

      const savedAsiento = await this.asientoRepository.save(asiento);

      // Crear items
      const asientoItems = lineItems.map(item => 
        this.asientoItemRepository.create({
          ...item,
          asiento: savedAsiento,
        })
      );

      await this.asientoItemRepository.save(asientoItems);
      return savedAsiento;
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el asiento');
    }
  }

  async findOneWithItems(id: number, empresa_id: number): Promise<Asiento> {
    const asiento = await this.asientoRepository.findOne({
      where: { id, empresa_id },
      relations: ["lineItems"],
    });

    if (!asiento) {
      throw new NotFoundException(`Asiento con ID ${id} no encontrado`);
    }

    return asiento;
  }

  async updateAsiento(
    id: number, 
    updateAsientoDto: UpdateAsientoDto, 
    empresa_id: number
  ): Promise<Asiento> {
    const { lineItems, ...asientoData } = updateAsientoDto;

    const asiento = await this.asientoRepository.preload({
      id,
      empresa_id,
      ...asientoData,
    });

    if (!asiento) {
      throw new NotFoundException(`Asiento con ID ${id} no encontrado`);
    }

    try {
      // Actualizar items si existen
      if (lineItems && lineItems.length > 0) {
        await this.asientoItemRepository.delete({ asiento: { id } });
        const newItems = lineItems.map(item => 
          this.asientoItemRepository.create({ ...item, asiento })
        );
        await this.asientoItemRepository.save(newItems);
      }

      return await this.asientoRepository.save(asiento);
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el asiento');
    }
  }

  async deleteAsiento(id: number, empresa_id: number): Promise<void> {
    const asiento = await this.asientoRepository.findOne({
      where: { id, empresa_id },
      relations: ['lineItems'],
    });

    if (!asiento) {
      throw new NotFoundException(`Asiento con ID ${id} no encontrado`);
    }

    try {
      // Eliminar items primero
      if (asiento.lineItems.length > 0) {
        await this.asientoItemRepository.remove(asiento.lineItems);
      }
      
      await this.asientoRepository.remove(asiento);
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el asiento');
    }
  }
}