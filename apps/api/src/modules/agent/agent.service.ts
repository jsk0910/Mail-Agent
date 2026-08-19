import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { MailRepository } from "../mail/mail.repository";
import { LocalLlmService } from "./local-llm.service";
import { AgentAnalysis } from "@mail-agent/shared";
import {
  AgentAnalysisLlmOutput,
  AgentSuggestReplyResult,
  SaveLocalAnalysisDto,
  SuggestReplyDto
} from "./agent.types";

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly analysisPromptVersion = "mail-analysis-v2";

  constructor(
    private readonly mailRepository: MailRepository,
    private readonly localLlmService: LocalLlmService
  ) {}

  async analyzeMessage(
    user: AuthenticatedUserContext,
    messageId: string,
    instruction?: string
  ): Promise<AgentAnalysis> {
    const message = await this.mailRepository.findMessageDetailForUser(user, messageId);

    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const cleanBody = this.cleanLatestMessageBody(
      message.bodyText || message.snippet || ""
    ).slice(0, 4000);

    const systemPrompt = `당신은 최고 수준의 업무용 이메일 인텔리전스 AI 비서입니다.
주어진 이메일의 맥락과 세부 사항을 면밀히 분석하여 다음 JSON 규격으로 한국어 인텔리전스 브리핑을 반환하세요.

JSON 출력 형식:
{
  "summary": "메일의 발신 목적과 핵심 결론을 명확히 요약한 2~3문장의 완성도 높은 종합 요약 (한국어)",
  "intent": "발신자의 핵심 의도 또는 메일의 성격 (예: 신규 표준 문서 공유 및 위원 회람 공지, 업무 협조 요청, 일정 확인 등)",
  "keyPoints": [
    "핵심 주요 사항 1",
    "핵심 주요 사항 2",
    "핵심 주요 사항 3"
  ],
  "category": "업무 | 회의 | 결제/청구 | 보안/인증 | 뉴스레터 | 프로모션 | 개인 | 알림 중 택일",
  "priority": "low | medium | high 중 택일",
  "priorityReason": "해당 우선순위로 판단한 구체적인 근거 (1문장)",
  "requiresReply": true 또는 false,
  "requiresAction": true 또는 false,
  "dueDate": "YYYY-MM-DD (최신 메시지 본문에 마감일이나 향후 회의 일정이 명시된 경우만, 없으면 null)",
  "suggestedReply": "답장이 필요한 경우 보낼 완성도 높은 정중한 한국어 회신 초안 (답장 불필요 시 null)",
  "suggestedActions": [
    "구체적인 권장 액션 1",
    "구체적인 권장 액션 2"
  ],
  "confidence": 0.95
}
과거 인용문, 전달된 메일 헤더, 서명에만 등장하는 정보는 현재 요청이나 마감일로 판단하지 마십시오.
요약은 인사말만 복사하지 말고 핵심 사실을 포함해야 합니다.
반드시 유효한 순수 JSON 객체만 반환하십시오.`;

    const userPrompt = `[이메일 정보]
보낸이: ${message.fromName ? `${message.fromName} <${message.fromEmail}>` : message.fromEmail}
수신일: ${message.receivedAt}
제목: ${message.subject}
${instruction ? `추가 지시사항: ${instruction}\n` : ""}
[본문]
${cleanBody}`;

    const startTime = Date.now();
    this.logger.log(`Starting local LLM analysis for message ${messageId}...`);
    let llmOutput = await this.localLlmService.chatJson<AgentAnalysisLlmOutput>(
      systemPrompt,
      userPrompt
    );
    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    this.logger.log(`Local LLM analysis for message ${messageId} completed in ${elapsedSeconds}s.`);

    let validated = this.validateAnalysis(llmOutput, message.receivedAt);
    if (validated.qualityIssues.length > 0) {
      this.logger.warn(
        `Analysis quality validation failed for ${messageId}; retrying once: ${validated.qualityIssues.join(" ")}`
      );
      llmOutput = await this.localLlmService.chatJson<AgentAnalysisLlmOutput>(
        `${systemPrompt}\n이전 생성 결과가 품질 검증을 통과하지 못했습니다. 인사말 복사를 피하고 최신 본문의 핵심 사실만 사용해 JSON 전체를 다시 생성하십시오.`,
        userPrompt
      );
      validated = this.validateAnalysis(llmOutput, message.receivedAt);
    }

    const persisted = await this.mailRepository.persistAnalysisForMessage(message.id, {
      ...validated.analysis,
      source: "qwen",
      status: validated.qualityIssues.length > 0 ? "invalid" : "completed",
      model: this.localLlmService.getModelName(),
      promptVersion: this.analysisPromptVersion,
      qualityIssues: validated.qualityIssues
    });

    return {
      id: persisted.id,
      messageId: persisted.messageId,
      source: persisted.source as "heuristic" | "qwen",
      status: persisted.status as "completed" | "invalid" | "failed",
      model: persisted.model || undefined,
      promptVersion: persisted.promptVersion || undefined,
      qualityIssues: persisted.qualityIssues,
      summary: persisted.summary,
      category: persisted.category,
      priority: persisted.priority as "low" | "medium" | "high",
      priorityReason: persisted.priorityReason || undefined,
      intent: persisted.intent || undefined,
      keyPoints: persisted.keyPoints,
      requiresReply: persisted.requiresReply,
      requiresAction: persisted.requiresAction,
      dueDate: persisted.dueDate?.toISOString(),
      suggestedReply: persisted.suggestedReply || undefined,
      suggestedActions: persisted.suggestedActions,
      confidence: persisted.confidence,
      createdAt: persisted.createdAt.toISOString()
    };
  }

  private cleanLatestMessageBody(body: string): string {
    const quoteBoundary = /^(?:>+\s*|on .+wrote:|from:\s|sent:\s|date:\s|to:\s|subject:\s|[-_]{2,}\s*(?:original|forwarded) message\s*[-_]{2,})/i;
    const footerBoundary = /^(?:--\s*$|unsubscribe\b|manage (?:your )?preferences\b)/i;
    const keptLines: string[] = [];

    for (const rawLine of body.replace(/\r/g, "").split("\n")) {
      const line = rawLine.trim();
      if (quoteBoundary.test(line) || footerBoundary.test(line)) {
        break;
      }
      keptLines.push(rawLine);
    }

    const cleaned = keptLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    return cleaned || body.replace(/\s+/g, " ").trim();
  }

  private validateAnalysis(
    output: AgentAnalysisLlmOutput,
    receivedAt: string
  ): {
    analysis: Omit<AgentAnalysis, "id" | "messageId" | "createdAt">;
    qualityIssues: string[];
  } {
    const qualityIssues: string[] = [];
    const summary = typeof output.summary === "string" ? output.summary.trim() : "";
    const salutationOnly = /^(?:dear|hello|hi|안녕하세요|안녕하십니까)[^.!?]{0,80}[,.!?]?$/i.test(summary);
    const invalidSummary = summary.length < 30 || salutationOnly;
    if (invalidSummary) {
      qualityIssues.push("요약에 핵심 내용이 충분히 포함되지 않았습니다.");
    }

    const validPriorities = ["low", "medium", "high"] as const;
    const priority = validPriorities.includes(output.priority) ? output.priority : "medium";
    if (priority !== output.priority) {
      qualityIssues.push("우선순위 값이 올바르지 않습니다.");
    }

    let dueDate: string | undefined;
    if (typeof output.dueDate === "string" && output.dueDate.trim()) {
      const parsedDueDate = new Date(output.dueDate);
      const oldestAllowed = new Date(receivedAt);
      oldestAllowed.setDate(oldestAllowed.getDate() - 1);
      if (Number.isNaN(parsedDueDate.getTime()) || parsedDueDate < oldestAllowed) {
        qualityIssues.push("과거 인용문에서 추출된 것으로 보이는 날짜를 제외했습니다.");
      } else {
        dueDate = parsedDueDate.toISOString();
      }
    }

    const toStringList = (value: unknown, maxItems: number) =>
      Array.isArray(value)
        ? value
            .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
            .map((item) => item.trim())
            .slice(0, maxItems)
        : [];
    const requiresReply = output.requiresReply === true;
    const confidence =
      typeof output.confidence === "number" && Number.isFinite(output.confidence)
        ? Math.min(1, Math.max(0, output.confidence))
        : 0.5;

    return {
      analysis: {
        source: "qwen",
        status: qualityIssues.length > 0 ? "invalid" : "completed",
        summary: invalidSummary
          ? "분석 결과의 품질이 충분하지 않습니다. 다시 분석해 주세요."
          : summary,
        category:
          typeof output.category === "string" && output.category.trim()
            ? output.category.trim()
            : "일반",
        priority,
        priorityReason:
          typeof output.priorityReason === "string" ? output.priorityReason.trim() : undefined,
        intent: typeof output.intent === "string" ? output.intent.trim() : undefined,
        keyPoints: toStringList(output.keyPoints, 5),
        requiresReply,
        requiresAction: output.requiresAction === true,
        dueDate,
        suggestedReply:
          requiresReply && typeof output.suggestedReply === "string"
            ? output.suggestedReply.trim()
            : undefined,
        suggestedActions: toStringList(output.suggestedActions, 5),
        confidence: qualityIssues.length > 0 ? Math.min(confidence, 0.49) : confidence
      },
      qualityIssues
    };
  }

  async getAnalysis(
    user: AuthenticatedUserContext,
    messageId: string
  ): Promise<AgentAnalysis | null> {
    const detail = await this.mailRepository.findMessageDetailForUser(user, messageId);
    if (!detail) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    return detail.analysis || null;
  }

  async saveLocalAnalysis(
    user: AuthenticatedUserContext,
    messageId: string,
    dto: SaveLocalAnalysisDto
  ): Promise<AgentAnalysis> {
    const message = await this.mailRepository.findMessageDetailForUser(user, messageId);
    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const validated = this.validateAnalysis(
      dto.output as unknown as AgentAnalysisLlmOutput,
      message.receivedAt
    );
    const persisted = await this.mailRepository.persistAnalysisForMessage(message.id, {
      ...validated.analysis,
      source: "qwen",
      status: validated.qualityIssues.length > 0 ? "invalid" : "completed",
      model: dto.model || "Qwen3-4B-Q4_K_M (local desktop)",
      promptVersion: this.analysisPromptVersion,
      qualityIssues: validated.qualityIssues
    });

    return {
      id: persisted.id,
      messageId: persisted.messageId,
      source: "qwen",
      status: persisted.status as "completed" | "invalid" | "failed",
      model: persisted.model || undefined,
      promptVersion: persisted.promptVersion || undefined,
      qualityIssues: persisted.qualityIssues,
      summary: persisted.summary,
      category: persisted.category,
      priority: persisted.priority as "low" | "medium" | "high",
      priorityReason: persisted.priorityReason || undefined,
      intent: persisted.intent || undefined,
      keyPoints: persisted.keyPoints,
      requiresReply: persisted.requiresReply,
      requiresAction: persisted.requiresAction,
      dueDate: persisted.dueDate?.toISOString(),
      suggestedReply: persisted.suggestedReply || undefined,
      suggestedActions: persisted.suggestedActions,
      confidence: persisted.confidence,
      createdAt: persisted.createdAt.toISOString()
    };
  }

  async suggestReply(
    user: AuthenticatedUserContext,
    messageId: string,
    dto: SuggestReplyDto = {}
  ): Promise<AgentSuggestReplyResult> {
    const message = await this.mailRepository.findMessageDetailForUser(user, messageId);
    if (!message) {
      throw new NotFoundException(`Message ${messageId} was not found.`);
    }

    const toneInstruction =
      dto.tone === "concise"
        ? "핵심만 간결하게 2~3줄로 작성해주세요."
        : dto.tone === "formal"
          ? "정중하고 격식 있는 비즈니스 어조로 작성해주세요."
          : dto.tone === "friendly"
            ? "친절하고 부드러운 어조로 작성해주세요."
            : "비즈니스 매너에 맞게 정중하고 명확하게 작성해주세요.";

    const systemPrompt = `당신은 업무용 이메일 회신 초안을 작성하는 전문 비서입니다.
원문 메일의 맥락과 발신자의 질문/요청사항을 정확히 파악하여, 사용자가 보낼 완성도 높은 답장 본문(한국어)을 작성하십시오.
인사말과 맺음말을 포함하되, 불필요한 메타 코멘트 없이 실제 전송할 수 있는 이메일 본문만 출력하십시오.`;

    const userPrompt = `[원문 메일]
- 발신자: ${message.fromName ? `${message.fromName} <${message.fromEmail}>` : message.fromEmail}
- 제목: ${message.subject}
- 본문 요약/발췌:
${(message.bodyText || message.snippet || "").slice(0, 2500)}

[요청 사항]
- 어조: ${toneInstruction}
${dto.instruction ? `- 사용자 추가 요구사항: ${dto.instruction}` : ""}

답장 본문을 작성해주세요:`;

    const replyText = await this.localLlmService.chatText(systemPrompt, userPrompt);

    return {
      messageId,
      suggestedReply: replyText,
      model: this.localLlmService.getModelName()
    };
  }
}
