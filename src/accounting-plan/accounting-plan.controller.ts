import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Put, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { AccountingPlanService } from './accounting-plan.service';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';

@ApiTags('accounting')
@Controller('accounting-plan')
export class AccountingPlanController {
  constructor(private readonly accountingPlanService: AccountingPlanService) { }

  @Post()
  async create(@Body() createAccountingPlanDto: CreateAccountingPlanDto | CreateAccountingPlanDto[]) {
    // Si es un solo objeto, lo convertimos en un array
    if (!Array.isArray(createAccountingPlanDto)) {
      createAccountingPlanDto = [createAccountingPlanDto];
    }
    return await this.accountingPlanService.createMany(createAccountingPlanDto);
  }


  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('replace') replace?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Validar si la tabla ya tiene datos
      const existingRecordsCount = await this.accountingPlanService.countRecords();

      if (existingRecordsCount > 0 && replace !== 'true') {
        return {
          existingData: true,
          message: 'Datos existentes en la tabla',
        };
      }

      if (replace === 'true') {
        await this.accountingPlanService.deleteAllRecords();
      }

      // Leer y procesar el archivo Excel
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new BadRequestException(
          'El archivo Excel está vacío o solo contiene encabezados',
        );
      }

      const headers = jsonData[0] as string[];
      const codeIndex = headers.findIndex(
        (header) => header.toLowerCase() === 'code',
      );
      const nameIndex = headers.findIndex(
        (header) => header.toLowerCase() === 'name',
      );

      if (codeIndex === -1 || nameIndex === -1) {
        throw new BadRequestException(
          'Estructura inválida en el Excel. Faltan las columnas "code" o "name".',
        );
      }

      const records = jsonData.slice(1).map((row) => ({
        code: row[codeIndex]?.toString()?.trim(),
        name: row[nameIndex]?.toString()?.trim(),
      }));

      // Validar y guardar los datos
      const result = await this.accountingPlanService.importData(records);

      return {
        message: 'Archivo procesado e importado correctamente',
        ...result,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error procesando archivo Excel:', error);
      throw new InternalServerErrorException(
        'Ocurrió un error al procesar el archivo',
      );
    }
  }


  @Get('paginated')
  findAllPaginated(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.accountingPlanService.findAllPaginated(page, limit);
  }

  @Get('all')
  findAll() {
    return this.accountingPlanService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountingPlanService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAccountingPlanDto: UpdateAccountingPlanDto) {
    return this.accountingPlanService.update(+id, updateAccountingPlanDto);
  }

  @Delete(':code')
  remove(@Param('code') code: string) {
    return this.accountingPlanService.remove(code);
  }
}
