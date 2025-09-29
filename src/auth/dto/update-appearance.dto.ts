import { IsHexColor, IsOptional, IsString } from 'class-validator';
export class UpdateAppearanceDto {
  @IsOptional() @IsString() brandName?: string;
  @IsOptional() @IsHexColor() primary?: string;
  @IsOptional() @IsHexColor() accent?: string;
  @IsOptional() @IsString() logoUrl?: string;
  @IsOptional() @IsString() mode?: 'LIGHT' | 'DARK' | 'SYSTEM';
  @IsOptional() @IsString() density?: 'COMPACT' | 'COMFORTABLE';
  @IsOptional() @IsString() font?: string;
}
