import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/user.entity';
import { UsuarioEmpresa } from 'src/usuario_empresa/entities/usuario_empresa.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { AssignCompanyDto, CreateUserDto } from './dtos/create.user.dto';
import { UpdateUserDto } from './dtos/update.user.dto';
import { SystemRole } from './enums/role.enum';

@Injectable()
export class UsersService {
     constructor(
          @InjectRepository(Usuario)
          private usuarioRepository: Repository<Usuario>,
          @InjectRepository(UsuarioEmpresa)
          private usuarioEmpresaRepository: Repository<UsuarioEmpresa>,
          @InjectRepository(Empresa)
          private empresaRepository: Repository<Empresa>,
     ) { }

     private async handleCompanyAssignments(
          transactionalEntityManager: any,
          usuario: Usuario,
          empresas: AssignCompanyDto[],
          superadmin: Usuario
     ) {
          // Eliminar asignaciones existentes
          await transactionalEntityManager
               .createQueryBuilder()
               .delete()
               .from(UsuarioEmpresa)
               .where("usuarioId = :userId", { userId: usuario.id })
               .execute();

          if (empresas?.length > 0) {
               // Obtener todas las empresas en una sola consulta
               const empresaIds = empresas.map(e => e.empresaId);
               const empresasFound = await transactionalEntityManager.find(Empresa, {
                    where: {
                         id: In(empresaIds),
                         createdBy: { id: superadmin.id }
                    }
               });

               // Validar que todas las empresas existan
               if (empresasFound.length !== empresaIds.length) {
                    throw new NotFoundException('Una o más empresas no fueron encontradas');
               }

               // Crear las asignaciones en batch
               const usuarioEmpresas = empresas.map(empresaDto => {
                    const empresa = empresasFound.find(e => e.id === empresaDto.empresaId);
                    return transactionalEntityManager.create(UsuarioEmpresa, {
                         usuario,
                         empresa,
                         companyRole: empresaDto.companyRole,
                         assignedBy: superadmin
                    });
               });

               await transactionalEntityManager.save(UsuarioEmpresa, usuarioEmpresas);
          }
     }

     async create(createUserDto: CreateUserDto, superadmin: Usuario) {
          if (superadmin.systemRole !== SystemRole.SUPERADMIN) {
               throw new ForbiddenException('Solo los superadmins pueden crear usuarios');
          }

          if (createUserDto.systemRole === SystemRole.SUPERADMIN) {
               throw new ForbiddenException('No se pueden crear usuarios SUPERADMIN');
          }

          return await this.usuarioRepository.manager.transaction(async transactionalEntityManager => {
               // Crear usuario
               const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
               const usuario = transactionalEntityManager.create(Usuario, {
                    ...createUserDto,
                    password: hashedPassword,
                    createdBy: superadmin,
               });

               const savedUser = await transactionalEntityManager.save(Usuario, usuario);

               // Manejar asignaciones de empresa
               await this.handleCompanyAssignments(
                    transactionalEntityManager,
                    savedUser,
                    createUserDto.empresas,
                    superadmin
               );

               return savedUser;
          });
     }

     async update(id: number, updateUserDto: UpdateUserDto, superadmin: Usuario) {
          return await this.usuarioRepository.manager.transaction(async transactionalEntityManager => {
               const usuario = await transactionalEntityManager.findOne(Usuario, {
                    where: { id, createdBy: { id: superadmin.id } },
                    relations: ['empresas', 'empresas.empresa'],
               });

               if (!usuario) {
                    throw new NotFoundException('Usuario no encontrado');
               }

               // Procesar contraseña si es necesario
               if (updateUserDto.password) {
                    updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
               } else {
                    delete updateUserDto.password; // No actualizar la contraseña si no se proporciona
               }

               // Manejar asignaciones de empresa
               if (updateUserDto.empresas) {
                    await this.handleCompanyAssignments(
                         transactionalEntityManager,
                         usuario,
                         updateUserDto.empresas,
                         superadmin
                    );
               }

               // Actualizar solo los campos enviados
               const userToUpdate = {
                    ...updateUserDto,
                    empresas: undefined, // Excluir empresas para evitar problemas
               };

               Object.assign(usuario, userToUpdate);
               return await transactionalEntityManager.save(Usuario, usuario);
          });
     }

