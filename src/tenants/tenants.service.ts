import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { DnsStatus, Prisma, RoleCode } from '@prisma/client';
import { UpdateAppearanceDto } from './dto/update-appearance.dto';

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
    const meta = this.stripUndefined({
      brandName: dto.brandName,
      primaryColor: dto.primaryColor, // <—
      accent: dto.accent,
      logoUrl: dto.logoUrl,
      mode: dto.mode,
      density: dto.density,
      fontFamily: dto.fontFamily,     // <—
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.tenantBrand.upsert({
        where: { tenantId },
        create: {
          tenantId,
          brandName: dto.brandName,
          primary: dto.primaryColor,
          accent: dto.accent,
          logoUrl: dto.logoUrl,
        },
        update: {
          brandName: dto.brandName,
          primary: dto.primaryColor,
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
          font: dto.fontFamily,
        },
        update: {
          mode: dto.mode as any,
          density: dto.density as any,
          font: dto.fontFamily,
        },
      });
      await tx.auditLog.create({
        data: { tenantId, action: 'SETTINGS.APPEARANCE.UPDATE', meta },
      });
    });
    return this.getSettings(tenantId);
  }

  async getCapabilities(tenantId: string, role: RoleCode) {
    const rows = await this.prisma.tenantRolePermission.findMany({
      where: { tenantId, role },
      select: { perm: true },
    });
    return { role, permissions: rows.map((r) => r.perm) };
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
    return this.getSettings(tenantId);
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

    const dataSetting = this.getSettings(tenantId);

    return { ...dataSetting, dnsStatus: data.dnsStatus };
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
    const dataSetting = this.getSettings(tenantId);
    return { ...dataSetting, logoUrl };
  }

  async getSettings(tenantId: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        brand: true, theme: true, i18n: true, domain: true,
      },
    });
    if (!t) throw new NotFoundException('Tenant not found');
  
    const dom = t.domain;
    const domain = dom ? {
      domain: dom.domain ?? null,
      status:
        dom.dnsStatus === DnsStatus.VERIFYING ? 'verifying' :
        dom.dnsStatus === DnsStatus.VERIFIED  ? 'active'    :
        dom.dnsStatus === DnsStatus.FAILED    ? 'failed'    : 'not_verified',
      autoHttps: dom.autoHttps,
      verifiedAt: dom.verifiedAt,
    } : null;
  
    return {
      appearance: {
        brandName: t.brand?.brandName ?? null,
        primaryColor: t.brand?.primary ?? null,
        accent: t.brand?.accent ?? null,
        logoUrl: t.brand?.logoUrl ?? null,
        mode: t.theme?.mode ?? null,           // 'LIGHT'|'DARK'|'SYSTEM'
        density: t.theme?.density ?? null,     // 'COMFORTABLE'|'COMPACT'
        fontFamily: t.theme?.font ?? null,
      },
      localization: {
        locale: t.i18n?.language ?? null,
        currency: t.i18n?.currency ?? null,
        timezone: t.i18n?.timezone ?? null,
      },
      domain,
      logoUrl: t.brand?.logoUrl ?? null,
    };
  }
}
