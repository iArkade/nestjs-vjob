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
import * as XLSX from 'xlsx';

@ApiTags('accounting')
@Controller('accounting-plan')
export class AccountingPlanController {
  constructor(private readonly accountingPlanService: AccountingPlanService) {}

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
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('empresa_id') empresaId: number,
  ) {
    if (!empresaId) {
      throw new BadRequestException('empresa_id is required');
    }

    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Validate if records already exist for this company
      const existingRecordsCount =
        await this.accountingPlanService.countRecords(empresaId);

      if (existingRecordsCount > 0) {
        throw new BadRequestException({
          message: 'Ya existe un plan de cuentas para esta empresa',
          existingData: true,
        });
      }

      // Read and process Excel file (previous logic remains the same)
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
        empresa_id: empresaId,
      }));

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
    console.log(empresa_id);
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
