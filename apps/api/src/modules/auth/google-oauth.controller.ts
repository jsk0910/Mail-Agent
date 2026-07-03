import { Controller, Get, Query } from "@nestjs/common";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { GoogleOAuthCallbackDto, GoogleOAuthStartDto } from "./google-oauth.types";
import { GoogleOAuthService } from "./google-oauth.service";

@Controller("auth/google")
export class GoogleOAuthController {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  @Get("start")
  startOAuth(
    @CurrentUser() user: AuthenticatedUserContext,
    @Query() query: GoogleOAuthStartDto
  ) {
    return this.googleOAuthService.createAuthorizationRequest(user, query);
  }

  @Get("callback")
  async handleCallback(@Query() query: GoogleOAuthCallbackDto) {
    return this.googleOAuthService.handleCallback(query);
  }
}
