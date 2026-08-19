import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AppConfig } from "./app.config";

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  get appEnv() {
    return this.configService.get("appEnv", { infer: true });
  }

  get apiPort() {
    return this.configService.get("apiPort", { infer: true });
  }

  get webPort() {
    return this.configService.get("webPort", { infer: true });
  }

  get sessionTtlDays() {
    return this.configService.get("sessionTtlDays", { infer: true });
  }

  get allowDevelopmentIdentity() {
    return this.configService.get("allowDevelopmentIdentity", { infer: true });
  }

  get oauthAllowedReturnOrigins() {
    return this.configService.get("oauthAllowedReturnOrigins", { infer: true });
  }

  get defaultUserEmail() {
    return this.configService.get("defaultUserEmail", { infer: true });
  }

  get defaultUserName() {
    return this.configService.get("defaultUserName", { infer: true });
  }

  get databaseUrl() {
    return this.configService.get("databaseUrl", { infer: true });
  }

  get redisUrl() {
    return this.configService.get("redisUrl", { infer: true });
  }

  get googleClientId() {
    return this.configService.get("googleClientId", { infer: true });
  }

  get googleClientSecret() {
    return this.configService.get("googleClientSecret", { infer: true });
  }

  get googleRedirectUri() {
    return this.configService.get("googleRedirectUri", { infer: true });
  }

  get notionClientId() {
    return this.configService.get("notionClientId", { infer: true });
  }

  get notionClientSecret() {
    return this.configService.get("notionClientSecret", { infer: true });
  }

  get appEncryptionKey() {
    return this.configService.get("appEncryptionKey", { infer: true });
  }
}
