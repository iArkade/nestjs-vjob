import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { LoginHistoryService } from './login-history.service';
import { CreateLoginHistoryDto } from './dto/create-login-history.dto';
import { UpdateLoginHistoryDto } from './dto/update-login-history.dto';
import { Request } from 'express';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('login-history')
export class LoginHistoryController {
  constructor(private readonly loginHistoryService: LoginHistoryService) { }

  @Post()
  async saveLogin(
    @Req() request: Request,
    @Body() body: CreateLoginHistoryDto,
  ) {
    return this.loginHistoryService.saveUserLogin(request, body);
  }

  @Get()
  async getHistory(@Query() pagination: PaginationQueryDto) {
    return this.loginHistoryService.getLoginHistory(pagination);
  }

}
