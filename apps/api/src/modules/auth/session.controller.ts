import { Body, Controller, Delete, Get, Post } from "@nestjs/common";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { SessionService } from "./session.service";
import { CreateSessionDto } from "./session.types";

@Controller("auth/session")
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  createSession(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateSessionDto
  ) {
    return this.sessionService.createSession(user, body);
  }

  @Get("me")
  getCurrentSession(@CurrentUser() user: AuthenticatedUserContext) {
    return this.sessionService.getSessionSummary(user);
  }

  @Delete("me")
  revokeCurrentSession(@CurrentUser() user: AuthenticatedUserContext) {
    return this.sessionService.revokeCurrentSession(user);
  }
}
