export interface AuthenticatedUserContext {
  id?: string;
  email: string;
  name: string;
  sessionId?: string;
  source?: "session" | "header" | "default";
}

export interface RequestWithAuthenticatedUser {
  headers: Record<string, string | string[] | undefined>;
  url?: string;
  authenticatedUser?: AuthenticatedUserContext;
}
