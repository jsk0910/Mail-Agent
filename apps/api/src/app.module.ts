import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";

import { UserContextGuard } from "./common/auth/user-context.guard";
import { EncryptionService } from "./common/security/encryption.service";
import { AppConfigModule } from "./config/app-config.module";
import { GoogleOAuthController } from "./modules/auth/google-oauth.controller";
import { GoogleOAuthService } from "./modules/auth/google-oauth.service";
import { SessionController } from "./modules/auth/session.controller";
import { SessionService } from "./modules/auth/session.service";
import { AccountsController } from "./modules/accounts/accounts.controller";
import { AccountsRepository } from "./modules/accounts/accounts.repository";
import { AccountsService } from "./modules/accounts/accounts.service";
import { DatabaseModule } from "./modules/database/database.module";
import { HealthController } from "./modules/health/health.controller";
import { MailController } from "./modules/mail/mail.controller";
import { MailAnalyzerService } from "./modules/mail/mail-analyzer.service";
import { MailMockSourceService } from "./modules/mail/mail-mock-source.service";
import { MailNormalizerService } from "./modules/mail/mail-normalizer.service";
import { MailRepository } from "./modules/mail/mail.repository";
import { MailService } from "./modules/mail/mail.service";
import { GmailConnector } from "./modules/providers/connectors/gmail.connector";
import { ImapConnector } from "./modules/providers/connectors/imap.connector";
import { SmtpSender } from "./modules/providers/connectors/smtp.sender";
import { ProviderConfigService } from "./modules/providers/provider-config.service";
import { ProviderRegistryService } from "./modules/providers/provider-registry.service";
import { SmtpController } from "./modules/providers/smtp.controller";
import { SyncController } from "./modules/sync/sync.controller";
import { SyncService } from "./modules/sync/sync.service";

import { AgentController } from "./modules/agent/agent.controller";
import { AgentService } from "./modules/agent/agent.service";
import { LocalLlmService } from "./modules/agent/local-llm.service";

@Module({
  imports: [AppConfigModule, DatabaseModule],
  controllers: [
    HealthController,
    AccountsController,
    MailController,
    GoogleOAuthController,
    SessionController,
    SyncController,
    SmtpController,
    AgentController
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserContextGuard
    },
    AccountsRepository,
    AccountsService,
    EncryptionService,
    GoogleOAuthService,
    SessionService,
    MailAnalyzerService,
    MailMockSourceService,
    MailNormalizerService,
    MailRepository,
    MailService,
    SyncService,
    ProviderRegistryService,
    GmailConnector,
    ImapConnector,
    SmtpSender,
    ProviderConfigService,
    LocalLlmService,
    AgentService
  ]
})
export class AppModule {}
