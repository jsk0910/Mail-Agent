import { Injectable, NotFoundException } from "@nestjs/common";
import { AuthType, MailProvider, SyncStatus } from "@prisma/client";
import { Account, MailProviderKind } from "@mail-agent/shared";

import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { EncryptionService } from "../../common/security/encryption.service";
import { AccountsRepository } from "./accounts.repository";
import { toSharedAccount } from "./accounts.mapper";
import { CreateAccountDto, OnboardImapAccountDto } from "./accounts.types";

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly encryptionService: EncryptionService
  ) {}

  async list(userContext: AuthenticatedUserContext): Promise<Account[]> {
    const accounts = await this.accountsRepository.listForUser(userContext);

    return accounts.map(toSharedAccount);
  }

  async findById(userContext: AuthenticatedUserContext, accountId: string): Promise<Account> {
    const account = await this.accountsRepository.findByIdForUser(userContext, accountId);

    if (!account) {
      throw new NotFoundException(`Account ${accountId} was not found.`);
    }

    return toSharedAccount(account);
  }

  async create(userContext: AuthenticatedUserContext, input: CreateAccountDto): Promise<Account> {
    const account = await this.accountsRepository.createForUser(userContext, {
      provider: input.provider as MailProvider,
      email: input.email,
      displayName: input.displayName,
      authType: input.authType as AuthType,
      passwordEncrypted: input.password
        ? this.encryptionService.encrypt(input.password)
        : undefined,
      accessTokenEncrypted: input.accessToken
        ? this.encryptionService.encrypt(input.accessToken)
        : undefined,
      refreshTokenEncrypted: input.refreshToken
        ? this.encryptionService.encrypt(input.refreshToken)
        : undefined
    });

    return toSharedAccount(account);
  }

  async onboardImap(
    userContext: AuthenticatedUserContext,
    input: OnboardImapAccountDto
  ): Promise<Account> {
    const account = await this.accountsRepository.createForUser(userContext, {
      provider: MailProvider.imap,
      email: input.email,
      displayName: input.displayName,
      authType: AuthType.password,
      providerConfig: {
        imap: {
          host: input.imap.host,
          port: input.imap.port,
          secure: input.imap.secure,
          username: input.imap.username || input.email
        },
        smtp: {
          host: input.smtp.host,
          port: input.smtp.port,
          secure: input.smtp.secure,
          username: input.smtp.username || input.email
        }
      },
      passwordEncrypted: this.encryptionService.encrypt(input.password),
      smtpPasswordEncrypted: input.smtp.password
        ? this.encryptionService.encrypt(input.smtp.password)
        : undefined
    });

    return toSharedAccount(account);
  }

  async updateSyncStatus(
    userContext: AuthenticatedUserContext,
    accountId: string,
    syncStatus: SyncStatus
  ): Promise<Account> {
    const account = await this.accountsRepository.updateSyncStatusForUser(
      userContext,
      accountId,
      syncStatus
    );

    if (!account) {
      throw new NotFoundException(`Account ${accountId} was not found.`);
    }

    return toSharedAccount(account);
  }
}
