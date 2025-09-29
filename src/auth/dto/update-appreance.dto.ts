export class UpdateAppearanceDto {
  [key: string]: unknown;
  brandName?: string;
  primary?: string;
  accent?: string;
  logoUrl?: string;
  mode?: 'LIGHT' | 'DARK' | 'SYSTEM';
  density?: 'COMPACT' | 'COMFORTABLE';
  font?: string;
}
