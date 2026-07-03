import { Injectable } from "@nestjs/common";
import {
  Account,
  GmailProviderConfig,
  ImapProviderConfig,
  MailProviderKind
} from "@mail-agent/shared";

import { GmailConnector } from "./connectors/gmail.connector";
import { ImapConnector } from "./connectors/imap.connector";
import {
  GmailProviderContext,
  ImapProviderContext,
  MailProvider
} from "./mail-provider";
import { ProviderConfigService } from "./provider-config.service";

export type ResolvedProviderAccount =
  | (GmailProviderContext & {
      provider: GmailConnector;
    })
  | (ImapProviderContext & {
      provider: ImapConnector;
    });

@Injectable()
export class ProviderRegistryService {
  constructor(
    private readonly gmailConnector: GmailConnector,
    private readonly imapConnector: ImapConnector,
    private readonly providerConfigService: ProviderConfigService
  ) {}

  resolve(provider: Account["provider"]): MailProvider {
    switch (provider) {
      case MailProviderKind.GMAIL:
        return this.gmailConnector;
      case MailProviderKind.IMAP:
        return this.imapConnector;
      default:
        throw new Error(`No provider registered for ${provider}`);
    }
  }

  resolveAccount(account: Account): ResolvedProviderAccount {
    switch (account.provider) {
      case MailProviderKind.GMAIL:
        return {
          provider: this.gmailConnector,
          providerKind: MailProviderKind.GMAIL,
          account,
          config: this.providerConfigService.parseGmailConfig(account)
        };
      case MailProviderKind.IMAP:
        return {
          provider: this.imapConnector,
          providerKind: MailProviderKind.IMAP,
          account,
          config: this.providerConfigService.parseImapConfig(account)
        };
      default:
        throw new Error(`No provider account resolver registered for ${account.provider}`);
    }
  }
}
