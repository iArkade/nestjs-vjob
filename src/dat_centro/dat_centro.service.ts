import { Injectable } from '@nestjs/common';
import { CreateDatCentroDto } from './dto/create-dat_centro.dto';
import { UpdateDatCentroDto } from './dto/update-dat_centro.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DatCentro } from './entities/dat_centro.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DatCentroService {
  constructor(
    @InjectRepository(DatCentro)
    private datCentroRepository: Repository<DatCentro>,
  ) {}
  
  async create(createDatCentroDto: CreateDatCentroDto) {
    //return 'This action adds a new datCentro';
    return await this.datCentroRepository.save(createDatCentroDto)
  }

  findAll() {
    return this.datCentroRepository.find();
  }

  findOne(id: number) {
    return this.datCentroRepository.findOne({ where: { id } });
  }

  update(id: number, updateDatCentroDto: UpdateDatCentroDto) {
    return `This action updates a #${id} datCentro`;
  }

  remove(id: number) {
    return `This action removes a #${id} datCentro`;
  }
}

