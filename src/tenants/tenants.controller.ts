import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TenantGuard } from 'src/auth/tenant.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { PermGuard, RequirePerm } from 'src/auth/perm.decorator';
import { UpdateAppearanceDto } from 'src/auth/dto/update-appearance.dto';
import { UpdateLocalizationDto } from './dto/update-localization.dto';
import { UpdateDomainDto } from './dto/update-domain.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import path from 'path';
import { diskStorage } from 'multer';
import { UpdateIntegrationDto } from './dto/update-integration-dto';
import { SettingRequest } from './types';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(+id, updateTenantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(+id);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @Get(':tenantId/settings')
  getTenantSettings(@Param('tenantId') tenantId: string, @Req() req: SettingRequest) {
    return this.tenantsService.getSettings(tenantId, req.user.userId); 
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Patch(':tenantId/settings/appearance')
  @RequirePerm('USERS_MANAGE')
  updateAppearance(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateAppearanceDto,
  ) {
    return this.tenantsService.updateAppearance(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard)
  @Get(':tenantId/capabilities')
  getCapabilities(@Param('tenantId') tenantId: string, @Req() req: any) {
    return this.tenantsService.getCapabilities(tenantId, req.user.role);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, PermGuard)
  @Patch(':tenantId/settings/localization')
  @RequirePerm('USERS_MANAGE')
  updateLocalization(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateLocalizationDto,
  ) {
    return this.tenantsService.updateLocalization(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, PermGuard)
  @Patch(':tenantId/settings/domain')
  @RequirePerm('USERS_MANAGE')
  updateDomain(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateDomainDto,
  ) {
    return this.tenantsService.updateDomain(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, PermGuard)
  @Patch(':tenantId/settings/integration')
  @RequirePerm('USERS_MANAGE')
  updateIntegration(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.tenantsService.updateIntegration(tenantId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':tenantId/settings/profile')
  async updateMe(
    @Param('tenantId') tenantId: string,
    @Req() req: SettingRequest,
    @Body() dto: UpdateMeDto,
  ) {
    return this.tenantsService.updateMe(tenantId, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, TenantGuard, PermGuard)
  @Post(':tenantId/brand/logo')
  @RequirePerm('USERS_MANAGE')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const dir = path.join(
            process.cwd(),
            'uploads',
            'tenants',
            req.params.tenantId,
          );
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, 'logo' + ext.toLowerCase());
        },
      }),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/'))
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        cb(null, true);
      },
    }),
  )
  uploadLogo(
    @Param('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const logoUrl = `/uploads/tenants/${tenantId}/${file.filename}`;
    return this.tenantsService.updateLogoUrl(tenantId, logoUrl);
  }
}
