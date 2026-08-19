export interface AppConfig {
  appEnv: string;
  apiPort: number;
  webPort: number;
  sessionTtlDays: number;
  allowDevelopmentIdentity: boolean;
  oauthAllowedReturnOrigins: string[];
  defaultUserEmail: string;
  defaultUserName: string;
  databaseUrl: string;
  redisUrl: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRedirectUri: string;
  notionClientId: string;
  notionClientSecret: string;
  appEncryptionKey: string;
}

function requireString(value: string | undefined, key: string): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function parsePort(value: string | undefined, key: string, fallback: number): number {
  if (!value || value.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer.`);
  }

  return parsed;
}

export function loadAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  return {
    appEnv: env.APP_ENV?.trim() || "development",
    apiPort: parsePort(env.PORT || env.API_PORT, "PORT", 4000),
    webPort: parsePort(env.WEB_PORT, "WEB_PORT", 3000),
    sessionTtlDays: parsePort(env.SESSION_TTL_DAYS, "SESSION_TTL_DAYS", 30),
    allowDevelopmentIdentity:
      (env.ALLOW_DEVELOPMENT_IDENTITY ?? (env.APP_ENV === "production" ? "false" : "true")) ===
      "true",
    oauthAllowedReturnOrigins: (env.OAUTH_ALLOWED_RETURN_ORIGINS || "http://localhost:3000")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
    defaultUserEmail: env.DEFAULT_USER_EMAIL?.trim() || "dev@mail-agent.local",
    defaultUserName: env.DEFAULT_USER_NAME?.trim() || "Mail Agent Developer",
    databaseUrl: requireString(env.DATABASE_URL, "DATABASE_URL"),
    redisUrl: requireString(env.REDIS_URL, "REDIS_URL"),
    googleClientId: env.GOOGLE_CLIENT_ID?.trim() || "",
    googleClientSecret: env.GOOGLE_CLIENT_SECRET?.trim() || "",
    googleRedirectUri: env.GOOGLE_REDIRECT_URI?.trim() || "",
    notionClientId: env.NOTION_CLIENT_ID?.trim() || "",
    notionClientSecret: env.NOTION_CLIENT_SECRET?.trim() || "",
    appEncryptionKey: requireString(env.APP_ENCRYPTION_KEY, "APP_ENCRYPTION_KEY")
  };
}
