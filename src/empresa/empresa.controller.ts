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
  ForbiddenException,
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
import { SystemRole } from 'src/users/enums/role.enum';

@ApiTags('empresa')
@Controller('empresa')
@UseGuards(JwtAuthGuard)
export class EmpresaController {
    constructor(private readonly empresaService: EmpresaService) {}

    @Get('all')
    async findAll(@Req() req): Promise<Empresa[]> {
        const user = req.user;
        
        if (user.systemRole === SystemRole.SUPERADMIN) {
            console.log(user.id, user);
            
            // Superadmin ve solo las empresas que creó
            return await this.empresaService.findAllByCreator(user.id);
        } else {
            // Usuarios normales ven las empresas asignadas
            return await this.empresaService.findAllByUser(user.id);
        }
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('logo', {
            storage: diskStorage({
                destination: './uploads/logos',
                filename: (req, file, cb) => {
                    try {
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const ext = path.extname(file.originalname || '');
                        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                    } catch (error) {
                        cb(new Error('Error al procesar el archivo'), null);
                    }
                },
            }),
            fileFilter: (req, file, cb) => {
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
        const user = req.user;
        
        // Solo superadmins pueden crear empresas
        if (user.systemRole !== SystemRole.SUPERADMIN) {
            throw new ForbiddenException('Solo los superadmins pueden crear empresas');
        }

        if (file) {
            const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
            createEmpresaDTO.logo = `${baseUrl}/uploads/logos/${file.filename}`;
        }

        return await this.empresaService.create(createEmpresaDTO, user.id);
    }

    @Put(':id')
    async update(
        @Req() req,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEmpresaDTO: UpdateEmpresaDto,
    ): Promise<Empresa> {
        const user = req.user;
        
        // Verificar que la empresa pertenezca al superadmin
        if (user.systemRole === SystemRole.SUPERADMIN) {
            const empresa = await this.empresaService.findOne(id);
            if (empresa.createdBy.id !== user.id) {
                throw new ForbiddenException('No tienes permiso para modificar esta empresa');
            }
        } else {
            throw new ForbiddenException('Solo los superadmins pueden modificar empresas');
        }

        return await this.empresaService.update(id, updateEmpresaDTO);
    }

    @Delete(':id')
    async delete(
        @Req() req,
        @Param('id', ParseIntPipe) id: number
    ): Promise<void> {
        const user = req.user;
        
        // Verificar que la empresa pertenezca al superadmin
        if (user.systemRole === SystemRole.SUPERADMIN) {
            const empresa = await this.empresaService.findOne(id);
            if (empresa.createdBy.id !== user.id) {
                throw new ForbiddenException('No tienes permiso para eliminar esta empresa');
            }
        } else {
            throw new ForbiddenException('Solo los superadmins pueden eliminar empresas');
        }

        return await this.empresaService.delete(id);
    }
}