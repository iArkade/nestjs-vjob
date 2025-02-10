import {
     BadRequestException,
     ConflictException,
     Injectable,
     InternalServerErrorException,
     UnauthorizedException
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Usuario } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UsuarioEmpresa } from 'src/usuario_empresa/entities/usuario_empresa.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Role } from 'src/users/enums/role.enum';

@Injectable()
export class AuthService {
     constructor(
          private readonly userService: UsersService,
          private readonly jwtService: JwtService,

          @InjectRepository(Usuario)
          private userRepository: Repository<Usuario>,

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

               // Crear el usuario con el rol asignado
               const usuario = this.userRepository.create({
                    name,
                    lastname,
                    email,
                    password: await bcrypt.hash(password, 10),
                    role: Role.SUPERADMIN, // Se asigna el rol
               });
               console.log(usuario)
               const usuarioGuardado = await this.userRepository.save(usuario);

               // Generar el token JWT
               const payload = {
                    id: usuarioGuardado.id,
                    email: usuarioGuardado.email,
                    name: usuarioGuardado.name,
                    lastname: usuarioGuardado.lastname,
                    role: usuarioGuardado.role, // Incluir el rol en el token
               };
               const token = await this.jwtService.signAsync(payload);

               return {
                    ...usuarioGuardado,
                    tokens: token,
               };
          } catch (error) {
               // Manejo de errores específicos
               if (error instanceof ConflictException) {
                    // Error ya lanzado por el email duplicado
                    throw error;
               }

               // Manejo de errores relacionados con la base de datos
               if (error.name === 'QueryFailedError') {
                    console.error('Error en la base de datos:', error);
                    throw new InternalServerErrorException('Error al guardar el usuario en la base de datos.');
               }

               // Otros errores
               console.error('Error desconocido durante el registro:', error);
               throw new InternalServerErrorException('Ocurrió un error inesperado durante el registro.');
          }
     }


     async login(loginDto: LoginDto) {
          try {
               const { email, password } = loginDto;
               const user = await this.userService.findOneByEmail(email);
               if (!user || !(await bcrypt.compare(password, user.password))) {
                    throw new UnauthorizedException('El email o la contraseña son incorrectos');
               }

               // Buscar empresa del usuario si no es Superadmin
               let empresaId = null;
               if (user.role !== 'superadmin') {
                    const usuarioEmpresa = await this.usuarioEmpresaRepository.findOne({
                         where: { usuario: { id: user.id } },
                         relations: ['empresa'],
                    });
                    empresaId = usuarioEmpresa ? usuarioEmpresa.empresa.id : null;
               }

               const payload = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    lastname: user.lastname,
                    role: user.role,
                    empresaId: empresaId, // Asigna empresa si aplica
               };
               const token = await this.jwtService.signAsync(payload);

               let tokensArray = user.tokens ? user.tokens.split(', ') : [];
               if (tokensArray.length >= 5) tokensArray.shift();
               tokensArray.push(token);
               await this.userService.updateUserToken(user.id, { tokens: tokensArray.join(', ') });

               return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    lastname: user.lastname,
                    role: user.role,
                    empresaId,
                    tokens: token
               };
          } catch (error) {
               if (error instanceof UnauthorizedException) {
                    // Si el error ya es de autenticación, lo lanzamos tal cual
                    throw error;
               }

               // Manejo de errores relacionados con la base de datos
               if (error.name === 'QueryFailedError') {
                    console.error('Error en la base de datos:', error);
                    throw new InternalServerErrorException('Error al consultar la base de datos.');
               }

               // Otros errores genéricos
               console.error('Error desconocido durante el inicio de sesión:', error);
               throw new InternalServerErrorException('Ocurrió un error inesperado durante el inicio de sesión.');
          }
     }

     async logout(userId: number, token: string) {
          try {
               const user = await this.userService.findOneById(userId);

               // Verificar si el usuario existe y tiene tokens
               if (!user) {
                    throw new UnauthorizedException('El usuario no existe.');
               }

               if (!user.tokens) {
                    throw new UnauthorizedException('El usuario ya ha cerrado sesión.');
               }

               // Filtrar el token y actualizar
               let tokensArray = user.tokens.split(', ').filter(storedToken => storedToken !== token);

               await this.userService.updateUserToken(userId, {
                    tokens: tokensArray.length ? tokensArray.join(', ') : null
               });

               return { message: 'Cierre de sesión exitoso' };

          } catch (error) {
               if (error instanceof UnauthorizedException) {
                    // Relanzar los errores de autenticación
                    throw error;
               }

               // Manejo de errores de base de datos u otros errores no previstos
               console.error('Error inesperado durante el cierre de sesión:', error);
               throw new InternalServerErrorException('Ocurrió un error inesperado. Intente nuevamente más tarde.');
          }
     }
}
