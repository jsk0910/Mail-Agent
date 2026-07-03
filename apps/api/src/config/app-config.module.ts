import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { AppConfigService } from "./app-config.service";
import { loadAppConfig } from "./app.config";

const envFileCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), ".env.example"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), "../../.env.example")
].filter((filePath, index, allPaths) => allPaths.indexOf(filePath) === index && existsSync(filePath));

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envFileCandidates,
      load: [() => loadAppConfig(process.env)]
    })
  ],
  providers: [AppConfigService],
  exports: [AppConfigService]
})
export class AppConfigModule {}
