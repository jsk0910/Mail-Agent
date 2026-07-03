import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthType, MailProvider } from "@prisma/client";
import { Account } from "@mail-agent/shared";

import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { EncryptionService } from "../../common/security/encryption.service";
import { AppConfigService } from "../../config/app-config.service";
import { AccountsRepository } from "../accounts/accounts.repository";
import { toSharedAccount } from "../accounts/accounts.mapper";
import { GoogleOAuthCallbackDto, GoogleOAuthStartDto } from "./google-oauth.types";

interface GoogleOAuthStatePayload {
  user: AuthenticatedUserContext;
  clientType: "web" | "desktop";
  returnUri?: string;
  createdAt: string;
}

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface GoogleProfileResponse {
  email: string;
  id: string;
  name?: string;
}

@Injectable()
export class GoogleOAuthService {
  private readonly scopes = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/gmail.send"
  ];

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly accountsRepository: AccountsRepository
  ) {}

  createAuthorizationRequest(
    user: AuthenticatedUserContext,
    input: GoogleOAuthStartDto
  ): { authUrl: string; state: string } {
    const statePayload: GoogleOAuthStatePayload = {
      user,
      clientType: input.clientType ?? "web",
      returnUri: input.returnUri,
      createdAt: new Date().toISOString()
    };

    const state = Buffer.from(
      this.encryptionService.encrypt(JSON.stringify(statePayload)),
      "utf8"
    ).toString("base64url");

    const params = new URLSearchParams({
      client_id: this.appConfigService.googleClientId,
      redirect_uri: this.appConfigService.googleRedirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: this.scopes.join(" "),
      state
    });

    return {
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      state
    };
  }

  async handleCallback(input: GoogleOAuthCallbackDto): Promise<{
    item: Account;
    connection: {
      provider: "gmail";
      clientType: "web" | "desktop";
      hasRefreshToken: boolean;
      returnUri?: string;
      nextUrl?: string;
    };
  }> {
    const statePayload = this.decodeState(input.state);
    const tokenResponse = await this.exchangeCodeForTokens(input.code);
    const profile = await this.fetchProfile(tokenResponse.access_token);

    const account = await this.accountsRepository.upsertForUser(statePayload.user, {
      provider: MailProvider.gmail,
      email: profile.email,
      displayName: profile.name || profile.email,
      authType: AuthType.oauth,
      providerConfig: {
        gmailProfile: {
          id: profile.id,
          email: profile.email
        },
        oauth: {
          scope: tokenResponse.scope,
          tokenType: tokenResponse.token_type,
          expiresIn: tokenResponse.expires_in
        }
      },
      accessTokenEncrypted: this.encryptionService.encrypt(tokenResponse.access_token),
      refreshTokenEncrypted: tokenResponse.refresh_token
        ? this.encryptionService.encrypt(tokenResponse.refresh_token)
        : undefined
    });

    return {
      item: toSharedAccount(account),
      connection: {
        provider: "gmail",
        clientType: statePayload.clientType,
        hasRefreshToken: Boolean(tokenResponse.refresh_token || account.refreshTokenEncrypted),
        returnUri: statePayload.returnUri,
        nextUrl: statePayload.returnUri
          ? `${statePayload.returnUri}${statePayload.returnUri.includes("?") ? "&" : "?"}status=success&provider=gmail&accountId=${account.id}`
          : undefined
      }
    };
  }

  private decodeState(state: string): GoogleOAuthStatePayload {
    try {
      const encrypted = Buffer.from(state, "base64url").toString("utf8");
      const json = this.encryptionService.decrypt(encrypted);
      return JSON.parse(json) as GoogleOAuthStatePayload;
    } catch {
      throw new UnauthorizedException("Invalid OAuth state.");
    }
  }

  private async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: this.appConfigService.googleClientId,
        client_secret: this.appConfigService.googleClientSecret,
        redirect_uri: this.appConfigService.googleRedirectUri,
        grant_type: "authorization_code"
      })
    });

    if (!response.ok) {
      throw new UnauthorizedException("Failed to exchange Google OAuth code.");
    }

    return (await response.json()) as GoogleTokenResponse;
  }

  private async fetchProfile(accessToken: string): Promise<GoogleProfileResponse> {
    const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new UnauthorizedException("Failed to fetch Google profile.");
    }

    return (await response.json()) as GoogleProfileResponse;
  }
}
