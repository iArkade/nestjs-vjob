import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {

     constructor(
          private readonly userService: UsersService,
          private readonly jwtService: JwtService,          
     ){}

     async register(registerDto: RegisterDto) {
          try {
               const { password } = registerDto;
               const hashPassword = await bcrypt.hash(password, 10);
               const newUser = await this.userService.createUser({ ...registerDto, password: hashPassword });

               const payload = {
                    userId: newUser.id,
               };

               const token = await this.jwtService.signAsync(payload);

               const newUserToken = {
                    ...newUser, tokens: token
               };

               return newUserToken;
          } catch (error) {
               console.error('Error during registration:', error);
               throw new InternalServerErrorException('An error occurred during registration');
          }
     }

     async login(loginDto: LoginDto) {
          try {
               const { email, password } = loginDto;
               const user = await this.userService.findOneByEmail(email);
               //console.log(user);
               if (!user) {
                    throw new UnauthorizedException('Email is incorrect');
               }

               const currentPassword = user.password;
               const match = await bcrypt.compare(password, currentPassword);

               if (match) {
                    const payload = {
                         id: user.id,
                         email: user.email,
                         name: user.name,
                         lastname: user.lastname,
                         role: user.role,
                    };

                     // Generar nuevo token
                    const newToken = await this.jwtService.signAsync(payload);

                    // Limitar el número de tokens activos (por ejemplo, a 5)
                    let tokensArray = user.tokens ? user.tokens.split(', ') : [];
                    if (tokensArray.length >= 5) {
                         // Eliminar el token más antiguo (FIFO - el primer token en la lista)
                         tokensArray.shift();
                    }

                    tokensArray.push(newToken);
                    const updatedUserDto = {
                         tokens: tokensArray.join(', ')
                    };

                    const updateUser = await this.userService.updateUserToken(user.id, updatedUserDto);
                    const { active, email: updatedEmail, id, lastname, name, role } = updateUser;

                    if (active) {
                         return { email: updatedEmail, lastname, id, role, name, tokens: newToken };
                    } else {
                         throw new UnauthorizedException('Invalid credentials, the user is inactive');
                    }
               } else {
                    throw new UnauthorizedException('Password is incorrect');
               }
          } catch (error) {
               console.error('Error during login:', error);
               if (error instanceof UnauthorizedException) {
                    throw error;
               }
               throw new InternalServerErrorException('An error occurred during login');
          }
     }

     async logout(userId: number, token: string) {
          const user = await this.userService.findOneById(userId);
          if (!user || !user.tokens) {
               throw new UnauthorizedException('User not found or already logged out');
          }
          
          let tokensArray = user.tokens.split(', ');
          // Eliminar el token actual del array
          tokensArray = tokensArray.filter(storedToken => storedToken !== token);

          // Actualizar los tokens del usuario
          const updatedUserDto = {
               tokens: tokensArray.join(', '),  // Reemplazar la lista de tokens actualizada
          };

          await this.userService.updateUserToken(userId, updatedUserDto);

          return { message: 'Logout successful' };
     }

     // Opcional: Logout de todas las sesiones
     async logoutAllSessions(userId: number): Promise<{ message: string }> {
          await this.userService.clearAllTokens(userId);
          return { message: 'Logged out of all sessions' };
     }

}

