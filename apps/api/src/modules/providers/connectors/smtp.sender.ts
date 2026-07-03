import { Injectable, Logger } from "@nestjs/common";
import { MailComposerPayload, MailProviderKind } from "@mail-agent/shared";

import { SmtpProviderContext } from "../mail-provider";
import { SmtpPreparedMessage, SmtpResolvedEnvelope } from "../smtp.types";

@Injectable()
export class SmtpSender {
  readonly provider = MailProviderKind.SMTP;
  private readonly logger = new Logger(SmtpSender.name);

  async sendTestMail(context: SmtpProviderContext, to: string) {
    const message = this.prepareMessage(context, {
      to: [to],
      subject: "SMTP setup check",
      bodyText: "This is a placeholder test send from the mail agent skeleton."
    });

    await this.sendMessage(context, message);
  }

  async sendMessage(context: SmtpProviderContext, payload: MailComposerPayload) {
    const envelope = this.resolveEnvelope(context);
    const message = this.prepareMessage(context, payload);

    this.logger.debug(
      `SMTP send skeleton via ${envelope.transportHost}:${envelope.transportPort} as ${envelope.username} -> ${message.to.join(",")}`
    );
  }

  resolveEnvelope(context: SmtpProviderContext): SmtpResolvedEnvelope {
    const smtp = context.config.smtp;
    if (!smtp) {
      throw new Error("SMTP configuration is required for SMTP send operations.");
    }

    return {
      transportHost: smtp.host,
      transportPort: smtp.port,
      transportSecure: smtp.secure,
      username: smtp.username,
      from: context.account.email
    };
  }

  private prepareMessage(
    context: SmtpProviderContext,
    payload: MailComposerPayload
  ): SmtpPreparedMessage {
    return {
      ...payload,
      to: payload.to,
      from: payload.from || context.account.email
    };
  }
}
