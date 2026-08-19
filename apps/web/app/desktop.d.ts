export {};

export interface ModelStatus {
  installed: boolean;
  modelPath?: string;
  isDownloading: boolean;
  downloadProgress: number;
  modelsDir: string;
}

declare global {
  interface Window {
    mailAgentDesktop?: {
      platform: string;
      getAiStatus(): Promise<boolean>;
      getModelStatus?(): Promise<ModelStatus>;
      downloadModel?(): Promise<string>;
      openModelsDir?(): Promise<string>;
      openOAuth(url: string): Promise<void>;
      getSessionToken?(): Promise<string | null>;
      setSessionToken?(token: string): Promise<void>;
      analyzeMessage(request: {
        from: string;
        receivedAt: string;
        subject: string;
        bodyText: string;
      }): Promise<Record<string, unknown>>;
    };
  }
}
