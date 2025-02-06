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
               console.error('Error during registration:', error);
               throw new InternalServerErrorException('An error occurred during registration');
          }
     }


     async login(loginDto: LoginDto) {
          try {
               const { email, password } = loginDto;
               const user = await this.userService.findOneByEmail(email);
               if (!user || !(await bcrypt.compare(password, user.password))) {
                    throw new UnauthorizedException('El email o la password son incorrectos');
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

               return { id: user.id, email: user.email, name: user.name, lastname: user.lastname, role: user.role, empresaId, tokens: token };
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

          let tokensArray = user.tokens.split(', ').filter(storedToken => storedToken !== token);
          await this.userService.updateUserToken(userId, { tokens: tokensArray.length ? tokensArray.join(', ') : null });

          return { message: 'Logout successful' };
     }
}
