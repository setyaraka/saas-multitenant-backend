import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateIntegrationDto {
  @IsOptional() @IsBoolean() slackEnabled?: boolean;
  @IsOptional() @IsBoolean() zapierEnabled?: boolean;
  @IsOptional() @IsString() webhookUrl?: string;
}
