import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

import { AppConfigService } from "../../config/app-config.service";
import { SessionService } from "../../modules/auth/session.service";
import {
  AuthenticatedUserContext,
  RequestWithAuthenticatedUser
} from "./authenticated-user.types";

@Injectable()
export class UserContextGuard implements CanActivate {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly sessionService: SessionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthenticatedUser>();
    request.authenticatedUser = await this.resolveUserContext(request);
    return true;
  }

  private async resolveUserContext(
    request: RequestWithAuthenticatedUser
  ): Promise<AuthenticatedUserContext> {
    const sessionToken = this.readSessionToken(request);
    if (sessionToken) {
      const sessionUser = await this.sessionService.resolveSession(sessionToken);
      if (sessionUser) {
        return sessionUser;
      }
    }

    const email = this.readHeader(request, "x-user-email") || this.appConfigService.defaultUserEmail;
    const name = this.readHeader(request, "x-user-name") || this.appConfigService.defaultUserName;

    const source =
      this.readHeader(request, "x-user-email") || this.readHeader(request, "x-user-name")
        ? "header"
        : "default";

    return { email, name, source };
  }

  private readHeader(request: RequestWithAuthenticatedUser, key: string): string | undefined {
    const value = request.headers[key];

    if (Array.isArray(value)) {
      return value[0]?.trim() || undefined;
    }

    return value?.trim() || undefined;
  }

  private readSessionToken(request: RequestWithAuthenticatedUser): string | undefined {
    const authorization = this.readHeader(request, "authorization");
    if (authorization?.startsWith("Bearer ")) {
      return authorization.slice("Bearer ".length).trim();
    }

    return this.readHeader(request, "x-session-token");
  }
}
