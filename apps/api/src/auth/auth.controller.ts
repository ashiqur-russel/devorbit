import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginEmailDto } from './dto/login-email.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.registerWithOrganization(dto);
    return { token: this.authService.signToken(String(user._id)) };
  }

  @Post('login')
  async loginEmail(@Body() dto: LoginEmailDto) {
    const user = await this.authService.loginWithEmail(dto.email, dto.password);
    return { token: this.authService.signToken(String(user._id)) };
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res) {
    const token = this.authService.signToken(req.user._id.toString());
    const webUrl = this.config.get<string>('WEB_URL') || 'http://localhost:3000';
    res.redirect(`${webUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req) {
    return req.user;
  }
}
