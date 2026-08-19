import { app, BrowserWindow, ipcMain, safeStorage, session, shell } from "electron";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LocalAiRuntime, LocalAnalysisRequest } from "./local-ai";

const webUrl = process.env.MAIL_AGENT_WEB_URL || "http://localhost:3000";
const apiUrl = process.env.MAIL_AGENT_API_URL || "http://localhost:4000/api";
const allowedOrigin = new URL(webUrl).origin;
const allowedApiOrigin = new URL(apiUrl).origin;
const localAi = new LocalAiRuntime();
let mainWindow: BrowserWindow | null = null;
let sessionToken = "";

function tokenFilePath() {
  return join(app.getPath("userData"), "desktop-session.bin");
}

function loadSessionToken() {
  const file = tokenFilePath();
  if (!existsSync(file) || !safeStorage.isEncryptionAvailable()) return;
  try {
    sessionToken = safeStorage.decryptString(readFileSync(file));
  } catch {
    sessionToken = "";
  }
}

function saveSessionToken(token: string) {
  if (!token || !safeStorage.isEncryptionAvailable()) return;
  sessionToken = token;
  writeFileSync(tokenFilePath(), safeStorage.encryptString(token), { mode: 0o600 });
}

function handleDeepLink(url: string) {
  if (!url.startsWith("mailagent://oauth")) return;
  const callback = new URL(url);
  const token = callback.searchParams.get("sessionToken");
  if (token) saveSessionToken(token);
  callback.searchParams.delete("sessionToken");
  const target = new URL(webUrl);
  callback.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  void mainWindow?.loadURL(target.toString());
  mainWindow?.show();
  mainWindow?.focus();
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1500,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mainWindow = window;

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin !== allowedOrigin) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });
  void window.loadURL(webUrl);
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();

app.on("second-instance", (_event, argv) => {
  const deepLink = argv.find((item) => item.startsWith("mailagent://"));
  if (deepLink) handleDeepLink(deepLink);
});

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.whenReady().then(() => {
  app.setAsDefaultProtocolClient("mailagent");
  loadSessionToken();
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestOrigin = new URL(details.url).origin;
    const requestHeaders = { ...details.requestHeaders };
    if (requestOrigin === allowedApiOrigin && sessionToken) {
      requestHeaders.Authorization = `Bearer ${sessionToken}`;
      delete requestHeaders["x-user-email"];
      delete requestHeaders["x-user-name"];
    }
    callback({ requestHeaders });
  });
  ipcMain.handle("local-ai:status", () => localAi.isReady());
  ipcMain.handle("local-ai:analyze-message", (_event, request: LocalAnalysisRequest) =>
    localAi.analyze(request)
  );
  ipcMain.handle("desktop:open-oauth", (_event, url: string) => {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new Error("허용되지 않은 OAuth URL입니다.");
    }
    return shell.openExternal(parsed.toString());
  });
  createWindow();
});

app.on("window-all-closed", () => {
  localAi.stop();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
