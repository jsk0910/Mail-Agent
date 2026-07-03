import { Injectable } from "@nestjs/common";
import { MailProviderKind, ProviderMessageSource } from "@mail-agent/shared";

interface MockMailSourceRecord {
  accountId: string;
  source: ProviderMessageSource;
}

@Injectable()
export class MailMockSourceService {
  private readonly sourceFixtures: ProviderMessageSource[] = [
    {
      provider: MailProviderKind.IMAP,
      providerMessageId: "imap_001",
      providerThreadId: "thread_provider_01",
      from: { name: "Professor Kim", email: "kim@example.ac.kr" },
      to: [{ email: "user@example.com" }],
      cc: [],
      subject: "컴파일러 과제 제출 안내",
      snippet: "이번 주 과제 제출 기한은 7월 5일입니다.",
      bodyText:
        "안녕하세요,\n이번 주 과제 제출 기한은 2026-07-05이고, 제출 방식은 LMS 업로드입니다.",
      bodyHtml:
        "<p>안녕하세요,</p><p>이번 주 과제 제출 기한은 <strong>2026-07-05</strong>이고, 제출 방식은 LMS 업로드입니다.</p>",
      receivedAt: "2026-06-29T09:10:00+09:00",
      isRead: false,
      isStarred: false,
      labels: ["INBOX", "학교"],
      attachments: [
        {
          filename: "assignment.pdf",
          mimeType: "application/pdf",
          size: 124000,
          providerAttachmentId: "att_provider_01"
        }
      ]
    },
    {
      provider: MailProviderKind.GMAIL,
      providerMessageId: "gmail_001",
      providerThreadId: "thread_provider_02",
      from: { name: "GitHub", email: "noreply@github.com" },
      to: [{ email: "user@example.com" }],
      subject: "GitHub security alert",
      snippet: "A new login to your account was detected.",
      bodyText: "A new login to your account was detected.",
      receivedAt: "2026-06-29T08:40:00+09:00",
      isRead: true,
      isStarred: false,
      labels: ["INBOX"]
    }
  ];

  listInboxSources(): MockMailSourceRecord[] {
    return this.sourceFixtures.map((source) => ({
      accountId: this.getDemoAccountId(source.provider),
      source
    }));
  }

  listSourcesForAccount(
    accountId: string,
    provider: MailProviderKind
  ): MockMailSourceRecord[] {
    return this.sourceFixtures
      .filter((source) => source.provider === provider)
      .map((source) => ({
        accountId,
        source
      }));
  }

  private getDemoAccountId(provider: MailProviderKind): string {
    if (provider === MailProviderKind.GMAIL) {
      return "account_gmail_01";
    }

    return "account_imap_01";
  }
}
