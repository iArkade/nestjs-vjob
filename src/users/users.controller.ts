import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { AssignCompanyDto, CreateUserDto } from './dtos/create.user.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dtos/update.user.dto';
import { ApiTags } from '@nestjs/swagger';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { SystemRole } from './enums/role.enum';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('usuario')
@Controller('usuario')
export class UsersController {
     constructor(
          private usersService: UsersService
     ) { }

     @Post()
     @UseGuards(JwtAuthGuard, RoleGuard)
     @Roles(SystemRole.SUPERADMIN)
     async create(@Request() req, @Body() createUserDto: CreateUserDto) {
          return await this.usersService.create(createUserDto, req.user);
     }

     @Get()
     @UseGuards(JwtAuthGuard, RoleGuard)
     @Roles(SystemRole.SUPERADMIN)
     async findAll(@Request() req) {
          return await this.usersService.findAll(req.user);
     }

     @Get(':id')
     @UseGuards(JwtAuthGuard, RoleGuard)
     @Roles(SystemRole.SUPERADMIN)
     async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
          return await this.usersService.findOne(id, req.user);
     }

     @Put(':id')
     @UseGuards(JwtAuthGuard, RoleGuard)
     @Roles(SystemRole.SUPERADMIN)
     async update(
          @Param('id', ParseIntPipe) id: number,
          @Body() updateUserDto: UpdateUserDto,
          @Request() req,
     ) {          
          return await this.usersService.update(id, updateUserDto, req.user);
     }

     @Delete(':id')
     @UseGuards(JwtAuthGuard, RoleGuard)
     @Roles(SystemRole.SUPERADMIN)
     async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
          return await this.usersService.remove(id, req.user);
     }

     @Post(':userId/empresas')
     @UseGuards(JwtAuthGuard, RoleGuard)
     @Roles(SystemRole.SUPERADMIN)
     async assignCompany(
          @Param('userId', ParseIntPipe) userId: number,
          @Body() assignCompanyDto: AssignCompanyDto,
          @Request() req,
     ) {
          return await this.usersService.assignCompany(userId, assignCompanyDto, req.user);
     }

     @Delete(':userId/empresas/:empresaId')
     @UseGuards(JwtAuthGuard, RoleGuard)
     @Roles(SystemRole.SUPERADMIN)
     async removeCompany(
          @Param('userId', ParseIntPipe) userId: number,
          @Param('empresaId', ParseIntPipe) empresaId: number,
          @Request() req,
     ) {
          return await this.usersService.removeCompany(userId, empresaId, req.user);
     }
}

