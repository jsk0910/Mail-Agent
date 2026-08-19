import { createHash, randomBytes } from "crypto";

import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Session, User } from "@prisma/client";

import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { AppConfigService } from "../../config/app-config.service";
import { PrismaService } from "../database/prisma.service";
import { CreateSessionDto } from "./session.types";

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfigService: AppConfigService
  ) {}

  async createSession(
    currentUser: AuthenticatedUserContext,
    input: CreateSessionDto
  ): Promise<{
    sessionToken: string;
    session: {
      id: string;
      clientType: string;
      deviceLabel?: string;
      expiresAt: string;
    };
    user: AuthenticatedUserContext;
  }> {
    if (!this.appConfigService.allowDevelopmentIdentity && currentUser.source !== "session") {
      throw new UnauthorizedException("Session creation requires a verified identity.");
    }
    return this.createSessionForIdentity(
      {
        email: currentUser.email,
        name: currentUser.name
      },
      input
    );
  }

  async createSessionForIdentity(
    identity: { email: string; name: string },
    input: Pick<CreateSessionDto, "clientType" | "deviceLabel" | "ttlDays">
  ): Promise<{
    sessionToken: string;
    session: { id: string; clientType: string; deviceLabel?: string; expiresAt: string };
    user: AuthenticatedUserContext;
  }> {
    const user = await this.ensureUser(identity);

    const sessionToken = this.generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (input.ttlDays ?? this.appConfigService.sessionTtlDays));

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(sessionToken),
        clientType: input.clientType ?? "web",
        deviceLabel: input.deviceLabel,
        expiresAt,
        lastUsedAt: new Date()
      }
    });

    return {
      sessionToken,
      session: {
        id: session.id,
        clientType: session.clientType,
        deviceLabel: session.deviceLabel ?? undefined,
        expiresAt: session.expiresAt.toISOString()
      },
      user: {
        id: user.id,
        email: user.email,
        name: user.name || user.email,
        sessionId: session.id,
        source: "session"
      }
    };
  }

  async resolveSession(token: string): Promise<AuthenticatedUserContext | null> {
    const tokenHash = this.hashToken(token);
    const session = await this.prisma.session.findUnique({
      where: {
        tokenHash
      },
      include: {
        user: true
      }
    });

    if (!session) {
      return null;
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session.delete({
        where: {
          id: session.id
        }
      });

      return null;
    }

    await this.prisma.session.update({
      where: {
        id: session.id
      },
      data: {
        lastUsedAt: new Date()
      }
    });

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || session.user.email,
      sessionId: session.id,
      source: "session"
    };
  }

  async getSessionSummary(user: AuthenticatedUserContext) {
    if (!user.sessionId) {
      throw new NotFoundException("No active app session was resolved for this request.");
    }

    const session = await this.prisma.session.findUnique({
      where: {
        id: user.sessionId
      }
    });

    if (!session) {
      throw new NotFoundException("Session not found.");
    }

    return {
      id: session.id,
      clientType: session.clientType,
      deviceLabel: session.deviceLabel,
      expiresAt: session.expiresAt.toISOString(),
      lastUsedAt: session.lastUsedAt?.toISOString(),
      source: user.source
    };
  }

  async revokeCurrentSession(user: AuthenticatedUserContext) {
    if (!user.sessionId) {
      throw new UnauthorizedException("No active session to revoke.");
    }

    await this.prisma.session.delete({
      where: {
        id: user.sessionId
      }
    });

    return {
      revoked: true,
      sessionId: user.sessionId
    };
  }

  private async ensureUser(identity: { email: string; name: string }): Promise<User> {
    return this.prisma.user.upsert({
      where: {
        email: identity.email
      },
      update: {
        name: identity.name
      },
      create: {
        email: identity.email,
        name: identity.name
      }
    });
  }

  private generateSessionToken(): string {
    return randomBytes(32).toString("base64url");
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }
}
