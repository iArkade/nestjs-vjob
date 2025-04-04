import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateLoginHistoryDto } from './dto/create-login-history.dto';
import { UpdateLoginHistoryDto } from './dto/update-login-history.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginHistory } from './entities/login-history.entity';
import { Repository } from 'typeorm';
import { UAParser } from 'ua-parser-js';
import { Request } from 'express';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Injectable()
export class LoginHistoryService {

  constructor(
    @InjectRepository(LoginHistory)
    private readonly loginHistoryRepository: Repository<LoginHistory>,
  ) { }

  async saveUserLogin(
    request: Request,
    createLoginHistoryDTO: CreateLoginHistoryDto,
  ): Promise<LoginHistory> {

    try {
      // Capturar la IP del usuario (considerando proxys)
      const forwarded = request.headers['x-forwarded-for'] as string;
      let ip =
        forwarded?.split(',')[0]?.trim() ||
        request.socket?.remoteAddress ||
        'IP not found';

      // Limpiar IPv6 si viene como "::ffff:192.168.1.10"
      if (ip?.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
      }

      // Capturar el User-Agent
      const userAgent = request.headers['user-agent'] || 'Unknown';

      // Parsear la información del navegador y SO
      const parser = new UAParser(userAgent);
      const browser = parser.getBrowser().name || 'Unknown Browser';
      const os = `${parser.getOS().name} ${parser.getOS().version}` || 'Unknown OS';

      // Crear y guardar el registro
      const loginEntry = this.loginHistoryRepository.create({
        ip,
        browser,
        os,
        userId: createLoginHistoryDTO.userId,
        userName: createLoginHistoryDTO.userName,
      });

      return await this.loginHistoryRepository.save(loginEntry);
    } catch (error) {
      throw new InternalServerErrorException('Error al guardar el login');

    }
  }

  async getLoginHistory(
    paginationQuery: PaginationQueryDto,
  ): Promise<{ data: LoginHistory[]; total: number }> {
    const { limit = 10, offset = 0 } = paginationQuery;
  
    const safeOffset = Math.max(0, offset);


    const [data, total] = await this.loginHistoryRepository.findAndCount({
      order: { timestamp: 'DESC' },
      skip: safeOffset,
      take: limit,
    });
  
    return { data, total };
  }
}


