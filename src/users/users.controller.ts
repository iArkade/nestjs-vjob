import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, ValidationPipe } from '@nestjs/common';
import { CreateUserRequestDto } from './dtos/create.user.dto';
import { UsersService } from './users.service';
import { UpdateUserRequestDto } from './dtos/update.user.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
     constructor(
          private usersService: UsersService
     ) { }

     // @Get()
     // @ApiOperation({ summary: 'Get all users' })
     // @ApiResponse({ status: 200, description: 'User list successfully returned.' })
     // @ApiResponse({ status: 404, description: 'No users were found.' })
     // getUsers() {
     //      return this.usersService.getUsers();
     // }

     // @Get(':id')
     // @ApiOperation({ summary: 'Get a user by ID' })
     // @ApiParam({ name: 'id', type: 'number', description: 'User ID' })
     // @ApiResponse({ status: 200, description: 'User successfully returned.' })
     // @ApiResponse({ status: 404, description: 'User not found.' })
     // getUser(@Param('id', ParseIntPipe) id: number) {
     //      return this.usersService.getUser(id);
     // }

     // @Post()
     // @ApiOperation({ summary: 'Create a new user' })
     // @ApiResponse({ status: 201, description: 'User successfully created.' })
     // @ApiResponse({ status: 400, description: 'Bad Request.' })
     // @ApiResponse({ status: 409, description: 'Unique constraint violation.' })
     // createUser( @Body() createUserDto: CreateUserRequestDto ) {
     //      return  this.usersService.createUser(createUserDto);
     // }

     // @Delete(':id')
     // @ApiOperation({ summary: 'Delete a user by ID' })
     // @ApiParam({ name: 'id', type: 'number', description: 'User ID to be deleted' })
     // @ApiResponse({ status: 200, description: 'User successfully deleted.' })
     // @ApiResponse({ status: 404, description: 'User not found.' })
     // deleteUser(@Param('id', ParseIntPipe) id: number) {
     //      return  this.usersService.deleteUser(id);
     // }

     // @Put(':id')
     // @ApiOperation({ summary: 'Update a user by ID' })
     // @ApiParam({ name: 'id', type: 'number', description: 'User ID to be updated' })
     // @ApiResponse({ status: 200, description: 'User successfully updated.' })
     // @ApiResponse({ status: 404, description: 'User not found.' })
     // @ApiResponse({ status: 400, description: 'Validation failed' })
     // async updateUser(
     //      @Param('id', ParseIntPipe) id: number,
     //      @Body() updateUserDto: UpdateUserRequestDto,
     // ){
     //      return await this.usersService.updateUser(id, updateUserDto);
     // }
}

