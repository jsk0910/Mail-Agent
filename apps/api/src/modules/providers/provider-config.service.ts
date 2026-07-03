import { BadRequestException, Injectable } from "@nestjs/common";
import {
  Account,
  GmailProviderConfig,
  ImapConnectionConfig,
  ImapProviderConfig,
  MailProviderKind,
  SmtpConnectionConfig
} from "@mail-agent/shared";

@Injectable()
export class ProviderConfigService {
  parseGmailConfig(account: Account): GmailProviderConfig {
    if (account.provider !== MailProviderKind.GMAIL) {
      throw new BadRequestException("Account is not a Gmail account.");
    }

    const raw = this.asRecord(account.providerConfig);
    if (!raw) {
      return {};
    }

    return {
      gmailProfile: this.asRecord(raw.gmailProfile)
        ? {
            id: this.asOptionalString(this.asRecord(raw.gmailProfile)?.id),
            email: this.asOptionalString(this.asRecord(raw.gmailProfile)?.email)
          }
        : undefined,
      oauth: this.asRecord(raw.oauth)
        ? {
            scope: this.asOptionalString(this.asRecord(raw.oauth)?.scope),
            tokenType: this.asOptionalString(this.asRecord(raw.oauth)?.tokenType),
            expiresIn: this.asOptionalNumber(this.asRecord(raw.oauth)?.expiresIn)
          }
        : undefined
    };
  }

  parseImapConfig(account: Account): ImapProviderConfig {
    if (account.provider !== MailProviderKind.IMAP) {
      throw new BadRequestException("Account is not an IMAP account.");
    }

    const raw = this.asRecord(account.providerConfig);
    const imap = this.parseRequiredConnection(
      this.asRecord(raw?.imap),
      "IMAP providerConfig.imap is required."
    );
    const smtp = raw?.smtp ? this.parseOptionalConnection(this.asRecord(raw.smtp), "smtp") : undefined;

    return { imap, smtp };
  }

  private parseRequiredConnection(
    raw: Record<string, unknown> | undefined,
    errorMessage: string
  ): ImapConnectionConfig {
    if (!raw) {
      throw new BadRequestException(errorMessage);
    }

    return {
      host: this.requireString(raw.host, "Connection host is required."),
      port: this.requirePositiveNumber(raw.port, "Connection port must be a positive number."),
      secure: this.requireBoolean(raw.secure, "Connection secure must be a boolean."),
      username: this.requireString(raw.username, "Connection username is required.")
    };
  }

  private parseOptionalConnection(
    raw: Record<string, unknown> | undefined,
    label: string
  ): SmtpConnectionConfig | undefined {
    if (!raw) {
      return undefined;
    }

    return {
      host: this.requireString(raw.host, `${label} host is required.`),
      port: this.requirePositiveNumber(raw.port, `${label} port must be a positive number.`),
      secure: this.requireBoolean(raw.secure, `${label} secure must be a boolean.`),
      username: this.requireString(raw.username, `${label} username is required.`)
    };
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private asOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  private asOptionalNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
  }

  private requireString(value: unknown, message: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new BadRequestException(message);
    }

    return value;
  }

  private requirePositiveNumber(value: unknown, message: string): number {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(message);
    }

    return value;
  }

  private requireBoolean(value: unknown, message: string): boolean {
    if (typeof value !== "boolean") {
      throw new BadRequestException(message);
    }

    return value;
  }
}
