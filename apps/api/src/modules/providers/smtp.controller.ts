import { BadRequestException, Body, Controller, NotFoundException, Param, Post } from "@nestjs/common";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { AccountsRepository } from "../accounts/accounts.repository";
import { toSharedAccount } from "../accounts/accounts.mapper";
import { ProviderRegistryService } from "./provider-registry.service";
import { SmtpSender } from "./connectors/smtp.sender";
import { SendSmtpTestMailDto } from "./smtp.types";
import { MailProviderKind } from "@mail-agent/shared";

@Controller("providers/smtp")
export class SmtpController {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly providerRegistryService: ProviderRegistryService,
    private readonly smtpSender: SmtpSender
  ) {}

  @Post(":accountId/test")
  async sendTestMail(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("accountId") accountId: string,
    @Body() body: SendSmtpTestMailDto
  ) {
    const account = await this.accountsRepository.findByIdForUser(user, accountId);
    if (!account) {
      throw new NotFoundException(`Account ${accountId} was not found.`);
    }

    const resolved = this.providerRegistryService.resolveAccount(toSharedAccount(account));
    if (resolved.providerKind !== MailProviderKind.IMAP) {
      throw new BadRequestException(
        "SMTP test send is currently supported only for IMAP-linked accounts."
      );
    }

    await this.smtpSender.sendTestMail(
      {
        providerKind: MailProviderKind.SMTP,
        account: resolved.account,
        config: resolved.config
      },
      body.to || resolved.account.email
    );

    return {
      ok: true,
      accountId,
      to: body.to || resolved.account.email
    };
  }
}
