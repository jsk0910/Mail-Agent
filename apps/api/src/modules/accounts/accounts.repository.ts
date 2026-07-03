import { Injectable } from "@nestjs/common";
import {
  Account as PrismaAccount,
  AuthType,
  MailProvider,
  Prisma,
  SyncStatus,
  User
} from "@prisma/client";
import { SyncCursor } from "@mail-agent/shared";

import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { PrismaService } from "../database/prisma.service";

export interface CreateAccountRecordInput {
  provider: MailProvider;
  email: string;
  displayName: string;
  authType: AuthType;
  providerConfig?: Prisma.InputJsonValue;
  passwordEncrypted?: string;
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
  smtpPasswordEncrypted?: string;
}

export interface UpdateAccountSyncCursorInput {
  syncCursor?: SyncCursor;
}

export interface UpdateAccountOAuthTokensInput {
  accessTokenEncrypted?: string;
  refreshTokenEncrypted?: string;
}

@Injectable()
export class AccountsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userContext: AuthenticatedUserContext): Promise<PrismaAccount[]> {
    const user = await this.ensureUser(userContext);

    return this.prisma.account.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }

  async findByIdForUser(
    userContext: AuthenticatedUserContext,
    accountId: string
  ): Promise<PrismaAccount | null> {
    const user = await this.ensureUser(userContext);

    return this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id
      }
    });
  }

  async createForUser(
    userContext: AuthenticatedUserContext,
    input: CreateAccountRecordInput
  ): Promise<PrismaAccount> {
    const user = await this.ensureUser(userContext);

    return this.prisma.account.create({
      data: {
        userId: user.id,
        provider: input.provider,
        email: input.email,
        displayName: input.displayName,
        authType: input.authType,
        providerConfig: input.providerConfig,
        syncCursor: undefined,
        passwordEncrypted: input.passwordEncrypted,
        accessTokenEncrypted: input.accessTokenEncrypted,
        refreshTokenEncrypted: input.refreshTokenEncrypted,
        smtpPasswordEncrypted: input.smtpPasswordEncrypted
      }
    });
  }

  async upsertForUser(
    userContext: AuthenticatedUserContext,
    input: CreateAccountRecordInput
  ): Promise<PrismaAccount> {
    const user = await this.ensureUser(userContext);
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        userId: user.id,
        provider: input.provider,
        email: input.email
      }
    });

    if (!existingAccount) {
      return this.createForUser(userContext, input);
    }

    return this.prisma.account.update({
      where: {
        id: existingAccount.id
      },
      data: {
        displayName: input.displayName,
        authType: input.authType,
        providerConfig:
          input.providerConfig ??
          (existingAccount.providerConfig === null ? undefined : existingAccount.providerConfig),
        passwordEncrypted: input.passwordEncrypted ?? existingAccount.passwordEncrypted,
        accessTokenEncrypted: input.accessTokenEncrypted ?? existingAccount.accessTokenEncrypted,
        refreshTokenEncrypted:
          input.refreshTokenEncrypted ?? existingAccount.refreshTokenEncrypted,
        smtpPasswordEncrypted:
          input.smtpPasswordEncrypted ?? existingAccount.smtpPasswordEncrypted
      }
    });
  }

  async updateSyncStatusForUser(
    userContext: AuthenticatedUserContext,
    accountId: string,
    syncStatus: SyncStatus
  ): Promise<PrismaAccount | null> {
    const account = await this.findByIdForUser(userContext, accountId);

    if (!account) {
      return null;
    }

    return this.prisma.account.update({
      where: {
        id: accountId
      },
      data: {
        syncStatus,
        lastSyncedAt: syncStatus === SyncStatus.idle ? new Date() : account.lastSyncedAt
      }
    });
  }

  async updateSyncCursorForUser(
    userContext: AuthenticatedUserContext,
    accountId: string,
    input: UpdateAccountSyncCursorInput
  ): Promise<PrismaAccount | null> {
    const account = await this.findByIdForUser(userContext, accountId);

    if (!account) {
      return null;
    }

    return this.prisma.account.update({
      where: {
        id: accountId
      },
      data: {
        syncCursor: input.syncCursor as Prisma.InputJsonValue | undefined
      }
    });
  }

  async updateOAuthTokens(
    accountId: string,
    input: UpdateAccountOAuthTokensInput
  ): Promise<PrismaAccount | null> {
    const account = await this.prisma.account.findUnique({
      where: {
        id: accountId
      }
    });

    if (!account) {
      return null;
    }

    return this.prisma.account.update({
      where: {
        id: accountId
      },
      data: {
        accessTokenEncrypted: input.accessTokenEncrypted ?? account.accessTokenEncrypted,
        refreshTokenEncrypted: input.refreshTokenEncrypted ?? account.refreshTokenEncrypted
      }
    });
  }

  private ensureUser(userContext: AuthenticatedUserContext): Promise<User> {
    return this.prisma.user.upsert({
      where: {
        email: userContext.email
      },
      update: {
        name: userContext.name
      },
      create: {
        email: userContext.email,
        name: userContext.name
      }
    });
  }
}
