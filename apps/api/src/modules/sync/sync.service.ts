import { Injectable, NotFoundException } from "@nestjs/common";
import { MailProviderKind, SyncJobRecord } from "@mail-agent/shared";

import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { EncryptionService } from "../../common/security/encryption.service";
import { AccountsRepository } from "../accounts/accounts.repository";
import { toSharedAccount } from "../accounts/accounts.mapper";
import { MailMockSourceService } from "../mail/mail-mock-source.service";
import { MailNormalizerService } from "../mail/mail-normalizer.service";
import { MailRepository } from "../mail/mail.repository";
import { ProviderRegistryService } from "../providers/provider-registry.service";
import { CreateSyncJobDto } from "./sync.types";

@Injectable()
export class SyncService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly providerRegistryService: ProviderRegistryService,
    private readonly encryptionService: EncryptionService,
    private readonly mailMockSourceService: MailMockSourceService,
    private readonly mailNormalizerService: MailNormalizerService,
    private readonly mailRepository: MailRepository
  ) {}

  async createJob(
    user: AuthenticatedUserContext,
    input: CreateSyncJobDto
  ): Promise<SyncJobRecord> {
    const account = await this.accountsRepository.findByIdForUser(user, input.accountId);

    if (!account) {
      throw new NotFoundException(`Account ${input.accountId} was not found.`);
    }

    const sharedAccount = toSharedAccount(account);
    const resolvedProvider = this.providerRegistryService.resolveAccount(sharedAccount);
    const effectiveCursor = input.cursor ?? sharedAccount.syncCursor;
    let rawMessages = this.mailMockSourceService.listSourcesForAccount(
      input.accountId,
      resolvedProvider.providerKind
    );
    let nextCursor = effectiveCursor;

    switch (resolvedProvider.providerKind) {
      case MailProviderKind.GMAIL:
        {
          const result = await resolvedProvider.provider.listMessages(
            {
              ...resolvedProvider,
              credentials: {
                accessToken: account.accessTokenEncrypted
                  ? this.encryptionService.decrypt(account.accessTokenEncrypted)
                  : undefined,
                refreshToken: account.refreshTokenEncrypted
                  ? this.encryptionService.decrypt(account.refreshTokenEncrypted)
                  : undefined
              }
            },
            effectiveCursor
          );
          rawMessages = result.messages.map((source) => ({
            accountId: input.accountId,
            source
          }));
          nextCursor = result.nextCursor ?? nextCursor;
        }
        break;
      case MailProviderKind.IMAP:
        {
          const result = await resolvedProvider.provider.listMessages(
            {
              ...resolvedProvider,
              credentials: {
                password: account.passwordEncrypted
                  ? this.encryptionService.decrypt(account.passwordEncrypted)
                  : undefined
              }
            },
            effectiveCursor
          );
          rawMessages = result.messages.map((source) => ({
            accountId: input.accountId,
            source
          }));
          nextCursor = result.nextCursor ?? nextCursor;
        }
        break;
    }

    const normalizedRecords = rawMessages.map(({ accountId, source }) =>
      this.mailNormalizerService.normalizeMessage(sharedAccount.userId, accountId, source)
    );

    await this.mailRepository.persistNormalizedRecords(normalizedRecords);

    if (!nextCursor && rawMessages.length > 0) {
      nextCursor = this.mailNormalizerService.buildNextCursor(rawMessages[rawMessages.length - 1].source);
    }

    if (nextCursor) {
      await this.accountsRepository.updateSyncCursorForUser(user, input.accountId, {
        syncCursor: nextCursor
      });
    }

    const queuedAt = new Date().toISOString();

    return {
      jobId: `sync:${input.accountId}:${input.mode}:${Date.now()}`,
      userId: sharedAccount.userId,
      provider: resolvedProvider.providerKind,
      accountId: input.accountId,
      mode: input.mode,
      trigger: input.trigger,
      reason: input.reason,
      cursor: nextCursor,
      queuedAt
    };
  }
}
