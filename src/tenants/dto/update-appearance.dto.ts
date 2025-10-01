import { IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AccessibilityDto {
  @IsOptional() @IsBoolean() reduceMotion?: boolean;
  @IsOptional() @IsIn(['small', 'normal', 'large']) fontSize?: 'small'|'normal'|'large';
}

export class UpdateAppearanceDto {
  @IsOptional() @IsString() brandName?: string;
  @IsOptional() @IsString() primaryColor?: string;  // map → primary
  @IsOptional() @IsString() accent?: string;        // map → accent
  @IsOptional() @IsString() logoUrl?: string;       // biasanya di-set via upload

  @IsOptional() @IsIn(['LIGHT','DARK','SYSTEM']) mode?: 'LIGHT'|'DARK'|'SYSTEM';
  @IsOptional() @IsIn(['COMPACT','COMFORTABLE']) density?: 'COMPACT'|'COMFORTABLE';
  @IsOptional() @IsString() fontFamily?: string;    // map → font

  @IsOptional() @ValidateNested() @Type(() => AccessibilityDto)
  accessibility?: AccessibilityDto;
}
