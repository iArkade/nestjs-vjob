import {
     Body,
     Controller,
     Post,
     Req,
     UseGuards,
     Headers,
     UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
     constructor(private readonly authService: AuthService) { }

     @Post('register')
     @ApiOperation({ summary: 'Register a new superadmin' })
     @ApiResponse({
          status: 201,
          description: 'The superadmin has been successfully created.'
     })
     @ApiResponse({
          status: 409,
          description: 'Email already registered.'
     })
     register(@Body() registerDto: RegisterDto) {
          return this.authService.registrarUser(registerDto);
     }

     @Post('login')
     @ApiOperation({ summary: 'User login' })
     @ApiResponse({
          status: 200,
          description: 'User successfully logged in.'
     })
     @ApiResponse({
          status: 401,
          description: 'Invalid credentials.'
     })
     login(@Body() loginDto: LoginDto) {
          return this.authService.login(loginDto);
     }

     @Post('logout')
     @UseGuards(JwtAuthGuard)
     @ApiOperation({ summary: 'User logout' })
     @ApiResponse({
          status: 200,
          description: 'User successfully logged out.'
     })
     @ApiResponse({
          status: 401,
          description: 'Invalid or missing token.'
     })
     async logout(@Req() req, @Headers('authorization') authHeader: string) {
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
               throw new UnauthorizedException('Invalid or missing token');
          }

          const token = authHeader.split(' ')[1];
          if (!token) {
               throw new UnauthorizedException('Invalid token');
          }

          const userId = req.user.id;
          return await this.authService.logout(userId, token);
     }
}