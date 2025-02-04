import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UpdateUserRequestDto } from './dtos/update.user.dto';

@Injectable()
export class UsersService {
     constructor(
          @InjectRepository(Usuario)
          private userRepository: Repository<Usuario>
     ) { }

     async findOneByEmail(email: string) {
          return await this.userRepository.findOneBy({ email });
     }

     async findOneById(id: number) {
          return await this.userRepository.findOneBy({ id });
     }

     async updateUserToken(id: number, updateUserDto: UpdateUserRequestDto): Promise<Usuario> {
          await this.userRepository.update({ id }, updateUserDto);
          return await this.userRepository.findOneBy({ id });
     }

     async clearAllTokens(userId: number): Promise<Usuario> {
          await this.userRepository.update({ id: userId }, { tokens: null });
          return await this.userRepository.findOneBy({ id: userId });
     }
}

