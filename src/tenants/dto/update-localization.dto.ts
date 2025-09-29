import { IsOptional, IsString } from 'class-validator';

export class UpdateLocalizationDto {
  @IsOptional() @IsString() language?: string; // ex: "id-ID"
  @IsOptional() @IsString() timezone?: string; // ex: "Asia/Jakarta"
  @IsOptional() @IsString() currency?: string; // ex: "IDR"
}
