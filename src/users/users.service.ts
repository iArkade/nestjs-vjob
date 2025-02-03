import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserRequestDto } from './dtos/create.user.dto';
import { UpdateUserRequestDto } from './dtos/update.user.dto';
import * as bcrypt from 'bcrypt';
import { RegistrarUsuarioDto } from './dtos/register.user.dto';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UsuarioEmpresa } from 'src/usuario_empresa/entities/usuario_empresa.entity';


@Injectable()
export class UsersService {
     constructor(
          @InjectRepository(Usuario)
          private userRepository: Repository<Usuario>,

          @InjectRepository(Empresa)
          private empresaRepository: Repository<Empresa>,

          @InjectRepository(UsuarioEmpresa)
          private usuarioEmpresaRepository: Repository<UsuarioEmpresa>,
     ) { }

     // async getUsers(): Promise<User[]> {
     //      return await this.userRepository.find();
     // }

     // async getUser(id: number): Promise<User> {
     //      return await this.userRepository.findOne({
     //           where: { id },
     //      });
     // }

     async findOneByEmail(email: string){
          const result = await this.userRepository.findOneBy({ email });
          return result;
     }

     async findOneById(id: number){
          const result = await this.userRepository.findOneBy({ id });
          return result;
     }

     async registrarUser(registrarUsuarioDto: RegistrarUsuarioDto) {
          const { name, lastname, email, password } = registrarUsuarioDto;
        
          // Verificar si el email ya está registrado
          const usuarioExistente = await this.userRepository.findOne({ where: { email } });
          if (usuarioExistente) {
            throw new ConflictException('El email ya está registrado');
          }
        
          // Crear el superadmin
          const usuario = new Usuario();
          usuario.name = name;
          usuario.lastname = lastname;
          usuario.email = email;
          usuario.password = await bcrypt.hash(password, 10);
          const usuarioGuardado = await this.userRepository.save(usuario);
        
          // Crear una empresa por defecto para el superadmin
          const empresa = new Empresa();
          empresa.nombre = 'Mi Empresa'; // Nombre por defecto
          await this.empresaRepository.save(empresa);
        
          // Asignar el superadmin a la empresa con el rol 'superadmin'
          const usuarioEmpresa = new UsuarioEmpresa();
          usuarioEmpresa.usuario = usuarioGuardado;
          usuarioEmpresa.empresa = empresa;
          usuarioEmpresa.rol = 'superadmin';
          await this.usuarioEmpresaRepository.save(usuarioEmpresa);
        
          return usuarioGuardado;
        }


     async createUser(createUserDto: CreateUserRequestDto): Promise<Usuario> {
          return await this.userRepository.save(createUserDto)
     }

     async deleteUser(id: number): Promise<void> {
          try {
               const result = await this.userRepository.delete({ id });

               // Verifica si algún registro fue afectado (eliminado)
               if (result.affected === 0) {
                    throw new NotFoundException(`User with ID ${id} not found`);
               }
          } catch (error) {
               throw new InternalServerErrorException(`Failed to delete user with ID ${id}`);
          }
     }

     async updateUser(id: number, updateUserDto: UpdateUserRequestDto):  Promise<Usuario> {
          
          try {
               let user = updateUserDto;
               const { password } = user;
               
               if (password) {
                    const hashPassword = await bcrypt.hash(password, 10);
                    user = { ...user, password: hashPassword };
               }

               await this.userRepository.update({ id }, user);

               //Devuelve el usuario actualizado
               return await this.userRepository.findOneBy({ id });

          } catch (error) {
               throw error;
          }
     }

     async updateUserToken(id: number, updateUserDto: UpdateUserRequestDto):  Promise<Usuario> {
          
          try {
               await this.userRepository.update({ id }, updateUserDto);
               return await this.userRepository.findOneBy({ id });
          } catch (error) {
               throw error;
          }
     }

     //opcional en caso de limpiar todos los tokns de todas las sesiones
     async clearAllTokens(userId: number): Promise<Usuario> {
          await this.userRepository.update({ id: userId }, { tokens: '' });
          return await this.userRepository.findOneBy({ id: userId });
     }
}

