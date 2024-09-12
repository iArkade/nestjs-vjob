import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_KEY_PUBLIC'),
        //secret: process.env.JWT_KEY_PUBLIC,
        signOptions: { expiresIn: '1h' },
      }),
      
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
