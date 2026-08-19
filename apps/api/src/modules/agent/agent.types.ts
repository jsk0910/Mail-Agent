import { IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { AgentAnalysis } from "@mail-agent/shared";

export class AnalyzeMessageDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  instruction?: string;
}

export class SaveLocalAnalysisDto {
  @IsObject()
  output!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  model?: string;
}

export class SuggestReplyDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instruction?: string;

  @IsOptional()
  @IsString()
  tone?: "polite" | "concise" | "formal" | "friendly";
}

export interface AgentAnalysisLlmOutput {
  summary: string;
  category: string;
  priority: "low" | "medium" | "high";
  priorityReason?: string | null;
  intent?: string | null;
  keyPoints?: string[];
  requiresReply: boolean;
  requiresAction: boolean;
  dueDate?: string | null;
  suggestedReply?: string | null;
  suggestedActions?: string[];
  confidence: number;
}

export interface AgentSuggestReplyResult {
  messageId: string;
  suggestedReply: string;
  model: string;
}
