import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateAsientoDto } from "./dto/create-asiento.dto";
// import { UpdateAsientoDto } from './dto/update-asiento.dto';
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

  async findAllWithLineItems(): Promise<Asiento[]> {
    return await this.asientoRepository.find({
      relations: ["lineItems"],
      order: {
        id: "DESC",
      },
    });
  }

  async createAsientoWithItems(createAsientoDto: CreateAsientoDto) {
    const { lineItems, fecha_emision, ...asientoData } = createAsientoDto;

    // Si `fecha_emision` es nulo o indefinido, asigna la fecha actual
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
  }

  async findOneWithItems(id: number): Promise<Asiento> {
    return this.asientoRepository.findOne({
      where: { id },
      relations: ["lineItems"],
    });
  }

  async updateAsiento(id: number, updateAsientoDto: UpdateAsientoDto) {
    const { lineItems, ...asientoData } = updateAsientoDto;

    // Buscar el asiento existente con sus lineItems
    const asiento = await this.asientoRepository.findOne({
      where: { id },
      relations: ["lineItems"],
    });

    if (!asiento) {
      throw new NotFoundException("Asiento no encontrado");
    }

    // Actualizar datos del asiento
    await this.asientoRepository.save({
      ...asiento,
      ...asientoData,
    });

    // Separar los lineItems en tres grupos: actualizar, crear y eliminar
    const itemsToUpdate = lineItems.filter((item) => item.id); // Los que tienen ID
    const itemsToCreate = lineItems.filter((item) => !item.id); // Los que no tienen ID
    const newItemIds = itemsToUpdate.map((item) => item.id); // IDs de los enviados
    const itemsToDelete = asiento.lineItems.filter(
      (item) => !newItemIds.includes(item.id), // Los que ya no están en la nueva lista
    );

    // Guardar los cambios
    if (itemsToUpdate.length > 0) {
      await this.asientoItemRepository.save(itemsToUpdate);
    }

    if (itemsToCreate.length > 0) {
      const newItems = itemsToCreate.map((item) =>
        this.asientoItemRepository.create({ ...item, asiento }),
      );
      await this.asientoItemRepository.save(newItems);
    }

    if (itemsToDelete.length > 0) {
      await this.asientoItemRepository.remove(itemsToDelete);
    }

    // Retornar el asiento actualizado
    return this.asientoRepository.findOne({
      where: { id },
      relations: ["lineItems"],
    });
  }

  async deleteAsiento(id: number): Promise<void> {
    const asiento = await this.asientoRepository.findOne({
      where: { id },
      relations: ["lineItems"],
    });

    if (!asiento) {
      throw new NotFoundException("Asiento no encontrado");
    }

    if (asiento.lineItems.length > 0) {
      await this.asientoItemRepository.remove(asiento.lineItems);
    }

    // Eliminar el asiento
    await this.asientoRepository.remove(asiento);
  }
}
