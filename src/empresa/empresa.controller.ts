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
import { unlink } from 'fs/promises';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Empresa } from './entities/empresa.entity';
import { SystemRole } from '../users/enums/role.enum';

@ApiTags('empresa')
@Controller('empresa')
@UseGuards(JwtAuthGuard)
export class EmpresaController {
    constructor(private readonly empresaService: EmpresaService) { }

    @Get('all')
    async findAll(@Req() req:any): Promise<Empresa[]> {
        const user = req.user;

        if (user.systemRole === SystemRole.SUPERADMIN) {

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
                        cb(new Error('Error al procesar el archivo'), "");
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
        @Req()  req:any,
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
                        cb(new Error('Error al procesar el archivo'), "");
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
    async update(
        @Req()  req:any,
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEmpresaDTO: UpdateEmpresaDto,
        @UploadedFile() file: Express.Multer.File,
    ): Promise<Empresa> {
        const user = req.user;

        // Verificar que la empresa pertenezca al superadmin
        if (user.systemRole === SystemRole.SUPERADMIN) {
            const empresa = await this.empresaService.findOne(id);
            if (empresa.createdBy.id !== user.id) {
                throw new ForbiddenException('No tienes permiso para modificar esta empresa');
            }

            if (file) {
                // Eliminar el archivo anterior si existe
                if (empresa.logo) {
                    try {
                        const oldLogoUrl = new URL(empresa.logo);
                        const oldFileName = path.basename(oldLogoUrl.pathname);
                        const oldFilePath = path.join('./uploads/logos', oldFileName);

                        await unlink(oldFilePath);
                    } catch (error) {
                        console.error('Error al eliminar el archivo anterior:', error);
                        // Continuar con la actualización incluso si falla la eliminación
                    }
                }

                const baseUrl = process.env.BASE_URL || 'http://localhost:4000';
                updateEmpresaDTO.logo = `${baseUrl}/uploads/logos/${file.filename}`;
            }
        } else {
            throw new ForbiddenException('Solo los superadmins pueden modificar empresas');
        }

        return await this.empresaService.update(id, updateEmpresaDTO);
    }

    @Delete(':id')
    async delete(
        @Req()  req:any,
        @Param('id', ParseIntPipe) id: number
    ): Promise<void> {
        const user = req.user;

        // Verificar que la empresa pertenezca al superadmin
        if (user.systemRole === SystemRole.SUPERADMIN) {
            const empresa = await this.empresaService.findOne(id);
            if (empresa.createdBy.id !== user.id) {
                throw new ForbiddenException('No tienes permiso para eliminar esta empresa');
            }

            // Eliminar el archivo de logo si existe
            if (empresa.logo) {
                try {
                    const logoUrl = new URL(empresa.logo);
                    const fileName = path.basename(logoUrl.pathname);
                    const filePath = path.join('./uploads/logos', fileName);

                    await unlink(filePath);
                } catch (error) {
                    console.error('Error al eliminar el archivo del logo:', error);
                    // Continuar con la eliminación de la empresa incluso si falla la eliminación del archivo
                }
            }
        } else {
            throw new ForbiddenException('Solo los superadmins pueden eliminar empresas');
        }

        return await this.empresaService.delete(id);
    }
}