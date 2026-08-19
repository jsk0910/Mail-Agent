import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { MailComposerPayload, MailProviderKind } from "@mail-agent/shared";
import * as nodemailer from "nodemailer";

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
      bodyText: "This is a test send from the mail agent."
    });

    await this.sendMessage(context, message);
  }

  async sendMessage(context: SmtpProviderContext, payload: MailComposerPayload): Promise<void> {
    const envelope = this.resolveEnvelope(context);
    const message = this.prepareMessage(context, payload);

    if (!context.credentials?.password) {
      throw new BadRequestException("SMTP password is required to send emails.");
    }

    const transporter = nodemailer.createTransport({
      host: envelope.transportHost,
      port: envelope.transportPort,
      secure: envelope.transportSecure,
      auth: {
        user: envelope.username,
        pass: context.credentials.password
      }
    });

    try {
      const attachments = payload.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.from(
          attachment.contentBase64.replace(/^data:[^;]+;base64,/, ""),
          "base64"
        ),
        contentType: attachment.mimeType
      }));

      const info = await transporter.sendMail({
        from: message.from,
        to: message.to.join(", "),
        cc: message.cc && message.cc.length > 0 ? message.cc.join(", ") : undefined,
        bcc: message.bcc && message.bcc.length > 0 ? message.bcc.join(", ") : undefined,
        subject: message.subject,
        text: message.bodyText,
        html: message.bodyHtml,
        inReplyTo: payload.inReplyTo,
        references: payload.references,
        attachments
      });

      this.logger.log(`SMTP message sent successfully: ${info.messageId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown SMTP error";
      this.logger.error(`SMTP send failed: ${errorMessage}`);
      throw new BadRequestException(`SMTP send failed: ${errorMessage}`);
    }
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
