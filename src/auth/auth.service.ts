import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/user.entity';
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

               if (!user) {
                    throw new UnauthorizedException('Email is incorrect');
               }

               const currentPassword = user.password;
               const match = await bcrypt.compare(password, currentPassword);

               if (match) {
                    const payload = {
                         userId: user.id,
                         email: user.email,
                         name: user.name,
                         role: user.role,
                    };

                    const token = await this.jwtService.signAsync(payload);

                    const updateUserDto = {
                         tokens: `${user.tokens ? user.tokens + ', ' : ''}${token}`,
                    };

                    const updateUser = await this.userService.updateUserToken(user.id, updateUserDto);
                    const { active, email: updatedEmail, id, lastname, name, role } = updateUser;

                    if (active) {
                         return { email: updatedEmail, lastname, id, role, name, tokens: token };
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
}

