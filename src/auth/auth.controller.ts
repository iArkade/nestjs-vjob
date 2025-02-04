import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogoutDto } from './dtos/logout.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
     constructor(private readonly authService: AuthService) { }

     @Post('register')
     register(@Body() registerDto: RegisterDto) {
          return this.authService.registrarUser(registerDto);
     }

     @Post('login')
     login(@Body() loginDto: LoginDto) {
          return this.authService.login(loginDto);
     }

     @Post('logout')
     @UseGuards(JwtAuthGuard)
     async logout(@Req() req) {
          const token = req.headers.authorization.split(' ')[1];
          const userId = req.user.id; 
          
          return await this.authService.logout(userId, token);
     }

}