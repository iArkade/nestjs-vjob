import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Repository } from 'typeorm';
import { UsuarioEmpresa } from '../usuario_empresa/entities/usuario_empresa.entity';
import { Usuario } from '../users/entities/user.entity';
import { CompanyRole } from 'src/users/enums/role.enum';

@Injectable()
export class EmpresaService {
    constructor(
        @InjectRepository(Empresa)
        private empresaRepository: Repository<Empresa>,
        @InjectRepository(UsuarioEmpresa)
        private usuarioEmpresaRepository: Repository<UsuarioEmpresa>,
    ) { }

    async findOne(id: number): Promise<Empresa> {
        const empresa = await this.empresaRepository.findOne({
            where: { id },
            relations: ['createdBy']
        });

        if (!empresa) {
            throw new NotFoundException('La empresa no existe');
        }

        return empresa;
    }

    async findAllByCreator(creatorId: number): Promise<Empresa[]> {
        return this.empresaRepository.find({
            where: { createdBy: { id: creatorId } },
            relations: ['usuarios', 'usuarios.usuario']
        });
    }

    async findAllByUser(userId: number): Promise<Empresa[]> {
        return this.empresaRepository
            .createQueryBuilder('empresa')
            .innerJoin('empresa.usuarios', 'usuarioEmpresa')
            .where('usuarioEmpresa.usuarioId = :userId', { userId })
            .getMany();
    }

    async create(
        createEmpresaDTO: CreateEmpresaDto,
        creatorId: number,
    ): Promise<Empresa> {
        // Crear la empresa
        const empresa = this.empresaRepository.create({
            ...createEmpresaDTO,
            createdBy: { id: creatorId }
        });

        const empresaGuardada = await this.empresaRepository.save(empresa);

        // Crear la relación usuario_empresa para el superadmin
        const usuarioEmpresa = this.usuarioEmpresaRepository.create({
            usuario: { id: creatorId },
            empresa: empresaGuardada,
            companyRole: CompanyRole.ADMIN, // Superadmin es ADMIN en su propia empresa
            assignedBy: { id: creatorId }
        });

        await this.usuarioEmpresaRepository.save(usuarioEmpresa);

        return empresaGuardada;
    }

    async update(id: number, updateEmpresaDTO: UpdateEmpresaDto): Promise<Empresa> {
        const empresa = await this.findOne(id);
        // Actualizar campos
        Object.assign(empresa, {
            ...updateEmpresaDTO,
            logo: updateEmpresaDTO.logo && !updateEmpresaDTO.logo.startsWith('undefined')
                ? updateEmpresaDTO.logo
                : empresa.logo
        });

        try {
            return await this.empresaRepository.save(empresa);
        } catch (error) {
            throw new BadRequestException('Error al actualizar la empresa: ' + error.message);
        }
    }

    async delete(id: number): Promise<void> {
        const empresa = await this.findOne(id);
        await this.empresaRepository.remove(empresa);
    }
}