import { contextBridge, ipcRenderer } from "electron";

export interface LocalAnalysisRequest {
  from: string;
  receivedAt: string;
  subject: string;
  bodyText: string;
}

contextBridge.exposeInMainWorld("mailAgentDesktop", {
  platform: process.platform,
  analyzeMessage: (request: LocalAnalysisRequest) =>
    ipcRenderer.invoke("local-ai:analyze-message", request),
  getAiStatus: () => ipcRenderer.invoke("local-ai:status"),
  openOAuth: (url: string) => ipcRenderer.invoke("desktop:open-oauth", url)
});
