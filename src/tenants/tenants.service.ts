import { Injectable } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateAppearanceDto } from 'src/auth/dto/update-appearance.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DnsStatus, Prisma, RoleCode } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  create(createTenantDto: CreateTenantDto) {
    return 'This action adds a new tenant';
  }

  findAll() {
    return `This action returns all tenants`;
  }

  findOne(id: number) {
    return `This action returns a #${id} tenant`;
  }

  update(id: number, updateTenantDto: UpdateTenantDto) {
    return `This action updates a #${id} tenant`;
  }

  remove(id: number) {
    return `This action removes a #${id} tenant`;
  }

  // tenants.service.ts
  //   async updateAppearance(tenantId: string, dto: UpdateAppearanceDto) {
  //     await this.prisma.$transaction(async (tx) => {
  //       await tx.tenantBrand.upsert({
  //         where: { tenantId },
  //         create: {
  //           tenantId,
  //           brandName: dto.brandName,
  //           primary: dto.primary,
  //           accent: dto.accent,
  //           logoUrl: dto.logoUrl,
  //         },
  //         update: {
  //           brandName: dto.brandName,
  //           primary: dto.primary,
  //           accent: dto.accent,
  //           logoUrl: dto.logoUrl,
  //         },
  //       });
  //       await tx.tenantTheme.upsert({
  //         where: { tenantId },
  //         create: {
  //           tenantId,
  //           mode: dto.mode as any,
  //           density: dto.density as any,
  //           font: dto.font,
  //         },
  //         update: {
  //           mode: dto.mode as any,
  //           density: dto.density as any,
  //           font: dto.font,
  //         },
  //       });
  //       await tx.auditLog.create({
  //         data: { tenantId, action: 'SETTINGS.APPEARANCE.UPDATE', meta: dto },
  //       });
  //     });
  //     return { ok: true };
  //   }
  stripUndefined<T extends object>(obj: T) {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    );
  }

  async updateAppearance(tenantId: string, dto: UpdateAppearanceDto) {
    const meta: Prisma.InputJsonValue = this.stripUndefined({
      brandName: dto.brandName,
      primary: dto.primary,
      accent: dto.accent,
      logoUrl: dto.logoUrl,
      mode: dto.mode,
      density: dto.density,
      font: dto.font,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.tenantBrand.upsert({
        where: { tenantId },
        create: {
          tenantId,
          brandName: dto.brandName,
          primary: dto.primary,
          accent: dto.accent,
          logoUrl: dto.logoUrl,
        },
        update: {
          brandName: dto.brandName,
          primary: dto.primary,
          accent: dto.accent,
          logoUrl: dto.logoUrl,
        },
      });
      await tx.tenantTheme.upsert({
        where: { tenantId },
        create: {
          tenantId,
          mode: dto.mode as any,
          density: dto.density as any,
          font: dto.font,
        },
        update: {
          mode: dto.mode as any,
          density: dto.density as any,
          font: dto.font,
        },
      });
      await tx.auditLog.create({
        data: { tenantId, action: 'SETTINGS.APPEARANCE.UPDATE', meta },
      });
    });
    return { ok: true };
  }

  async getCapabilities(tenantId: string, role: RoleCode) {
    const rows = await this.prisma.tenantRolePermission.findMany({
      where: { tenantId, role },
      select: { perm: true },
    });
    return { role, perms: rows.map((r) => r.perm) };
  }

  async updateLocalization(
    tenantId: string,
    dto: { language?: string; timezone?: string; currency?: string },
  ) {
    const meta: Prisma.InputJsonValue = this.stripUndefined(dto);
    await this.prisma.$transaction(async (tx) => {
      await tx.tenantLocalization.upsert({
        where: { tenantId },
        create: { tenantId, ...dto },
        update: { ...dto },
      });
      await tx.auditLog.create({
        data: { tenantId, action: 'SETTINGS.LOCALIZATION.UPDATE', meta },
      });
    });
    return { ok: true };
  }

  async updateDomain(
    tenantId: string,
    dto: { domain?: string; autoHttps?: boolean },
  ) {
    const existing = await this.prisma.tenantDomain.findUnique({
      where: { tenantId },
    });
    const domainChanged =
      dto.domain !== undefined && dto.domain !== existing?.domain;

    const data = {
      domain: dto.domain ?? existing?.domain ?? null,
      autoHttps: dto.autoHttps ?? existing?.autoHttps ?? true,
      dnsStatus: domainChanged
        ? DnsStatus.VERIFYING
        : (existing?.dnsStatus ?? DnsStatus.NOT_VERIFIED),
      verifiedAt: domainChanged ? null : (existing?.verifiedAt ?? null),
    };

    const meta: Prisma.InputJsonValue = this.stripUndefined({
      before: existing,
      after: data,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.tenantDomain.upsert({
        where: { tenantId },
        create: { tenantId, ...data },
        update: { ...data },
      });
      await tx.auditLog.create({
        data: { tenantId, action: 'SETTINGS.DOMAIN.UPDATE', meta },
      });
    });

    return { ok: true, dnsStatus: data.dnsStatus };
  }

  async updateLogoUrl(tenantId: string, logoUrl: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.tenantBrand.upsert({
        where: { tenantId },
        create: { tenantId, logoUrl },
        update: { logoUrl },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          action: 'SETTINGS.BRAND.LOGO.UPLOAD',
          meta: { logoUrl },
        },
      });
    });
    return { ok: true, logoUrl };
  }
}
