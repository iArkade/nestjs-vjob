import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { Repository } from 'typeorm';
import { UsuarioEmpresa } from '../usuario_empresa/entities/usuario_empresa.entity';
import { CompanyRole } from '../users/enums/role.enum';

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
        try {
            const empresa = await this.findOne(id); // Asegúrate que findOne retorna Promise<Empresa>
            
            // Validación segura del logo
            const logoValido = updateEmpresaDTO.logo && !updateEmpresaDTO.logo.startsWith('undefined');
            
            // Actualización manual de campos (evitando create con DeepPartial)
            if (updateEmpresaDTO.nombre) empresa.nombre = updateEmpresaDTO.nombre;
            if (updateEmpresaDTO.ruc) empresa.ruc = updateEmpresaDTO.ruc;
            if (logoValido) empresa.logo = updateEmpresaDTO.logo;
            
            // Actualizar fecha manualmente si existe en tu entidad
            if ('updatedAt' in empresa) {
                empresa.updatedAt = new Date();
            }
    
            return await this.empresaRepository.save(empresa);
        } catch (error: unknown) {
            if (error instanceof NotFoundException) {
                throw error;
            }
    
            // Manejo específico de errores de PostgreSQL
            if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
                throw new ConflictException('El nombre o RUC de la empresa ya existe');
            }
    
            console.error(`Error actualizando empresa ID ${id}:`, error);
            throw new InternalServerErrorException('Error al actualizar la empresa');
        }
    }

    async delete(id: number): Promise<void> {
        const empresa = await this.findOne(id);

        if (!empresa) {
            throw new NotFoundException('Empresa no encontrada');
        }

        // Elimina los registros relacionados en usuario_empresa primero
        await this.empresaRepository.query(
            'DELETE FROM usuario_empresa WHERE empresaId = ?',
            [id]
        );

        await this.empresaRepository.remove(empresa);
    }
}