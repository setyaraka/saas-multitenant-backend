import { PrismaClient, RoleCode  } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 1. Buat tenant pertama
  const tenant = await prisma.tenant.upsert({
    where: { key: 'alpha' },
    update: {},
    create: {
      key: 'alpha',
      name: 'Alpha Coffee',
    },
  });

  // 2. Buat user owner
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'owner@alpha.coffee' },
    update: {},
    create: {
      email: 'owner@alpha.coffee',
      name: 'Owner Alpha',
      passwordHash: password,
    },
  });

  // 3. Membership user ↔ tenant
  await prisma.membership.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: RoleCode.OWNER,
    },
  });

  // 4. Default Settings (appearance, theme, localization)
  await prisma.tenantBrand.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      brandName: 'Alpha Coffee',
      primary: '#0ea5e9',
      accent: '#f59e0b',
      logoUrl: 'https://placehold.co/200x200?text=Alpha+Coffee',
    },
  });

  await prisma.tenantTheme.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      mode: 'LIGHT',
      density: 'COMFORTABLE',
      font: 'Inter',
    },
  });

  await prisma.tenantLocalization.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      language: 'id-ID',
      timezone: 'Asia/Jakarta',
      currency: 'IDR',
    },
  });

  console.log('✅ Seeding selesai: tenant Alpha + owner user dibuat.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
