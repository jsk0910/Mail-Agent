import { AppConfigService } from "../../config/app-config.service";
import { Controller, Get } from "@nestjs/common";

import { PrismaService } from "../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly appConfigService: AppConfigService
  ) {}

  @Get()
  async getHealth() {
    const database = await this.prismaService.getHealth();

    return {
      status: "ok",
      service: "mail-agent-api",
      timestamp: new Date().toISOString(),
      environment: this.appConfigService.appEnv,
      defaultUser: {
        email: this.appConfigService.defaultUserEmail,
        name: this.appConfigService.defaultUserName
      },
      database
    };
  }
}
