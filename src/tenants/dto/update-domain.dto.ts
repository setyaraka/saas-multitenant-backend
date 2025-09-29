import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDomainDto {
  @IsOptional() @IsString() domain?: string;
  @IsOptional() @IsBoolean() autoHttps?: boolean;
}
