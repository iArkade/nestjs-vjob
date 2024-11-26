import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserRequestDto } from './dtos/create.user.dto';
import { UpdateUserRequestDto } from './dtos/update.user.dto';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersService {
     constructor(
          @InjectRepository(User)
          private userRepository: Repository<User>,
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


     async createUser(createUserDto: CreateUserRequestDto): Promise<User> {
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

     async updateUser(id: number, updateUserDto: UpdateUserRequestDto):  Promise<User> {
          
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

     async updateUserToken(id: number, updateUserDto: UpdateUserRequestDto):  Promise<User> {
          
          try {
               await this.userRepository.update({ id }, updateUserDto);
               return await this.userRepository.findOneBy({ id });
          } catch (error) {
               throw error;
          }
     }

     //opcional en caso de limpiar todos los tokns de todas las sesiones
     async clearAllTokens(userId: number): Promise<User> {
          await this.userRepository.update({ id: userId }, { tokens: '' });
          return await this.userRepository.findOneBy({ id: userId });
     }
}

