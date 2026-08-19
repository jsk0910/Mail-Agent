import { ChildProcess, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { app, shell } from "electron";
import https from "node:https";
import http from "node:http";

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
  private isDownloading = false;
  private downloadProgress = 0;

  private getResourcePath(...parts: string[]) {
    const root = app.isPackaged ? process.resourcesPath : join(__dirname, "..", "resources");
    return join(root, ...parts);
  }

  private getUserModelsDir() {
    const dir = join(app.getPath("userData"), "models");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  getModelsDirectory() {
    return this.getUserModelsDir();
  }

  openModelsDirectory() {
    return shell.openPath(this.getUserModelsDir());
  }

  private getBinaryPath() {
    const filename = process.platform === "win32" ? "llama-server.exe" : "llama-server";
    return app.isPackaged
      ? this.getResourcePath("bin", filename)
      : this.getResourcePath("bin", `${process.platform}-${process.arch}`, filename);
  }

  getModelPath(): string | null {
    const userDir = this.getUserModelsDir();

    // 1. Check in userData/models for any gguf
    if (existsSync(userDir)) {
      const userFiles = readdirSync(userDir).filter((f) => f.endsWith(".gguf"));
      if (userFiles.length > 0) return join(userDir, userFiles[0]);
    }

    // 2. Check bundled resources/models
    const resDir = this.getResourcePath("models");
    if (existsSync(resDir)) {
      const resFiles = readdirSync(resDir).filter((f) => f.endsWith(".gguf"));
      if (resFiles.length > 0) return join(resDir, resFiles[0]);
    }

    return null;
  }

  getModelStatus() {
    const modelPath = this.getModelPath();
    return {
      installed: Boolean(modelPath),
      modelPath: modelPath || undefined,
      isDownloading: this.isDownloading,
      downloadProgress: this.downloadProgress,
      modelsDir: this.getUserModelsDir()
    };
  }

  async downloadDefaultModel(): Promise<string> {
    if (this.isDownloading) {
      throw new Error("이미 모델 다운로드가 진행 중입니다.");
    }

    const targetDir = this.getUserModelsDir();
    const targetFile = join(targetDir, "qwen2.5-1.5b-instruct-q4_k_m.gguf");
    if (existsSync(targetFile)) return targetFile;

    const downloadUrl =
      "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf";

    this.isDownloading = true;
    this.downloadProgress = 0;

    return new Promise<string>((resolve, reject) => {
      const downloadWithRedirects = (url: string) => {
        const client = url.startsWith("https") ? https : http;
        client
          .get(url, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              downloadWithRedirects(res.headers.location);
              return;
            }

            if (res.statusCode !== 200) {
              this.isDownloading = false;
              reject(new Error(`모델 다운로드 실패 (HTTP ${res.statusCode})`));
              return;
            }

            const totalBytes = parseInt(res.headers["content-length"] || "0", 10);
            let receivedBytes = 0;
            const fileStream = createWriteStream(targetFile);

            res.on("data", (chunk: Buffer) => {
              receivedBytes += chunk.length;
              if (totalBytes > 0) {
                this.downloadProgress = Math.round((receivedBytes / totalBytes) * 100);
              }
            });

            res.pipe(fileStream);

            fileStream.on("finish", () => {
              fileStream.close();
              this.isDownloading = false;
              this.downloadProgress = 100;
              resolve(targetFile);
            });

            fileStream.on("error", (err) => {
              this.isDownloading = false;
              reject(err);
            });
          })
          .on("error", (err) => {
            this.isDownloading = false;
            reject(err);
          });
      };

      downloadWithRedirects(downloadUrl);
    });
  }

  async start() {
    if (await this.isReady()) return;

    const binary = this.getBinaryPath();
    const model = this.getModelPath();

    if (!existsSync(binary)) {
      throw new Error("로컬 AI 런타임 바이너리가 설치되지 않았습니다.");
    }

    if (!model || !existsSync(model)) {
      throw new Error("Qwen 모델(.gguf)이 없습니다. 모델을 다운로드하거나 models 폴더에 넣어주세요.");
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
        model: "qwen-local",
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "업무 이메일을 분석해 summary, intent, keyPoints, category, priority, priorityReason, requiresReply, requiresAction, dueDate, suggestedReply, suggestedActions, confidence 필드를 가진 순수 JSON 객체를 한국어로 반환하세요. 본문에 없는 날짜를 만들지 마세요."
          },
          {
            role: "user",
            content: `보낸이: ${request.from}\n수신일: ${request.receivedAt}\n제목: ${request.subject}\n본문:\n${request.bodyText.slice(0, 4000)}`
          }
        ]
      })
    });
    if (!response.ok) throw new Error(`로컬 AI 요청 실패 (${response.status})`);
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("로컬 AI가 빈 분석 결과를 반환했습니다.");
    return this.parseJsonResult(content);
  }

  private parseJsonResult(raw: string): Record<string, unknown> {
    const trimmed = raw.trim();
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
        } catch {
          const repaired = this.attemptJsonRepair(jsonMatch[0]);
          if (repaired) {
            try {
              return JSON.parse(repaired) as Record<string, unknown>;
            } catch {
              // ignore
            }
          }
        }
      }
      throw new Error(`로컬 AI 출력 파싱 실패: ${trimmed.slice(0, 150)}...`);
    }
  }

  private attemptJsonRepair(jsonStr: string): string | null {
    let s = jsonStr.trim();
    const quoteCount = (s.match(/(?<!\\)"/g) || []).length;
    if (quoteCount % 2 !== 0) {
      s += '"';
    }
    const openBrackets = (s.match(/\[/g) || []).length;
    const closeBrackets = (s.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) s += "]";
    const openBraces = (s.match(/\{/g) || []).length;
    const closeBraces = (s.match(/\}/g) || []).length;
    for (let i = 0; i < openBraces - closeBraces; i++) s += "}";
    return s;
  }

  stop() {
    this.process?.kill();
    this.process = null;
  }
}
