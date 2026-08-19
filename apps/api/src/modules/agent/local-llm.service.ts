import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

@Injectable()
export class LocalLlmService {
  private readonly logger = new Logger(LocalLlmService.name);
  private readonly baseUrl: string;
  private readonly defaultModel: string;
  private readonly geminiApiKey?: string;
  private readonly openAiApiKey?: string;

  constructor() {
    this.baseUrl = process.env.LOCAL_LLM_URL || "http://localhost:11434";
    this.defaultModel = process.env.LOCAL_LLM_MODEL || "qwen3.5:4b";
    this.geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    this.openAiApiKey = process.env.OPENAI_API_KEY;
  }

  getModelName(): string {
    if (this.geminiApiKey) {
      return process.env.GEMINI_MODEL || "gemini-2.0-flash";
    }
    if (this.openAiApiKey) {
      return process.env.OPENAI_MODEL || "gpt-4o-mini";
    }
    return this.defaultModel;
  }

  async chatJson<T>(systemPrompt: string, userPrompt: string, modelOverride?: string): Promise<T> {
    // 1. If Google Gemini API key is configured (recommended for Railway cloud deployment)
    if (this.geminiApiKey) {
      return this.callGeminiJson<T>(systemPrompt, userPrompt);
    }

    // 2. If OpenAI API key is configured
    if (this.openAiApiKey) {
      return this.callOpenAiJson<T>(systemPrompt, userPrompt);
    }

    // 3. Fallback to Local Ollama / llama.cpp
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
            num_predict: 500,
            num_ctx: 4096
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

      return this.parseJsonContent<T>(rawContent);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      this.logger.error("Local LLM connection error:", error);
      throw new ServiceUnavailableException(
        "웹 환경에서는 클라우드 AI 키(GEMINI_API_KEY 또는 OPENAI_API_KEY) 설정이 필요합니다. 100% 로컬 Qwen AI로 분석하시려면 데스크탑 앱을 사용해 주세요."
      );
    }
  }

  async chatText(systemPrompt: string, userPrompt: string, modelOverride?: string): Promise<string> {
    if (this.geminiApiKey) {
      return this.callGeminiText(systemPrompt, userPrompt);
    }

    if (this.openAiApiKey) {
      return this.callOpenAiText(systemPrompt, userPrompt);
    }

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
        "웹 환경에서는 클라우드 AI 키(GEMINI_API_KEY 또는 OPENAI_API_KEY) 설정이 필요합니다. 100% 로컬 Qwen AI로 분석하시려면 데스크탑 앱을 사용해 주세요."
      );
    }
  }

  private async callGeminiJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

    this.logger.debug(`Calling Gemini AI (JSON) model=${model}`);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.error(`Gemini request failed (${res.status}): ${errorText}`);
      throw new ServiceUnavailableException(`Gemini AI API request failed (${res.status}).`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return this.parseJsonContent<T>(text);
  }

  private async callGeminiText(systemPrompt: string, userPrompt: string): Promise<string> {
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`;

    this.logger.debug(`Calling Gemini AI (Text) model=${model}`);

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.4
        }
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.error(`Gemini request failed (${res.status}): ${errorText}`);
      throw new ServiceUnavailableException(`Gemini AI API request failed (${res.status}).`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  }

  private async callOpenAiJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    this.logger.debug(`Calling OpenAI (JSON) model=${model}`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openAiApiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.error(`OpenAI request failed (${res.status}): ${errorText}`);
      throw new ServiceUnavailableException(`OpenAI API request failed (${res.status}).`);
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };

    const text = data.choices?.[0]?.message?.content || "";
    return this.parseJsonContent<T>(text);
  }

  private async callOpenAiText(systemPrompt: string, userPrompt: string): Promise<string> {
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const url = "https://api.openai.com/v1/chat/completions";

    this.logger.debug(`Calling OpenAI (Text) model=${model}`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.openAiApiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      this.logger.error(`OpenAI request failed (${res.status}): ${errorText}`);
      throw new ServiceUnavailableException(`OpenAI API request failed (${res.status}).`);
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };

    return data.choices?.[0]?.message?.content?.trim() || "";
  }

  private parseJsonContent<T>(rawContent: string): T {
    try {
      return JSON.parse(rawContent) as T;
    } catch {
      this.logger.warn(
        `Direct JSON parse failed, attempting regex extraction from: ${rawContent.slice(0, 100)}...`
      );
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as T;
      }
      throw new Error(`Failed to parse structured JSON from AI output: ${rawContent}`);
    }
  }
}
