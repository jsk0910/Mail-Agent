import { MailComposerPayload } from "@mail-agent/shared";
import { IsArray, IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class SendSmtpTestMailDto {
  @IsOptional()
  @IsEmail()
  to?: string;
}

export interface SmtpResolvedEnvelope {
  transportHost: string;
  transportPort: number;
  transportSecure: boolean;
  username: string;
  from: string;
}

export interface SmtpPreparedMessage extends MailComposerPayload {
  to: string[];
  from: string;
}
