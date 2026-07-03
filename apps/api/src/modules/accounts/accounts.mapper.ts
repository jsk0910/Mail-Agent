import { Account as PrismaAccount } from "@prisma/client";
import { Account, MailProviderKind, SyncCursor } from "@mail-agent/shared";

function toSyncCursor(value: unknown): SyncCursor | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as SyncCursor;
}

export function toSharedAccount(account: PrismaAccount): Account {
  return {
    id: account.id,
    userId: account.userId,
    provider: account.provider as MailProviderKind,
    email: account.email,
    displayName: account.displayName,
    authType: account.authType,
    providerConfig:
      account.providerConfig && typeof account.providerConfig === "object"
        ? (account.providerConfig as Record<string, unknown>)
        : undefined,
    syncCursor: toSyncCursor(account.syncCursor),
    syncEnabled: account.syncEnabled,
    syncStatus: account.syncStatus,
    lastSyncedAt: account.lastSyncedAt?.toISOString(),
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString()
  };
}
