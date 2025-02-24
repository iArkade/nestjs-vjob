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

  async findAllWithLineItems(empresa_id: number): Promise<Asiento[]> {
    return await this.asientoRepository.find({
      where: { empresa_id },
      relations: ['lineItems'],
      order: { id: 'DESC' },
    });
  }

  async createAsientoWithItems(createAsientoDto: CreateAsientoDto) {
    const { lineItems, fecha_emision, ...asientoData } = createAsientoDto;
    const fechaEmisionFinal = fecha_emision || new Date();
  
    const asiento = this.asientoRepository.create({
      ...asientoData,
      fecha_emision: fechaEmisionFinal
    });
  
    const savedAsiento = await this.asientoRepository.save(asiento);
  
    const asientoItems = lineItems.map((item) => {
      return this.asientoItemRepository.create({
        ...item,
        asiento: savedAsiento
      });
    });
  
    await this.asientoItemRepository.save(asientoItems);
    return savedAsiento;
  }
  

  async findOneWithItems(id: number, empresa_id: number): Promise<Asiento> {
    return this.asientoRepository.findOne({
      where: { id, empresa_id: empresa_id },
      relations: ["lineItems"],
    });}


  async updateAsiento(id: number, updateAsientoDto: UpdateAsientoDto, empresa_id: number) {
    console.log(updateAsientoDto)
    const { lineItems, ...asientoData } = updateAsientoDto;
  
    const asiento = await this.asientoRepository.findOne({
      where: { id, empresa_id },
      relations: ['lineItems'],
    });
  
    if (!asiento) {
      throw new NotFoundException('Asiento no encontrado');
    }

    const updatedAsiento = { 
      ...asiento, 
      ...asientoData,
      lineItems: lineItems 
    };    
    await this.asientoRepository.save(updatedAsiento);

    return updatedAsiento;
  
  }
  

  async deleteAsiento(id: number, empresa_id: number): Promise<void> {
    const asiento = await this.asientoRepository.findOne({
      where: { id, empresa_id },
      relations: ['lineItems'],
    });
  
    if (!asiento) {
      throw new NotFoundException('Asiento no encontrado');
    }
  
    if (asiento.lineItems.length > 0) {
      await this.asientoItemRepository.remove(asiento.lineItems);
    }
  
    await this.asientoRepository.remove(asiento);
  }
  
}
