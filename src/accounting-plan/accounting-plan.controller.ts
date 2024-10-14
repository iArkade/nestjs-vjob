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
  constructor(private readonly accountingPlanService: AccountingPlanService) {}

  @Post()
  async create(@Body() createAccountingPlanDto: CreateAccountingPlanDto | CreateAccountingPlanDto[]) {
    // Si es un solo objeto, lo convertimos en un array
    if (!Array.isArray(createAccountingPlanDto)) {
      createAccountingPlanDto = [createAccountingPlanDto];
    }
    return await this.accountingPlanService.createMany(createAccountingPlanDto);
  }

  // @Post('upload')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadFile(@UploadedFile() file: Express.Multer.File) {
  //   if (!file) {
  //     throw new BadRequestException('No file uploaded');
  //   }

  //   const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  //   const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  //   const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  //   // Convert the Excel data into DTOs
  //   const createAccountingPlanDtos = jsonData.map((row) => ({
  //     code: row[0], // Assuming 'code' is in the first column
  //     name: row[1], // Assuming 'name' is in the second column
  //   }));

  //   // Pass the parsed data to the service for bulk creation
  //   await this.accountingPlanService.createMany(createAccountingPlanDtos);

  //   return { message: 'File uploaded and data imported successfully' };
  // }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new BadRequestException('The Excel file is empty or contains only headers');
      }

      // Assume the first row contains headers
      const headers = jsonData[0] as string[];
      const codeIndex = headers.findIndex(header => header.toLowerCase() === 'code');
      const nameIndex = headers.findIndex(header => header.toLowerCase() === 'name');

      if (codeIndex === -1 || nameIndex === -1) {
        throw new BadRequestException('Invalid Excel structure. Missing "code" or "name" columns.');
      }

      // Convert the Excel data into DTOs, starting from the second row
      const createAccountingPlanDtos: CreateAccountingPlanDto[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const dto: CreateAccountingPlanDto = {
          code: row[codeIndex],
          name: row[nameIndex],
        };

        if (!dto.code || !dto.name) {
          throw new BadRequestException(`Invalid data in row ${i + 1}. Both code and name are required.`);
        }

        createAccountingPlanDtos.push(dto);
      }

      // Process data in batches of 100
      const batchSize = 100;
      let processedCount = 0;
      for (let i = 0; i < createAccountingPlanDtos.length; i += batchSize) {
        const batch = createAccountingPlanDtos.slice(i, i + batchSize);
        await this.accountingPlanService.createMany(batch);
        processedCount += batch.length;
      }

      return {
        message: 'File uploaded and data imported successfully',
        recordsProcessed: processedCount,
        totalRecords: createAccountingPlanDtos.length
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error processing Excel file:', error);
      throw new InternalServerErrorException('An error occurred while processing the file');
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
