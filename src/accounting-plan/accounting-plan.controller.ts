import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AccountingPlanService } from './accounting-plan.service';
import { CreateAccountingPlanDto } from './dto/create-accounting-plan.dto';
import { UpdateAccountingPlanDto } from './dto/update-accounting-plan.dto';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import * as ExcelJS from 'exceljs';
import * as multer from 'multer';

@ApiTags('accounting')
@Controller('accounting-plan')
export class AccountingPlanController {
  constructor(private readonly accountingPlanService: AccountingPlanService) { }

  @Post()
  async create(
    @Body()
    createAccountingPlanDto:
      | CreateAccountingPlanDto
      | CreateAccountingPlanDto[],
  ) {
    // If it's a single object, convert to array
    if (!Array.isArray(createAccountingPlanDto)) {
      createAccountingPlanDto = [createAccountingPlanDto];
    }

    // Add empresa_id to each item
    const accountingPlansWithCompany = createAccountingPlanDto.map((item) => ({
      ...item,
    }));

    return await this.accountingPlanService.createMany(
      accountingPlansWithCompany,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('empresa_id') empresa_id: number,
  ) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Validate if records already exist for this company
      const existingRecordsCount =
        await this.accountingPlanService.countRecords(empresa_id);

      if (existingRecordsCount > 0) {
        throw new BadRequestException({
          message: 'Ya existe un plan de cuentas para esta empresa',
          existingData: true,
        });
      }

      // Read and process Excel file (previous logic remains the same)
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(file.buffer);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new BadRequestException('No se encontró ninguna hoja en el archivo Excel');
      }

      const rows = worksheet.getRows(1, worksheet.rowCount) || [];
      if (rows.length < 2) {
        throw new BadRequestException(
          'El archivo Excel está vacío o solo contiene encabezados',
        );
      }

      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value ? cell.value.toString().toLowerCase() : '';
      });

      const codeIndex = headers.findIndex(header => header === 'code');
      const nameIndex = headers.findIndex(header => header === 'name');

      if (codeIndex === -1 || nameIndex === -1) {
        throw new BadRequestException(
          'Estructura inválida en el Excel. Faltan las columnas "code" o "name".',
        );
      }

      const records = [];
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        if (row.hasValues) {
          records.push({
            code: row.getCell(codeIndex + 1).value?.toString()?.trim(),
            name: row.getCell(nameIndex + 1).value?.toString()?.trim(),
            empresa_id: empresa_id,
          });
        }
      }

      // Validate and save the data
      const result = await this.accountingPlanService.importData(records);

      // If there are errors, throw an exception with details
      if (result.errors && result.errors.length > 0) {
        throw new BadRequestException({
          message: 'Errores en la importación',
          errors: result.errors,
        });
      }

      return {
        message: 'Archivo procesado e importado correctamente',
        ...result,
      };
    } catch (error) {
      // Handle specific errors
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
    @Query('limit') limit: number = 10,
    @Query('empresa_id') empresa_id: number,
  ) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
    }
    return this.accountingPlanService.findAllPaginated(page, limit, empresa_id);
  }

  @Get('all')
  findAll(@Query('empresa_id') empresa_id: number) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
    }
    return this.accountingPlanService.findAll(empresa_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('empresa_id') empresa_id: number) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
    }
    return this.accountingPlanService.findOne(+id, empresa_id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountingPlanDto: UpdateAccountingPlanDto,
    @Query('empresa_id') empresa_id: number,
  ) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
    }
    return this.accountingPlanService.update(
      +id,
      updateAccountingPlanDto,
      empresa_id,
    );
  }

  @Delete(':code')
  remove(@Param('code') code: string, @Query('empresa_id') empresa_id: number) {
    if (!empresa_id) {
      throw new BadRequestException('empresa_id is required');
    }
    return this.accountingPlanService.remove(code, empresa_id);
  }
}
