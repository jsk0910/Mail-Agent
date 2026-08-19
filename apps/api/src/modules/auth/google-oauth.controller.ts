import { Controller, Get, Query, Res, UsePipes, ValidationPipe } from "@nestjs/common";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { GoogleOAuthCallbackDto, GoogleOAuthStartDto } from "./google-oauth.types";
import { GoogleOAuthService } from "./google-oauth.service";

interface RedirectResponse {
  redirect: (url: string) => void;
}

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
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false
    })
  )
  async handleCallback(
    @Query() query: GoogleOAuthCallbackDto,
    @Res() res: RedirectResponse
  ) {
    const result = await this.googleOAuthService.handleCallback(query);
    const redirectUrl =
      result.connection.nextUrl ||
      "http://localhost:3000/?status=success&provider=gmail";
    return res.redirect(redirectUrl);
  }
}
