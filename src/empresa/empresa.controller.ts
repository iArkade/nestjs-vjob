import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException, ParseIntPipe } from '@nestjs/common';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { ApiTags } from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { Empresa } from './entities/empresa.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';

@ApiTags('empresa')
@Controller('empresa')
export class EmpresaController {
    constructor(private readonly empresaService: EmpresaService) { }
    @Get('all')
    async findAll(): Promise<Empresa[]> {
        return await this.empresaService.findAll();
    }
    //* Tengo que irme al Module para asegurarme de que sirva los archios desde el directorio de carga para que se puedan usar en el front end
    @Post()
    @UseInterceptors(
        FileInterceptor('logo', {
            storage: diskStorage({
                destination: './uploads/logos', // Directorio para guardar los archivos
                filename: (req, file, cb) => {
                    try {
                        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                        const ext = file.originalname ? path.extname(file.originalname) : ''; // Manejar si `originalname` no existe
                        console.log(file.originalname)
                        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
                    } catch (error) {
                        cb(new Error('Error al procesar el archivo'), null);
                    }
                },
            }),
            fileFilter: (req, file, cb) => {
                // Validar que sea una imagen
                if (!file.mimetype.match(/image\/(jpeg|png|jpg)/)) {
                    return cb(new Error('Solo se permiten archivos de imagen'), false);
                }
                if (!file.originalname) {
                    return cb(new Error('El archivo no tiene un nombre válido'), false);
                }
                cb(null, true);
            },
            // limits: {
            //     fileSize: 5 * 1024 * 1024, // 5 MB
            // },
        }),
    )
    async create(
        @Body() createEmpresaDTO: CreateEmpresaDto,
        @UploadedFile() file: Express.Multer.File
    ){
        if (file) {
            // Generar URL completa del archivo
            const baseUrl = process.env.BASE_URL
            createEmpresaDTO.logo = `${baseUrl}/uploads/logos/${file.filename}`;
            console.log( createEmpresaDTO.logo)
            //createEmpresaDTO.logo = `/uploads/logos/${file.filename}`;
        }

        return await this.empresaService.create(createEmpresaDTO);
    }

    @Put(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateEmpresaDTO: UpdateEmpresaDto,
    ): Promise<Empresa> {
        return await this.empresaService.update(id, updateEmpresaDTO);
    }

    @Delete(':id')
    async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
        return await this.empresaService.delete(id);
    }
}
