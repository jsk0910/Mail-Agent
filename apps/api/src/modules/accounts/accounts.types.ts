import { AuthType, MailProviderKind, SyncStatus } from "@mail-agent/shared";
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
  ValidateIf
} from "class-validator";
import { Type } from "class-transformer";

export class CreateAccountDto {
  @IsEnum(MailProviderKind)
  provider!: MailProviderKind;

  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @IsIn(["oauth", "password"])
  authType!: AuthType;

  @ValidateIf((dto: CreateAccountDto) => dto.authType === "password" || dto.password !== undefined)
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  password?: string;

  @ValidateIf(
    (dto: CreateAccountDto) => dto.authType === "oauth" || dto.accessToken !== undefined
  )
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  accessToken?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  refreshToken?: string;
}

export class UpdateAccountSyncStatusDto {
  @IsIn(["idle", "running", "error"])
  syncStatus!: SyncStatus;
}

class ImapConnectionSettingsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  host!: string;

  @Type(() => Number)
  @IsInt()
  port!: number;

  @Type(() => Boolean)
  @IsBoolean()
  secure!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  username?: string;
}

class SmtpConnectionSettingsDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  host!: string;

  @Type(() => Number)
  @IsInt()
  port!: number;

  @Type(() => Boolean)
  @IsBoolean()
  secure!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  password?: string;
}

export class OnboardImapAccountDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  displayName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  password!: string;

  @ValidateNested()
  @Type(() => ImapConnectionSettingsDto)
  imap!: ImapConnectionSettingsDto;

  @ValidateNested()
  @Type(() => SmtpConnectionSettingsDto)
  smtp!: SmtpConnectionSettingsDto;
}
