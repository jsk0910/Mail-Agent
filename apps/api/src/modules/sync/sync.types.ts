import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { SyncJobInput, SyncMode, SyncTrigger } from "@mail-agent/shared";

class SyncCursorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  gmailHistoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  imapUidValidity?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  imapLastUid?: number;
}

export class CreateSyncJobDto implements SyncJobInput {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  accountId!: string;

  @IsIn(["initial", "incremental", "resync"])
  mode!: SyncMode;

  @IsIn(["manual", "scheduled", "oauth_callback", "reconnect"])
  trigger!: SyncTrigger;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SyncCursorDto)
  cursor?: SyncCursorDto;
}
