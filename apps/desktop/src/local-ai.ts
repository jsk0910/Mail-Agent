import { ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";

export interface LocalAnalysisRequest {
  from: string;
  receivedAt: string;
  subject: string;
  bodyText: string;
}

export class LocalAiRuntime {
  private process: ChildProcess | null = null;
  private readonly port = 11435;
  private readonly apiKey = randomBytes(32).toString("hex");

  private getResourcePath(...parts: string[]) {
    const root = app.isPackaged ? process.resourcesPath : join(__dirname, "..", "resources");
    return join(root, ...parts);
  }

  private getBinaryPath() {
    const filename = process.platform === "win32" ? "llama-server.exe" : "llama-server";
    return app.isPackaged
      ? this.getResourcePath("bin", filename)
      : this.getResourcePath("bin", `${process.platform}-${process.arch}`, filename);
  }

  private getModelPath() {
    return this.getResourcePath("models", "qwen3-4b-q4_k_m-00001-of-00002.gguf");
  }

  async start() {
    if (await this.isReady()) return;

    const binary = this.getBinaryPath();
    const model = this.getModelPath();
    if (!existsSync(binary) || !existsSync(model)) {
      throw new Error("로컬 AI 런타임 또는 Qwen 모델 리소스가 설치되지 않았습니다.");
    }

    this.process = spawn(
      binary,
      ["--model", model, "--host", "127.0.0.1", "--port", String(this.port), "--ctx-size", "4096", "--jinja", "--api-key", this.apiKey],
      { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] }
    );

    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline) {
      if (await this.isReady()) return;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("로컬 AI 모델을 시작하지 못했습니다.");
  }

  async isReady() {
    try {
      const response = await fetch(`http://127.0.0.1:${this.port}/health`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyze(request: LocalAnalysisRequest) {
    await this.start();
    const response = await fetch(`http://127.0.0.1:${this.port}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: "qwen3-4b-q4_k_m",
        temperature: 0.1,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "업무 이메일을 분석해 summary, intent, keyPoints, category, priority, priorityReason, requiresReply, requiresAction, dueDate, suggestedReply, suggestedActions, confidence 필드를 가진 순수 JSON 객체를 한국어로 반환하세요. 본문에 없는 날짜를 만들지 마세요."
          },
          {
            role: "user",
            content: `보낸이: ${request.from}\n수신일: ${request.receivedAt}\n제목: ${request.subject}\n본문:\n${request.bodyText.slice(0, 6000)}`
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`로컬 AI 요청 실패 (${response.status})`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("로컬 AI가 빈 분석 결과를 반환했습니다.");
    return JSON.parse(content) as Record<string, unknown>;
  }

  stop() {
    this.process?.kill();
    this.process = null;
  }
}
