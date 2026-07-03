import assert from "node:assert/strict";
import test from "node:test";
import { MailProvider, SyncStatus } from "@prisma/client";
import {
  MailProviderKind,
  type ProviderMessageSource,
  type ProviderSyncResult,
  type SyncCursor,
  type SyncJobInput
} from "@mail-agent/shared";

import { MailNormalizerService } from "../mail/mail-normalizer.service";
import { SyncService } from "./sync.service";

type FakeAccountRecord = {
  id: string;
  userId: string;
  provider: MailProvider;
  email: string;
  displayName: string;
  authType: "oauth" | "password";
  providerConfig: Record<string, unknown> | null;
  syncCursor: SyncCursor | null;
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  passwordEncrypted: string | null;
  smtpPasswordEncrypted: string | null;
  syncEnabled: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

class FakeAccountsRepository {
  constructor(private readonly accounts: Map<string, FakeAccountRecord>) {}

  async findByIdForUser(_user: { email: string }, accountId: string): Promise<FakeAccountRecord | null> {
    return this.accounts.get(accountId) ?? null;
  }

  async updateSyncCursorForUser(
    _user: { email: string },
    accountId: string,
    input: { syncCursor?: SyncCursor }
  ): Promise<FakeAccountRecord | null> {
    const account = this.accounts.get(accountId) ?? null;
    if (!account) {
      return null;
    }

    account.syncCursor = input.syncCursor ?? null;
    account.updatedAt = new Date();
    return account;
  }
}

class FakeMailRepository {
  readonly persistedMessages = new Map<string, string>();

  async persistNormalizedRecords(
    records: Array<ReturnType<MailNormalizerService["normalizeMessage"]>>
  ): Promise<void> {
    for (const record of records) {
      this.persistedMessages.set(
        `${record.message.accountId}:${record.message.providerMessageId}`,
        record.message.id
      );
    }
  }
}

class FakeProviderRegistryService {
  constructor(
    private readonly gmailResultFactory: (cursor?: SyncCursor) => ProviderSyncResult,
    private readonly imapResultFactory: (cursor?: SyncCursor) => ProviderSyncResult,
    readonly gmailCalls: Array<SyncCursor | undefined>,
    readonly imapCalls: Array<SyncCursor | undefined>
  ) {}

  resolveAccount(account: { provider: MailProviderKind; email: string }) {
    if (account.provider === MailProviderKind.GMAIL) {
      return {
        providerKind: MailProviderKind.GMAIL as const,
        account,
        config: {},
        provider: {
          listMessages: async (_context: unknown, cursor?: SyncCursor) => {
            this.gmailCalls.push(cursor);
            return this.gmailResultFactory(cursor);
          }
        }
      };
    }

    return {
      providerKind: MailProviderKind.IMAP as const,
      account,
      config: {
        imap: {
          host: "imap.example.com",
          port: 993,
          secure: true,
          username: account.email
        }
      },
      provider: {
        listMessages: async (_context: unknown, cursor?: SyncCursor) => {
          this.imapCalls.push(cursor);
          return this.imapResultFactory(cursor);
        }
      }
    };
  }
}

const fakeEncryptionService = {
  decrypt(value: string) {
    return value;
  }
};

const fakeMailMockSourceService = {
  listSourcesForAccount() {
    return [];
  }
};

function createAccountRecord(provider: MailProvider, accountId: string): FakeAccountRecord {
  return {
    id: accountId,
    userId: "user_test_01",
    provider,
    email: provider === MailProvider.gmail ? "gmail@example.com" : "imap@example.com",
    displayName: provider === MailProvider.gmail ? "Gmail" : "IMAP",
    authType: provider === MailProvider.gmail ? "oauth" : "password",
    providerConfig:
      provider === MailProvider.gmail
        ? { gmailProfile: { email: "gmail@example.com" } }
        : {
            imap: {
              host: "imap.example.com",
              port: 993,
              secure: true,
              username: "imap@example.com"
            }
          },
    syncCursor: null,
    accessTokenEncrypted: null,
    refreshTokenEncrypted: null,
    passwordEncrypted: null,
    smtpPasswordEncrypted: null,
    syncEnabled: true,
    syncStatus: SyncStatus.idle,
    lastSyncedAt: null,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
    updatedAt: new Date("2026-07-01T00:00:00.000Z")
  };
}

function createGmailMessage(historyId: string): ProviderMessageSource {
  return {
    provider: MailProviderKind.GMAIL,
    providerMessageId: "gmail-msg-001",
    providerThreadId: "gmail-thread-001",
    historyId,
    subject: "Gmail replay test",
    snippet: "same gmail message",
    from: { email: "sender@gmail.com", name: "Sender" },
    to: [{ email: "gmail@example.com" }],
    receivedAt: "2026-07-01T09:00:00.000Z",
    labels: ["INBOX"]
  };
}

function createImapMessage(uidValidity: string): ProviderMessageSource {
  return {
    provider: MailProviderKind.IMAP,
    providerMessageId: "101",
    providerThreadId: "imap-thread-001",
    uidValidity,
    subject: "IMAP replay test",
    snippet: "same imap message",
    from: { email: "sender@imap.example.com", name: "Sender" },
    to: [{ email: "imap@example.com" }],
    receivedAt: "2026-07-01T09:30:00.000Z",
    labels: ["Seen"]
  };
}

async function runReplayScenario(provider: MailProviderKind) {
  const accountId = provider === MailProviderKind.GMAIL ? "account_gmail_test" : "account_imap_test";
  const account = createAccountRecord(
    provider === MailProviderKind.GMAIL ? MailProvider.gmail : MailProvider.imap,
    accountId
  );
  const accountsRepository = new FakeAccountsRepository(new Map([[accountId, account]]));
  const mailRepository = new FakeMailRepository();
  const gmailCalls: Array<SyncCursor | undefined> = [];
  const imapCalls: Array<SyncCursor | undefined> = [];
  const nextCursor =
    provider === MailProviderKind.GMAIL
      ? { gmailHistoryId: "200" }
      : { imapUidValidity: "987654321", imapLastUid: 101 };
  const providerResult: ProviderSyncResult = {
    messages:
      provider === MailProviderKind.GMAIL
        ? [createGmailMessage("200")]
        : [createImapMessage("987654321")],
    nextCursor
  };
  const providerRegistryService = new FakeProviderRegistryService(
    () => providerResult,
    () => providerResult,
    gmailCalls,
    imapCalls
  );

  const service = new SyncService(
    accountsRepository as never,
    providerRegistryService as never,
    fakeEncryptionService as never,
    fakeMailMockSourceService as never,
    new MailNormalizerService(),
    mailRepository as never
  );

  const input: SyncJobInput = {
    accountId,
    mode: "incremental",
    trigger: "manual",
    reason: "replay verification"
  };
  const user = {
    email: "tester@example.com",
    name: "Tester"
  };

  const firstRun = await service.createJob(user, input);
  const secondRun = await service.createJob(user, input);

  return {
    firstRun,
    secondRun,
    mailRepository,
    account,
    calls: provider === MailProviderKind.GMAIL ? gmailCalls : imapCalls
  };
}

test("gmail sync replay keeps one persisted message and reuses stored history cursor", async () => {
  const result = await runReplayScenario(MailProviderKind.GMAIL);

  assert.equal(result.mailRepository.persistedMessages.size, 1);
  assert.deepEqual(result.firstRun.cursor, { gmailHistoryId: "200" });
  assert.deepEqual(result.secondRun.cursor, { gmailHistoryId: "200" });
  assert.deepEqual(result.calls, [undefined, { gmailHistoryId: "200" }]);
  assert.deepEqual(result.account.syncCursor, { gmailHistoryId: "200" });
});

test("imap sync replay keeps one persisted message and reuses stored uid cursor", async () => {
  const result = await runReplayScenario(MailProviderKind.IMAP);

  assert.equal(result.mailRepository.persistedMessages.size, 1);
  assert.deepEqual(result.firstRun.cursor, {
    imapUidValidity: "987654321",
    imapLastUid: 101
  });
  assert.deepEqual(result.secondRun.cursor, {
    imapUidValidity: "987654321",
    imapLastUid: 101
  });
  assert.deepEqual(result.calls, [
    undefined,
    {
      imapUidValidity: "987654321",
      imapLastUid: 101
    }
  ]);
  assert.deepEqual(result.account.syncCursor, {
    imapUidValidity: "987654321",
    imapLastUid: 101
  });
});
