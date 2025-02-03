import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Body,
  Param,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { ApiTags } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Empresa } from './entities/empresa.entity';

@ApiTags('empresa')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard) // Protege esta ruta
  async findAll(@Req() req): Promise<Empresa[]> {
    const usuarioId = req.user.id; // Obtener el ID del usuario autenticado
    return await this.empresaService.findAll(usuarioId);
  }

  @Post()
  @UseGuards(JwtAuthGuard) // Protege esta ruta
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: './uploads/logos', // Directorio para guardar los archivos
        filename: (req, file, cb) => {
          try {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = file.originalname
              ? path.extname(file.originalname)
              : ''; // Manejar si `originalname` no existe
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
          } catch (error) {
            cb(new Error('Error al procesar el archivo'), null);
          }
        },
      }),
      fileFilter: (req, file, cb) => {
        // Validar que sea una imagen
        if (!file.mimetype.match(/image\/(jpeg|png|jpg|webp)/)) {
          return cb(new Error('Solo se permiten archivos de imagen'), false);
        }
        if (!file.originalname) {
          return cb(new Error('El archivo no tiene un nombre válido'), false);
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @Req() req,
    @Body() createEmpresaDTO: CreateEmpresaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const usuarioId = req.user.id; // Obtener el ID del usuario autenticado
    if (!usuarioId) {
      throw new UnauthorizedException('User ID not found');
    }

    if (file) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
      createEmpresaDTO.logo = `${baseUrl}/uploads/logos/${file.filename}`;
    }
    
    return await this.empresaService.create(createEmpresaDTO, usuarioId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard) // Protege esta ruta
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmpresaDTO: UpdateEmpresaDto,
  ): Promise<Empresa> {
    return await this.empresaService.update(id, updateEmpresaDTO);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Protege esta ruta
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.empresaService.delete(id);
  }
}