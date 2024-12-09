import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Like, Raw, Repository } from 'typeorm';

@Injectable()
export class EmpresaService {
    constructor(
        @InjectRepository(Empresa)
        private empresaRepository: Repository<Empresa>,
    ) { }

    async findAll(): Promise<Empresa[]> {
        return await this.empresaRepository.find();
    }

    async create(createEmpresaDTO: CreateEmpresaDto): Promise<Empresa> {
        const existingEmpresa = await this.empresaRepository.findOne({
            where: [
                { codigo: createEmpresaDTO.codigo },
                { ruc: createEmpresaDTO.ruc },
            ],
        });

        if (existingEmpresa) {
            throw new BadRequestException(
                'Ya existe una empresa con este código o RUC',
            );
        }

        const empresa = this.empresaRepository.create(createEmpresaDTO);
        return await this.empresaRepository.save(empresa);
    }

    async update(id: number, updateEmpresaDTO: UpdateEmpresaDto): Promise<Empresa> {
        const empresa = await this.empresaRepository.preload({
            id,
            ...updateEmpresaDTO,
        });

        if (!empresa) {
            throw new NotFoundException('La empresa no existe');
        }

        return await this.empresaRepository.save(empresa);
    }

    async delete(id: number): Promise<void> {
        const empresa = await this.empresaRepository.findOne({ where: { id } });

        if (!empresa) {
            throw new NotFoundException('La empresa no existe');
        }

        await this.empresaRepository.remove(empresa);
    }

}