     async findAll(superadmin: Usuario) {
          return await this.usuarioRepository.find({
               where: { createdBy: { id: superadmin.id } },
               relations: ['empresas', 'empresas.empresa'],
          });
     }

     async findOne(id: number, superadmin: Usuario) {
          const usuario = await this.usuarioRepository.findOne({
               where: { id, createdBy: { id: superadmin.id } },
               relations: ['empresas', 'empresas.empresa'],
          });

          if (!usuario) {
               throw new NotFoundException('Usuario no encontrado');
          }

          return usuario;
     }

     async remove(id: number, superadmin: Usuario) {
          return await this.usuarioRepository.manager.transaction(async transactionalEntityManager => {
               const usuario = await this.findOne(id, superadmin);
               await transactionalEntityManager.remove(Usuario, usuario);
               return { message: 'Usuario eliminado correctamente' };
          });
     }

     async assignCompany(userId: number, assignCompanyDto: AssignCompanyDto, superadmin: Usuario) {
          return await this.usuarioRepository.manager.transaction(async transactionalEntityManager => {
               const usuario = await this.findOne(userId, superadmin);
               const empresa = await transactionalEntityManager.findOne(Empresa, {
                    where: {
                         id: assignCompanyDto.empresaId,
                         createdBy: { id: superadmin.id }
                    }
               });

               if (!empresa) {
                    throw new NotFoundException('Empresa no encontrada');
               }

               // Verificar si ya existe la asignación
               const existingAssignment = await transactionalEntityManager.findOne(UsuarioEmpresa, {
                    where: {
                         usuario: { id: usuario.id },
                         empresa: { id: empresa.id },
                    },
               });

               if (existingAssignment) {
                    existingAssignment.companyRole = assignCompanyDto.companyRole;
                    return await transactionalEntityManager.save(UsuarioEmpresa, existingAssignment);
               }

               const usuarioEmpresa = transactionalEntityManager.create(UsuarioEmpresa, {
                    usuario,
                    empresa,
                    companyRole: assignCompanyDto.companyRole,
                    assignedBy: superadmin,
               });

               return await transactionalEntityManager.save(UsuarioEmpresa, usuarioEmpresa);
          });
     }

     async removeCompany(userId: number, empresaId: number, superadmin: Usuario) {
          return await this.usuarioRepository.manager.transaction(async transactionalEntityManager => {
               const usuarioEmpresa = await transactionalEntityManager.findOne(UsuarioEmpresa, {
                    where: {
                         usuario: { id: userId, createdBy: { id: superadmin.id } },
                         empresa: { id: empresaId, createdBy: { id: superadmin.id } },
                    },
               });

               if (!usuarioEmpresa) {
                    throw new NotFoundException('Asignación de empresa no encontrada');
               }

               await transactionalEntityManager.remove(UsuarioEmpresa, usuarioEmpresa);
               return { message: 'Empresa desasignada correctamente' };
          });
     }

     async findOneByEmail(email: string) {
          return await this.usuarioRepository.findOneBy({ email });
     }

     async findOneById(id: number) {
          return await this.usuarioRepository.findOneBy({ id });
     }

     async updateUserToken(id: number, updateUserDto: UpdateUserDto): Promise<Usuario> {
          await this.usuarioRepository.update({ id }, updateUserDto);
          return await this.usuarioRepository.findOneBy({ id });
     }

     async clearAllTokens(userId: number): Promise<Usuario> {
          await this.usuarioRepository.update({ id: userId }, { tokens: null });
          return await this.usuarioRepository.findOneBy({ id: userId });
     }
}