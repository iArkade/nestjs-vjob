import {
     BadRequestException,
     ConflictException,
     Injectable,
     InternalServerErrorException,
     UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from 'src/users/entities/user.entity';
import { UsuarioEmpresa } from '../usuario_empresa/entities/usuario_empresa.entity';
import { SystemRole } from 'src/users/enums/role.enum';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

@Injectable()
export class AuthService {
     constructor(
          @InjectRepository(Usuario)
          private readonly usuarioRepository: Repository<Usuario>,
          @InjectRepository(UsuarioEmpresa)
          private readonly usuarioEmpresaRepository: Repository<UsuarioEmpresa>,
          private readonly jwtService: JwtService,
     ) { }

     async registrarUser(registerDto: RegisterDto) {
          try {
               const { name, lastname, email, password } = registerDto;

               const usuarioExistente = await this.usuarioRepository.findOne({
                    where: { email }
               });

               if (usuarioExistente) {
                    throw new ConflictException('El email ya está registrado');
               }

               const usuario = this.usuarioRepository.create({
                    name,
                    lastname,
                    email,
                    password: await bcrypt.hash(password, 10),
                    systemRole: SystemRole.SUPERADMIN,
                    createdBy: null
               });

               const usuarioGuardado = await this.usuarioRepository.save(usuario);

               const payload = {
                    sub: usuarioGuardado.id,
                    email: usuarioGuardado.email,
                    name: usuarioGuardado.name,
                    lastname: usuarioGuardado.lastname,
                    systemRole: usuarioGuardado.systemRole,
               };

               const token = await this.jwtService.signAsync(payload);

               // Guardar el token en el usuario
               usuarioGuardado.tokens = token;
               await this.usuarioRepository.save(usuarioGuardado);

               return {
                    id: usuarioGuardado.id,
                    email: usuarioGuardado.email,
                    name: usuarioGuardado.name,
                    lastname: usuarioGuardado.lastname,
                    systemRole: usuarioGuardado.systemRole,
                    tokens: token
               };
          } catch (error) {
               if (error instanceof ConflictException) {
                    throw error;
               }
               console.error('Error during registration:', error);
               throw new InternalServerErrorException('Error durante el registro');
          }
     }

     async login(loginDto: LoginDto) {
          try {
               const { email, password } = loginDto;
               const usuario = await this.usuarioRepository.findOne({
                    where: { email }
               });

               if (!usuario) {
                    throw new UnauthorizedException('Credenciales inválidas');
               }

               const isPasswordValid = await bcrypt.compare(password, usuario.password);
               if (!isPasswordValid) {
                    throw new UnauthorizedException('Credenciales inválidas');
               }

               // Buscar empresas asignadas si no es Superadmin
               let empresasAsignadas = [];
               if (usuario.systemRole !== SystemRole.SUPERADMIN) {
                    const usuarioEmpresas = await this.usuarioEmpresaRepository.find({
                         where: { usuario: { id: usuario.id } },
                         relations: ['empresa'],
                    });
                    empresasAsignadas = usuarioEmpresas.map(ue => ({
                         id: ue.empresa.id,
                         nombre: ue.empresa.nombre,
                         role: ue.companyRole
                    }));
               }

               const payload = {
                    sub: usuario.id,
                    email: usuario.email,
                    name: usuario.name,
                    lastname: usuario.lastname,
                    systemRole: usuario.systemRole,
                    empresas: empresasAsignadas
               };

               const token = await this.jwtService.signAsync(payload);

               // Manejar tokens anteriores
               let tokensArray = usuario.tokens ? usuario.tokens.split(', ') : [];
               if (tokensArray.length >= 5) tokensArray.shift();
               tokensArray.push(token);

               usuario.tokens = tokensArray.join(', ');
               await this.usuarioRepository.save(usuario);

               return {
                    id: usuario.id,
                    email: usuario.email,
                    name: usuario.name,
                    lastname: usuario.lastname,
                    systemRole: usuario.systemRole,
                    empresas: empresasAsignadas,
                    tokens: token
               };
          } catch (error) {
               if (error instanceof UnauthorizedException) {
                    throw error;
               }
               console.error('Error during login:', error);
               throw new InternalServerErrorException('Error durante el login');
          }
     }

     async logout(userId: number, token: string) {
          try {
               const usuario = await this.usuarioRepository.findOne({
                    where: { id: userId }
               });

               if (!usuario) {
                    throw new UnauthorizedException('Usuario no encontrado');
               }

               if (!usuario.tokens) {
                    throw new UnauthorizedException('El usuario ya cerró sesión');
               }

               // Filtra el token actual
               const tokensArray = usuario.tokens.split(', ').filter(t => t !== token);

               // Si no quedan tokens, establece el campo como null
               usuario.tokens = tokensArray.length ? tokensArray.join(', ') : null;

               // Guarda los cambios en la base de datos
               await this.usuarioRepository.save(usuario);

               return { message: 'Sesión cerrada exitosamente' };
          } catch (error) {
               if (error instanceof UnauthorizedException) {
                    throw error;
               }
               console.error('Error during logout:', error);
               throw new InternalServerErrorException('Error durante el cierre de sesión');
          }
     }
}