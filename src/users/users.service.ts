import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

          return await this.usuarioRepository.manager.transaction(async transactionalEntityManager => {
               // Crear usuario
               const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
               const usuario = transactionalEntityManager.create(Usuario, {
                    ...createUserDto,
                    systemRole: SystemRole.USER,
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
               await transactionalEntityManager.save(Usuario, usuario);

               return await transactionalEntityManager.findOne(Usuario, {
                    where: { id },
                    relations: ['empresas', 'empresas.empresa'],
               });
          });
     }

     async createByEmpresa(empresaId: number, createUserDto: CreateUserDto, currentUser: Usuario) {
          //console.log(currentUser);
          if (currentUser.systemRole !== SystemRole.SUPERADMIN) {
               const acceso = await this.usuarioEmpresaRepository.findOne({
                    where: {
                         usuario: { id: currentUser.id },
                         empresa: { id: empresaId }
                    }
               });

               if (!acceso) {
                    throw new ForbiddenException('No tienes acceso a esta empresa');
               }
          }
          const existingUser = await this.usuarioRepository.findOne({ where: { email: createUserDto.email } });
          if (existingUser) {
               throw new ConflictException('El email ya está en uso');
          }

          const nuevoUsuario = this.usuarioRepository.create({
               ...createUserDto, // Mantiene los datos del DTO
               password: await bcrypt.hash(createUserDto.password, 10), // Hashear contraseña
               systemRole: currentUser.systemRole === SystemRole.SUPERADMIN ? SystemRole.USER : SystemRole.USER, // Siempre USER si no es SUPERADMIN
               createdBy: { id: currentUser.id }, // Agregar relación sin modificar el DTO
          });


          // Guardar usuario en la base de datos
          const savedUser = await this.usuarioRepository.save(nuevoUsuario);

          // Crear relación usuario-empresa
          const usuarioEmpresa = this.usuarioEmpresaRepository.create({
               usuario: savedUser,
               empresa: { id: empresaId },
               companyRole: createUserDto.empresas[0].companyRole, // Tomamos el rol enviado desde el frontend
          });

          await this.usuarioEmpresaRepository.save(usuarioEmpresa);
          const userWithRelations = await this.usuarioRepository.findOne({
               where: { id: savedUser.id },
               relations: ['empresas', 'empresas.empresa'], // Cargar relaciones
          });

          return userWithRelations;
     }

     async updateByEmpresa(empresaId: number, userId: number, updateUserDto: UpdateUserDto, currentUser: Usuario) {
          // Verificar si el usuario tiene acceso a la empresa (excepto SUPERADMIN)
          if (currentUser.systemRole !== SystemRole.SUPERADMIN) {
               const acceso = await this.usuarioEmpresaRepository.findOne({
                    where: {
                         usuario: { id: currentUser.id },
                         empresa: { id: empresaId },
                    },
               });

               if (!acceso) {
                    throw new ForbiddenException('No tienes acceso a esta empresa');
               }
          }

          // Buscar usuario a actualizar
          const userToUpdate = await this.usuarioRepository.findOne({
               where: { id: userId },
               relations: ['empresas', 'empresas.empresa'],
          });

          if (!userToUpdate) {
               throw new NotFoundException('Usuario no encontrado');
          }

          // Verificar si el email ya existe en otro usuario
          if (updateUserDto.email && updateUserDto.email !== userToUpdate.email) {
               const existingUser = await this.usuarioRepository.findOne({ where: { email: updateUserDto.email } });
               if (existingUser) {
                    throw new ConflictException('El email ya está en uso por otro usuario');
               }
          }

          // Manejo seguro de password para evitar errores con valores vacíos
          const newPassword = updateUserDto.password && updateUserDto.password !== ""
               ? await bcrypt.hash(updateUserDto.password, 10)
               : userToUpdate.password;

          // Actualizar usuario con los datos permitidos
          await this.usuarioRepository.update(userId, {
               name: updateUserDto.name ?? userToUpdate.name,
               lastname: updateUserDto.lastname ?? userToUpdate.lastname,
               email: updateUserDto.email ?? userToUpdate.email,
               password: newPassword,
          });

          // Actualizar los roles en las empresas asociadas al usuario
          if (updateUserDto.empresas && updateUserDto.empresas.length > 0) {
               for (const empresa of updateUserDto.empresas) {
                    const usuarioEmpresa = await this.usuarioEmpresaRepository.findOne({
                         where: { usuario: { id: userId }, empresa: { id: empresa.empresaId } },
                    });

                    if (usuarioEmpresa) {
                         usuarioEmpresa.companyRole = empresa.companyRole;
                         await this.usuarioEmpresaRepository.save(usuarioEmpresa);
                    }
               }
          }

          // Retornar usuario actualizado con las relaciones cargadas
          return await this.usuarioRepository.findOne({
               where: { id: userId },
               relations: ['empresas', 'empresas.empresa'],
          });
     }

     async deleteByEmpresa(empresaId: number, userId: number, currentUser: Usuario) {
          if (currentUser.systemRole !== SystemRole.SUPERADMIN) {
               const acceso = await this.usuarioEmpresaRepository.findOne({
                    where: { usuario: { id: currentUser.id }, empresa: { id: empresaId } },
               });

               if (!acceso) {
                    throw new ForbiddenException('No tienes acceso a esta empresa');
               }
          }

          const userToDelete = await this.usuarioRepository.findOne({
               where: { id: userId },
               relations: ['empresas'],
          });

          if (!userToDelete) {
               throw new NotFoundException('Usuario no encontrado');
          }

          const relacionUsuarioEmpresa = await this.usuarioEmpresaRepository.findOne({
               where: { usuario: { id: userId }, empresa: { id: empresaId } },
          });

          if (!relacionUsuarioEmpresa) {
               throw new NotFoundException('El usuario no pertenece a esta empresa');
          }

          if (userToDelete.empresas.length > 1) {
               // Si pertenece a más de una empresa, solo eliminamos la relación
               await this.usuarioEmpresaRepository.delete({ usuario: { id: userId }, empresa: { id: empresaId } });
          } else {
               // Si solo pertenece a una empresa, eliminará automáticamente la relación en usuario_empresa por el CASCADE
               await this.usuarioRepository.delete(userId);
          }

          return { message: 'Usuario eliminado correctamente' };
     }

     async findAllByEmpresa(empresaId: number, currentUser: Usuario) {
          const queryBase = this.usuarioRepository
               .createQueryBuilder('usuario')
               .leftJoinAndSelect('usuario.empresas', 'usuarioEmpresa')
               .leftJoinAndSelect('usuarioEmpresa.empresa', 'empresa')
               .leftJoin('usuario.createdBy', 'createdBy')
               .addSelect(['createdBy.id'])
               .where('empresa.id = :empresaId', { empresaId });

          // Si el usuario no es SUPERADMIN, validar su acceso y ocultar otros SUPERADMIN
          if (currentUser.systemRole !== SystemRole.SUPERADMIN) {
               const tieneAcceso = await this.usuarioEmpresaRepository.exists({
                    where: { usuario: { id: currentUser.id }, empresa: { id: empresaId } },
               });

               if (!tieneAcceso) {
                    throw new ForbiddenException('No tienes acceso a esta empresa');
               }

               // Ocultar usuarios SUPERADMIN para usuarios normales
               queryBase.andWhere('usuario.systemRole != :superadminRole', {
                    superadminRole: SystemRole.SUPERADMIN,
               });
          }

          return queryBase.getMany();
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

               if (!usuario) {
                    throw new NotFoundException('Usuario no encontrado');
               }

               // Primero eliminamos todas las relaciones usuario_empresa
               await transactionalEntityManager
                    .createQueryBuilder()
                    .delete()
                    .from(UsuarioEmpresa)
                    .where("usuarioId = :userId", { userId: usuario.id })
                    .execute();

               // Luego eliminamos el usuario 
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