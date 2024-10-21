import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LogoutDto } from './dtos/logout.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {

     constructor(
          private readonly authService: AuthService
     ){}

     @Post('register')
     register( @Body() registerDto: RegisterDto ){
          return  this.authService.register(registerDto);
     }

     @Post('login')
     login( @Body() loginDto: LoginDto ){
          return this.authService.login(loginDto);
     }

     @Post('logout')
     async logout(@Body() logoutDto: LogoutDto, @Req() req) {
          const token = req.headers.authorization.split(' ')[1];  // Extrae el token del header
          return await this.authService.logout(logoutDto.userId, token);
     }
}

