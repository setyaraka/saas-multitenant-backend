import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RoleCode } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return null;
    const ok = await bcrypt.compare(pass, user.passwordHash);
    if (!ok) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async loginUser(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return { access_token: this.jwtService.sign(payload) };
  }

  async assumeTenant(userId: string, tenantKey: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, tenant: { key: tenantKey } },
      include: { tenant: true },
    });
    if (!membership) throw new UnauthorizedException('No access to tenant');

    const payload = {
      sub: userId,
      email: undefined,
      tenantId: membership.tenantId,
      role: membership.role,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async register(data: {
    email: string;
    password: string;
    tenantKey: string;
    role: RoleCode;
  }) {
    const exists = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (exists) throw new ConflictException('Email already used');

    const hashed = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { email: data.email, passwordHash: hashed },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { key: data.tenantKey },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    await this.prisma.membership.create({
      data: { userId: user.id, tenantId: tenant.id, role: data.role },
    });

    const { passwordHash, ...safe } = user;
    return safe;
  }

  async listMyTenants(userId: string) {
    const rows = await this.prisma.membership.findMany({
      where: { userId },
      include: { tenant: true },
    });
    return rows.map((r) => ({
      tenantId: r.tenantId,
      key: r.tenant.key,
      name: r.tenant.name,
      role: r.role,
    }));
  }

  async assumeTenantById(userId: string, tenantId: string) {
    const m = await this.prisma.membership.findUnique({
      where: { userId_tenantId: { userId, tenantId } },
    });
    if (!m) throw new UnauthorizedException('No access to tenant');
    const payload = {
      sub: userId,
      email: (await this.prisma.user.findUnique({ where: { id: userId } }))!
        .email,
      tenantId: m.tenantId,
      role: m.role,
    };
    return { access_token: this.jwtService.sign(payload) };
  }

  async getSettings(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        brand: true,
        theme: true,
        i18n: true,
        domain: true,
        billing: { include: { paymentMethod: true } },
        integrations: true,
        security: true,
        compliance: true,
      },
    });
    if (!t) throw new NotFoundException('Tenant not found');
    return {
      id: t.id,
      key: t.key,
      name: t.name,
      appearance: {
        brandName: t.brand?.brandName,
        primary: t.brand?.primary,
        accent: t.brand?.accent,
        logoUrl: t.brand?.logoUrl,
        mode: t.theme?.mode,
        density: t.theme?.density,
        font: t.theme?.font,
      },
      localization: t.i18n,
      domain: t.domain,
      billing: t.billing && {
        plan: t.billing.plan,
        paymentMethod: t.billing.paymentMethod && {
          brand: t.billing.paymentMethod.brand,
          last4: t.billing.paymentMethod.last4,
          expMonth: t.billing.paymentMethod.expMonth,
          expYear: t.billing.paymentMethod.expYear,
        },
      },
      integrations: t.integrations,
      security: t.security,
      compliance: t.compliance,
    };
  }
}
