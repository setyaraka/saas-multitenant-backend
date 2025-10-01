# Multi-Tenant Backend (NestJS + Prisma)

## Description
This backend is the foundation for a **multi-tenant SaaS** application, built with **NestJS** and **PostgreSQL (Prisma ORM)**.  
It provides **multi-tenant authentication**, **user-tenant memberships with role-based access control**, and **tenant-specific configurations** (theme, currency, font, domain, density).  

### Key Features
- **Authentication** with register, login, and JWT token issuance.  
- **Multi-Tenant Memberships**: one user can belong to multiple tenants with different roles (owner/admin/manager/staff/viewer).  
- **Assume Tenant Flow**: exchange a `userToken` for a `tenantToken` to access tenant-scoped APIs.  
- **Tenant Configurations**: store and update tenant-level UI settings (`theme`, `brand`, `locale`, `ui`) via `GET/PATCH` APIs.  
- **RBAC Guards**: access validation based on membership roles.  
- **Extensible**: easy to extend with new features (orders, payments, audit logging).  

---

## Project Structure
```
src/
├─ main.ts
├─ app.module.ts
├─ auth/ # login, register, assume-tenant
├─ tenants/ # tenant resolution (slug/domain)
├─ members/ # membership & roles
├─ configs/ # tenant config (theme, currency, etc.)
├─ common/ # guards, decorators, interceptors
└─ prisma/ # Prisma schema & service
```
---

## Database Schema (Prisma)
```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  memberships  Membership[]
}

model Tenant {
  id        String   @id @default(uuid())
  slug      String   @unique
  name      String
  domain    String?  @unique
  members   Membership[]
  config    TenantConfig?
}

model Membership {
  userId   String
  tenantId String
  role     Role

  user     User   @relation(fields: [userId], references: [id])
  tenant   Tenant @relation(fields: [tenantId], references: [id])

  @@id([userId, tenantId])
}

enum Role {
  owner
  admin
  manager
  staff
  viewer
}

model TenantConfig {
  tenantId   String   @id
  overrides  Json     @default("{}")
  version    Int      @default(1)
  updatedBy  String?
  updatedAt  DateTime @updatedAt
  tenant     Tenant   @relation(fields: [tenantId], references: [id])
}
```
## Main Endpoints
### Auth

- POST /auth/register → register a new user and assign them to a tenant.
- POST /auth/login → authenticate and return a userToken.
- POST /auth/assume-tenant-by-id → exchange userToken → tenantToken for tenant-scoped access.

### Tenant Config

- GET /tenants/:slug/config → fetch tenant config.
- PATCH /tenants/:slug/config → update config (colors, font, currency, density, domain, etc.).

### Supports optimistic concurrency with If-Match: <version> header.

### Membership
- GET /memberships/me → list tenants and roles for the current user.

## Getting Started

### Clone repo & install dependencies:
```
pnpm install
```

### Configure .env:
```
DATABASE_URL="postgresql://user:password@localhost:5432/multitenant"
JWT_SECRET="supersecret"
```

### Run migrations:
```
npx prisma migrate dev
Start dev server:
pnpm start:dev
```




