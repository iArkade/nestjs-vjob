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

@Injectable()
export class EmpresaService {
    constructor(
        @InjectRepository(Empresa)
        private empresaRepository: Repository<Empresa>,
        @InjectRepository(UsuarioEmpresa)
        private usuarioEmpresaRepository: Repository<UsuarioEmpresa>,
    ) { }

    async findAll(usuarioId: number): Promise<Empresa[]> {
        return this.empresaRepository
            .createQueryBuilder('empresa')
            .innerJoin('empresa.usuarios', 'usuarioEmpresa')
            .where('usuarioEmpresa.usuarioId = :usuarioId', { usuarioId })
            .getMany();
    }

    async create(
        createEmpresaDTO: CreateEmpresaDto,
        usuarioId: number,
        file?: Express.Multer.File
    ): Promise<Empresa> {
        // Create empresa
        const empresa = new Empresa();
        empresa.codigo = createEmpresaDTO.codigo;
        empresa.ruc = createEmpresaDTO.ruc;
        empresa.nombre = createEmpresaDTO.nombre;
        empresa.correo = createEmpresaDTO.correo;
        empresa.telefono = createEmpresaDTO.telefono;
        empresa.direccion = createEmpresaDTO.direccion;

        if (createEmpresaDTO.logo) {
            empresa.logo = createEmpresaDTO.logo;
        }
                

        const empresaGuardada = await this.empresaRepository.save(empresa);

        // Create usuario_empresa relationship using repository methods
        const usuarioEmpresa = this.usuarioEmpresaRepository.create({
            usuario: { id: usuarioId },
            empresa: empresaGuardada,
            rol: 'superadmin'
        });

        await this.usuarioEmpresaRepository.save(usuarioEmpresa);

        return empresaGuardada;
    }

    async update(id: number, updateEmpresaDTO: UpdateEmpresaDto): Promise<Empresa> {
        const empresa = await this.empresaRepository.findOne({
            where: { id }
        });

        if (!empresa) {
            throw new NotFoundException('La empresa no existe');
        }

        // Explicitly set each field
        if (updateEmpresaDTO.codigo) empresa.codigo = updateEmpresaDTO.codigo;
        if (updateEmpresaDTO.ruc) empresa.ruc = updateEmpresaDTO.ruc;
        if (updateEmpresaDTO.nombre) empresa.nombre = updateEmpresaDTO.nombre;
        if (updateEmpresaDTO.correo) empresa.correo = updateEmpresaDTO.correo;
        if (updateEmpresaDTO.telefono) empresa.telefono = updateEmpresaDTO.telefono;
        if (updateEmpresaDTO.direccion) empresa.direccion = updateEmpresaDTO.direccion;

        // Explicitly handle logo
        if (updateEmpresaDTO.logo && !updateEmpresaDTO.logo.startsWith('undefined')) {
            empresa.logo = updateEmpresaDTO.logo;
        }

        try {
            return await this.empresaRepository.save(empresa);
        } catch (error) {
            console.error('Update error:', error);
            throw new BadRequestException('Error al actualizar la empresa: ' + error.message);
        }
    }

    async delete(id: number): Promise<void> {
        const empresa = await this.empresaRepository.findOne({ where: { id } });

        if (!empresa) {
            throw new NotFoundException('La empresa no existe');
        }

        await this.empresaRepository.remove(empresa);
    }
}