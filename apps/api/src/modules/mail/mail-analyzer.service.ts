import { Injectable } from "@nestjs/common";
import { AgentAnalysis, MessageDetail } from "@mail-agent/shared";

@Injectable()
export class MailAnalyzerService {
  analyzeMessage(
    message: MessageDetail
  ): Omit<AgentAnalysis, "id" | "messageId" | "createdAt"> {
    const text = (message.bodyText || message.snippet || "").trim();
    const subject = (message.subject || "").trim();
    const combined = `${subject} ${text}`.toLowerCase();

    const summary = this.generateSummary(subject, text);
    const category = this.detectCategory(combined, message.fromEmail);
    const priority = this.detectPriority(combined, message.isStarred, message.isRead);
    const requiresReply = this.detectRequiresReply(combined, message.fromEmail);
    const requiresAction = this.detectRequiresAction(combined);
    const dueDate = this.detectDueDate(combined);
    const confidence = this.calculateConfidence(text.length, combined);

    return {
      summary,
      category,
      priority,
      requiresReply,
      requiresAction,
      dueDate,
      confidence
    };
  }

  private generateSummary(subject: string, bodyText: string): string {
    if (!bodyText) {
      return subject || "Empty message.";
    }

    const sentences = bodyText
      .split(/(?<=[.?!])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10 && !s.startsWith(">") && !s.startsWith("http"));

    if (sentences.length > 0) {
      const first = sentences[0];
      return first.length > 200 ? `${first.slice(0, 197)}...` : first;
    }

    return subject || "Message content summary unavailable.";
  }

  private detectCategory(
    text: string,
    fromEmail: string
  ): string {
    const from = fromEmail.toLowerCase();

    if (
      from.includes("billing") ||
      from.includes("invoice") ||
      from.includes("receipt") ||
      text.includes("invoice") ||
      text.includes("payment") ||
      text.includes("receipt") ||
      text.includes("결제") ||
      text.includes("영수증")
    ) {
      return "finance";
    }

    if (
      from.includes("newsletter") ||
      from.includes("noreply") ||
      from.includes("no-reply") ||
      from.includes("update") ||
      text.includes("unsubscribe") ||
      text.includes("구독취소")
    ) {
      return "newsletter";
    }

    if (
      text.includes("project") ||
      text.includes("deploy") ||
      text.includes("release") ||
      text.includes("sprint") ||
      text.includes("jira") ||
      text.includes("github") ||
      text.includes("프로젝트") ||
      text.includes("배포")
    ) {
      return "project";
    }

    if (
      text.includes("meeting") ||
      text.includes("schedule") ||
      text.includes("call") ||
      text.includes("sync") ||
      text.includes("미팅") ||
      text.includes("회의")
    ) {
      return "work";
    }

    return "general";
  }

  private detectPriority(
    text: string,
    isStarred: boolean,
    isRead: boolean
  ): "high" | "medium" | "low" {
    if (isStarred) {
      return "high";
    }

    if (
      text.includes("urgent") ||
      text.includes("asap") ||
      text.includes("emergency") ||
      text.includes("critical") ||
      text.includes("긴급") ||
      text.includes("중요") ||
      text.includes("시급")
    ) {
      return "high";
    }

    if (
      text.includes("newsletter") ||
      text.includes("digest") ||
      text.includes("unsubscribe") ||
      text.includes("promotion")
    ) {
      return "low";
    }

    return isRead ? "low" : "medium";
  }

  private detectRequiresReply(text: string, fromEmail: string): boolean {
    const from = fromEmail.toLowerCase();
    if (from.includes("noreply") || from.includes("no-reply")) {
      return false;
    }

    return (
      text.includes("reply") ||
      text.includes("respond") ||
      text.includes("let me know") ||
      text.includes("can you") ||
      text.includes("please send") ||
      text.includes("회신") ||
      text.includes("답변") ||
      text.includes("확인 부탁") ||
      text.includes("부탁드립니다")
    );
  }

  private detectRequiresAction(text: string): boolean {
    return (
      text.includes("action required") ||
      text.includes("please review") ||
      text.includes("sign") ||
      text.includes("approve") ||
      text.includes("검토") ||
      text.includes("승인") ||
      text.includes("제출")
    );
  }

  private detectDueDate(text: string): string | undefined {
    const dateMatch = text.match(/(?:by|due|until|before|마감|기한)\s*[:\s]?\s*(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\w+ \d{1,2}(?:st|nd|rd|th)?)/i);
    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return undefined;
  }

  private calculateConfidence(textLength: number, combined: string): number {
    let score = 0.7;
    if (textLength > 50) score += 0.15;
    if (combined.includes("urgent") || combined.includes("invoice") || combined.includes("meeting")) score += 0.1;
    return Math.min(0.98, score);
  }
}
