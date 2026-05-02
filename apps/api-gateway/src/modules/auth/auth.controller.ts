import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: Record<string, any>) {
    return this._authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: Record<string, any>) {
    return this._authService.login(dto);
  }
}
