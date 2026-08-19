export {};

declare global {
  interface Window {
    mailAgentDesktop?: {
      platform: string;
      getAiStatus(): Promise<boolean>;
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
