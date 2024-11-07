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


  async createAsientoWithItems(createAsientoDto: CreateAsientoDto) {
    const { lineItems, ...asientoData } = createAsientoDto;
    //console.log(createAsientoDto, "Hasta aqui si llega")
    const asiento = this.asientoRepository.create(asientoData);
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

  async createAsiento(createAsientoDto: CreateAsientoDto): Promise<Asiento> {
    const asiento = this.asientoRepository.create(createAsientoDto);
    return this.asientoRepository.save(asiento);
  }

  async findOneWithItems(id: number): Promise<Asiento> {
    return this.asientoRepository.findOne({ 
      where: { id },
      relations: ['items']  
    });
  }

  async addAsientoItem(asientoId: number, createAsientoItemDto: CreateAsientoItemDto): Promise<AsientoItem> {
    
    const asiento = await this.asientoRepository.findOne({
      where: { id: asientoId },
    });

    if (!asiento) {
      throw new Error('Asiento not found');
    }
    
    const item = this.asientoItemRepository.create({ ...createAsientoItemDto, asiento });
    return this.asientoItemRepository.save(item);
  }

  async removeAsientoItem(itemId: number): Promise<void> {
    await this.asientoItemRepository.delete(itemId);
  }

  findAll() {
    return `This action returns all asiento`;
  }

  findOne(id: number) {
    return `This action returns a #${id} asiento`;
  }

  update(id: number, updateAsientoDto: UpdateAsientoDto) {
    return `This action updates a #${id} asiento`;
  }

  remove(id: number) {
    return `This action removes a #${id} asiento`;
  }
}
