import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient {
  async getHealth() {
    try {
      await this.$queryRaw`SELECT 1`;

      return {
        status: "up" as const
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error";

      return {
        status: "down" as const,
        message
      };
    }
  }
}
