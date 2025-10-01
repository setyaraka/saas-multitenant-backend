import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const tenantId = req.params.tenantId;

    if (!user || !user.tenantId || user.tenantId !== tenantId) {
      throw new ForbiddenException('No access to this tenant');
    }
    return true;
  }
}
