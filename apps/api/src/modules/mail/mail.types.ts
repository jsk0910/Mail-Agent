import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";

export class OutboundAttachmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  filename!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  mimeType!: string;

  @IsString()
  @MinLength(1)
  contentBase64!: string;
}

class SendMailBaseDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  to!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  cc?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsEmail({}, { each: true })
  bcc?: string[];

  @IsString()
  @MinLength(1)
  @MaxLength(998)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50000)
  bodyText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100000)
  bodyHtml?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OutboundAttachmentDto)
  attachments?: OutboundAttachmentDto[];
}

export class ComposeMessageDto extends SendMailBaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(191)
  accountId!: string;
}

export class ReplyMessageDto extends SendMailBaseDto {}

export class ForwardMessageDto extends SendMailBaseDto {}

export class UpdateMessageReadStateDto {
  @IsBoolean()
  isRead!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class UpdateMessageArchiveStateDto {
  @IsBoolean()
  isArchived!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class DeleteMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ApplyMessageLabelDto {
  @IsString()
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RetryMessageActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
