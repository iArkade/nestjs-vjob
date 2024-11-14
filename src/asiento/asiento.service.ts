import { Injectable } from '@nestjs/common';
import { CreateAsientoDto } from './dto/create-asiento.dto';
import { UpdateAsientoDto } from './dto/update-asiento.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Asiento } from './entities/asiento.entity';
import { AsientoItem } from './entities/asiento-item.entity';
import { Repository } from 'typeorm';
import { CreateAsientoItemDto } from './dto/create-asiento-item.dto';

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
      relations: ['lineItems'],
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
      relations: ['lineItems']  
    });
  }

  // async createAsiento(createAsientoDto: CreateAsientoDto): Promise<Asiento> {
  //   const asiento = this.asientoRepository.create(createAsientoDto);
  //   return this.asientoRepository.save(asiento);
  // }

  // async addAsientoItem(asientoId: number, createAsientoItemDto: CreateAsientoItemDto): Promise<AsientoItem> {
    
  //   const asiento = await this.asientoRepository.findOne({
  //     where: { id: asientoId },
  //   });

  //   if (!asiento) {
  //     throw new Error('Asiento not found');
  //   }
    
  //   const item = this.asientoItemRepository.create({ ...createAsientoItemDto, asiento });
  //   return this.asientoItemRepository.save(item);
  // }

  // async removeAsientoItem(itemId: number): Promise<void> {
  //   await this.asientoItemRepository.delete(itemId);
  // }
}
