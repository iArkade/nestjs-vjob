import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UsuarioEmpresa } from 'src/usuario_empresa/entities/usuario_empresa.entity';

@Injectable()
export class AuthService {
     constructor(
          private readonly userService: UsersService,
          private readonly jwtService: JwtService,

          @InjectRepository(Usuario)
          private userRepository: Repository<Usuario>,

          @InjectRepository(Empresa)
          private empresaRepository: Repository<Empresa>,

          @InjectRepository(UsuarioEmpresa)
          private usuarioEmpresaRepository: Repository<UsuarioEmpresa>,
     ) { }

     async registrarUser(registerDto: RegisterDto) {
          try {
               const { name, lastname, email, password } = registerDto;

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
               const empresaGuardada = await this.empresaRepository.save(empresa);

               // Asignar el superadmin a la empresa con el rol 'superadmin'
               const usuarioEmpresa = new UsuarioEmpresa();
               usuarioEmpresa.usuario = usuarioGuardado;
               usuarioEmpresa.empresa = empresaGuardada;
               usuarioEmpresa.rol = 'superadmin';
               await this.usuarioEmpresaRepository.save(usuarioEmpresa);

               // Generar el token JWT
               const payload = {
                    id: usuarioGuardado.id,
                    email: usuarioGuardado.email,
                    name: usuarioGuardado.name,
                    lastname: usuarioGuardado.lastname,
               };
               const token = await this.jwtService.signAsync(payload);

               return {
                    ...usuarioGuardado,
                    tokens: token,
               };
          } catch (error) {
               console.error('Error during registration:', error);
               throw new InternalServerErrorException('An error occurred during registration');
          }
     }

     async login(loginDto: LoginDto) {
          try {
               const { email, password } = loginDto;
               const user = await this.userService.findOneByEmail(email);
               if (!user) {
                    throw new UnauthorizedException('Email is incorrect');
               }

               const match = await bcrypt.compare(password, user.password);
               if (!match) {
                    throw new UnauthorizedException('Password is incorrect');
               }

               // Generar el token JWT
               const payload = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    lastname: user.lastname,
               };
               const token = await this.jwtService.signAsync(payload);

               // Actualizar los tokens del usuario (opcional, si manejas múltiples tokens)
               let tokensArray = user.tokens ? user.tokens.split(', ') : [];
               if (tokensArray.length >= 5) {
                    tokensArray.shift(); // Eliminar el token más antiguo
               }
               tokensArray.push(token);
               await this.userService.updateUserToken(user.id, { tokens: tokensArray.join(', ') });

               return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    lastname: user.lastname,
                    tokens: token,
               };
          } catch (error) {
               console.error('Error during login:', error);
               throw new InternalServerErrorException('An error occurred during login');
          }
     }

     async logout(userId: number, token: string) {
          const user = await this.userService.findOneById(userId);
          if (!user || !user.tokens) {
               throw new UnauthorizedException('User not found or already logged out');
          }

          // Eliminar el token actual del array de tokens
          let tokensArray = user.tokens.split(', ');
          tokensArray = tokensArray.filter((storedToken) => storedToken !== token);

          // Actualizar los tokens del usuario
          await this.userService.updateUserToken(userId, { tokens: tokensArray.join(', ') });

          return { message: 'Logout successful' };
     }
}