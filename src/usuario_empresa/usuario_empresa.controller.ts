import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, ValidationPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsuarioEmpresaService } from './usuario_empresa.service';

@ApiTags('usuario_empresa')
@Controller('UsuarioEmpresa')
export class UsuarioEmpresaController {
    constructor(
        private usuarioEmpresaService: UsuarioEmpresaService
    ) { }


}

