import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { SyncStatus } from "@prisma/client";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { AccountsService } from "./accounts.service";
import {
  CreateAccountDto,
  OnboardImapAccountDto,
  UpdateAccountSyncStatusDto
} from "./accounts.types";

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async listAccounts(@CurrentUser() user: AuthenticatedUserContext) {
    return {
      items: await this.accountsService.list(user)
    };
  }

  @Get(":accountId")
  async getAccount(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("accountId") accountId: string
  ) {
    return {
      item: await this.accountsService.findById(user, accountId)
    };
  }

  @Post()
  async createAccount(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateAccountDto
  ) {
    return {
      item: await this.accountsService.create(user, body)
    };
  }

  @Post("onboard/imap")
  async onboardImapAccount(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: OnboardImapAccountDto
  ) {
    return {
      item: await this.accountsService.onboardImap(user, body)
    };
  }

  @Patch(":accountId/sync-status")
  async updateSyncStatus(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("accountId") accountId: string,
    @Body() body: UpdateAccountSyncStatusDto
  ) {
    return {
      item: await this.accountsService.updateSyncStatus(
        user,
        accountId,
        body.syncStatus as SyncStatus
      )
    };
  }
}
