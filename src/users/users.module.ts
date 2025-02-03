import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UsuarioEmpresa } from 'src/usuario_empresa/entities/usuario_empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, Empresa, UsuarioEmpresa])],
  controllers: [UsersController],
  providers: [UsersService],
  exports:[UsersService],
})
export class UsersModule {}

