import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RoleCode } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: {
      email: string;
      password: string;
      tenantKey: string;
      role: RoleCode;
    },
  ) {
    return this.auth.register(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.auth.validateUser(body.email, body.password);
    if (!user) return { error: 'Invalid credentials' };
    return this.auth.loginUser(user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('assume-tenant')
  assumeTenant(@Body() body: { userId: string; tenantKey: string }) {
    return this.auth.assumeTenant(body.userId, body.tenantKey);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return { userId: req.user.userId, email: req.user.email };
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('me/tenants')
  async myTenants(@Req() req) {
    const memberships = await this.auth.listMyTenants(req.user.userId);
    return memberships;
  }

  @UseGuards(JwtAuthGuard)
  @Post('assume-tenant-by-id')
  @HttpCode(200)
  async assumeTenantById(@Req() req, @Body() body: { tenantId: string }) {
    return this.auth.assumeTenantById(req.user.userId, body.tenantId);
  }

}
