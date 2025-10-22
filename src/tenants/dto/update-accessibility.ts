import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAccessibilityDto {
  @IsOptional()
  @IsString()
  fontSize?: string;

  @IsOptional()
  @IsBoolean()
  reduceMotion?: boolean;
}
