import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { Usuario } from 'src/users/entities/user.entity';
import { UsuarioEmpresa } from 'src/usuario_empresa/entities/usuario_empresa.entity';


@Module({
    imports: [
        TypeOrmModule.forFeature([Empresa, Usuario, UsuarioEmpresa]),
        ServeStaticModule.forRoot({
            //rootPath: join(__dirname, '..', 'uploads'), // Directorio de archivos estáticos
            rootPath: join(process.cwd(), 'uploads'),//uso esto porq el archivo esta fuera del src
            serveRoot: '/uploads', // Ruta base para acceder a los archivos
        }),
    ],
    controllers: [EmpresaController],
    providers: [EmpresaService],
})
export class EmpresaModule { }

