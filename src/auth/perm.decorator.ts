import { SetMetadata } from '@nestjs/common';

type PermOpt = 'USERS_MANAGE' | 'MENU_MANAGE' | 'ORDERS_READ' | 'ORDERS_UPDATE';

export const RequirePerm = (
  perm: PermOpt,
) => SetMetadata('perm', perm);

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class PermGuard implements CanActivate {
  constructor(
    private refl: Reflector,
    private prisma: PrismaService,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    const perm = this.refl.get<string>('perm', ctx.getHandler());
  if (!perm) return true;
    const req = ctx.switchToHttp().getRequest();
    const { tenantId, role } = req.user || {};
    if (!tenantId || !role) throw new ForbiddenException('No tenant context');
    const ok = await this.prisma.tenantRolePermission.findUnique({
      where: { tenantId_role_perm: { tenantId, role, perm: perm as PermOpt } },
    });
    if (!ok && role !== "OWNER") throw new ForbiddenException('Insufficient permission');
    return true;
  }
}
