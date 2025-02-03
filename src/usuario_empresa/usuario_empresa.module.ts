import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioEmpresa } from './entities/usuario_empresa.entity';
import { UsuarioEmpresaService } from './usuario_empresa.service';
import { UsuarioEmpresaController } from './usuario_empresa.controller';
import { Usuario } from 'src/users/entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioEmpresa, Usuario, Empresa])],
  controllers: [UsuarioEmpresaController],
  providers: [UsuarioEmpresaService],
  exports:[UsuarioEmpresaService],
})
export class UsuarioEmpresaModule {}

