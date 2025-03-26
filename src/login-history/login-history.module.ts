import { Module } from '@nestjs/common';
import { LoginHistoryService } from './login-history.service';
import { LoginHistoryController } from './login-history.controller';
import { LoginHistory } from './entities/login-history.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([LoginHistory])],
  controllers: [LoginHistoryController],
  providers: [LoginHistoryService],
})
export class LoginHistoryModule {}

