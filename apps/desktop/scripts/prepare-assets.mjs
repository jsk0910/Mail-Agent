import { createHash } from "node:crypto";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, cpSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { spawnSync } from "node:child_process";

const desktopRoot = resolve(import.meta.dirname, "..");
const resourcesRoot = join(desktopRoot, "resources");
const manifest = JSON.parse(readFileSync(join(resourcesRoot, "assets.json"), "utf8"));
const platformKey = `${process.platform}-${process.arch}`;
const runtime = manifest.llamaCpp.platforms[platformKey];
const skipModel = process.argv.includes("--skip-model");

if (!runtime) throw new Error(`지원하지 않는 빌드 플랫폼입니다: ${platformKey}`);

async function sha256(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function download(url, destination, expectedHash) {
  if (existsSync(destination) && (await sha256(destination)) === expectedHash) return;
  mkdirSync(dirname(destination), { recursive: true });
  const temporary = `${destination}.download`;
  rmSync(temporary, { force: true });
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error(`다운로드 실패: ${response.status} ${url}`);
  await finished(Readable.fromWeb(response.body).pipe(createWriteStream(temporary)));
  const actualHash = await sha256(temporary);
  if (actualHash !== expectedHash) {
    rmSync(temporary, { force: true });
    throw new Error(`SHA-256 불일치: ${basename(destination)}`);
  }
  rmSync(destination, { force: true });
  renameSync(temporary, destination);
}

function findFile(root, filename) {
  const queue = [root];
  while (queue.length) {
    const current = queue.shift();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) queue.push(path);
      else if (entry.name === filename) return path;
    }
  }
  return undefined;
}

const cacheRoot = join(resourcesRoot, ".cache");
mkdirSync(cacheRoot, { recursive: true });
const archive = join(cacheRoot, basename(new URL(runtime.url).pathname));
await download(runtime.url, archive, runtime.sha256);

const extractRoot = join(cacheRoot, platformKey);
rmSync(extractRoot, { recursive: true, force: true });
mkdirSync(extractRoot, { recursive: true });
const extraction = spawnSync("tar", ["-xf", archive, "-C", extractRoot], { stdio: "inherit" });
if (extraction.status !== 0) throw new Error("llama.cpp 압축 해제에 실패했습니다.");
const serverName = process.platform === "win32" ? "llama-server.exe" : "llama-server";
const serverPath = findFile(extractRoot, serverName);
if (!serverPath) throw new Error(`${serverName}을 릴리스 아카이브에서 찾지 못했습니다.`);
const runtimeTarget = join(resourcesRoot, "bin", platformKey);
rmSync(runtimeTarget, { recursive: true, force: true });
cpSync(dirname(serverPath), runtimeTarget, { recursive: true });

if (!skipModel) {
  const modelsRoot = join(resourcesRoot, "models");
  const legacyModelPath = join(modelsRoot, manifest.model.filename);
  const cachedModelPath = join(cacheRoot, manifest.model.filename);
  mkdirSync(modelsRoot, { recursive: true });

  if (!existsSync(cachedModelPath) && existsSync(legacyModelPath) && (await sha256(legacyModelPath)) === manifest.model.sha256) {
    renameSync(legacyModelPath, cachedModelPath);
  }
  await download(manifest.model.url, cachedModelPath, manifest.model.sha256);
  if (statSync(cachedModelPath).size !== manifest.model.size) throw new Error("모델 파일 크기가 일치하지 않습니다.");

  for (const filename of readdirSync(modelsRoot)) {
    if (filename.startsWith("qwen3-4b-q4_k_m-") && filename.endsWith(".gguf")) {
      rmSync(join(modelsRoot, filename), { force: true });
    }
  }
  const splitBinary = join(runtimeTarget, process.platform === "win32" ? "llama-gguf-split.exe" : "llama-gguf-split");
  const splitPrefix = join(modelsRoot, "qwen3-4b-q4_k_m");
  const split = spawnSync(splitBinary, ["--split-max-size", "1800M", cachedModelPath, splitPrefix], { stdio: "inherit" });
  if (split.status !== 0) throw new Error("Qwen GGUF 모델 분할에 실패했습니다.");
  const firstShard = join(modelsRoot, "qwen3-4b-q4_k_m-00001-of-00002.gguf");
  if (!existsSync(firstShard)) throw new Error("분할된 Qwen GGUF 첫 shard를 찾지 못했습니다.");
}

console.log(`Desktop assets ready for ${platformKey}${skipModel ? " (runtime only)" : ""}.`);
