import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

@Injectable()
export class LocalLlmService {
  private readonly logger = new Logger(LocalLlmService.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor() {
    this.baseUrl = process.env.LOCAL_LLM_URL || "http://localhost:11434";
    this.defaultModel = process.env.LOCAL_LLM_MODEL || "qwen3.5:4b";
  }

  getModelName(): string {
    return this.defaultModel;
  }

  async chatJson<T>(systemPrompt: string, userPrompt: string, modelOverride?: string): Promise<T> {
    const model = modelOverride || this.defaultModel;
    const url = `${this.baseUrl}/api/generate`;

    this.logger.debug(`Calling local LLM (JSON) model=${model} at ${url}`);

    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          prompt: combinedPrompt,
          format: "json",
          stream: false,
          keep_alive: "60m",
          options: {
            temperature: 0.1,
            num_predict: 350,
            num_ctx: 2048
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Ollama request failed (${response.status}): ${errorText}`);
        throw new ServiceUnavailableException(
          `Local AI model request failed (${response.status}). Ensure Ollama is running.`
        );
      }

      const data = (await response.json()) as {
        response?: string;
        thinking?: string;
        message?: { content?: string; thinking?: string };
      };

      const rawContent = (
        data.response ||
        data.thinking ||
        data.message?.content ||
        data.message?.thinking ||
        ""
      ).trim();

      // Parse JSON
      try {
        const parsed = JSON.parse(rawContent) as T;
        return parsed;
      } catch {
        this.logger.warn(`Direct JSON parse failed, attempting regex extraction from: ${rawContent.slice(0, 100)}...`);
        // Extract JSON substring if wrapped in markdown code blocks or thought tokens
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]) as T;
        }
        throw new Error(`Failed to parse structured JSON from local AI output: ${rawContent}`);
      }
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error("Local LLM connection error:", error);
      throw new ServiceUnavailableException(
        "Could not connect to local AI engine (Ollama). Please verify that Ollama is active on http://localhost:11434."
      );
    }
  }

  async chatText(systemPrompt: string, userPrompt: string, modelOverride?: string): Promise<string> {
    const model = modelOverride || this.defaultModel;
    const url = `${this.baseUrl}/api/chat`;

    this.logger.debug(`Calling local LLM (Text) model=${model} at ${url}`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          stream: false,
          options: {
            temperature: 0.4
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ServiceUnavailableException(`Local AI request failed: ${errorText}`);
      }

      const data = (await response.json()) as { message?: { content: string } };
      return data.message?.content?.trim() || "";
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error("Local LLM connection error:", error);
      throw new ServiceUnavailableException(
        "Could not connect to local AI engine (Ollama). Please verify that Ollama is active on http://localhost:11434."
      );
    }
  }
}
