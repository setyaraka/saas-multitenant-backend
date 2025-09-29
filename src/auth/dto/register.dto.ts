import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;

  // kalau ingin langsung daftarkan ke tenant tertentu
  @IsOptional() @IsString() tenantKey?: string; // contoh: "alpha"
  @IsOptional() @IsString() role?: string; // OWNER | ADMIN | STAFF | VIEWER (opsional, default OWNER kalau buat tenant baru)
}
