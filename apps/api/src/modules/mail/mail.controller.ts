import { Body, Controller, Get, Param, Patch, Post, Res } from "@nestjs/common";
import type { Response } from "express";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { MailService } from "./mail.service";
import {
  ApplyMessageLabelDto,
  ComposeMessageDto,
  DeleteMessageDto,
  ForwardMessageDto,
  ReplyMessageDto,
  RetryMessageActionDto,
  UpdateMessageArchiveStateDto,
  UpdateMessageReadStateDto
} from "./mail.types";

@Controller("mail")
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get("inbox")
  async getInbox(@CurrentUser() user: AuthenticatedUserContext) {
    return {
      items: await this.mailService.listInbox(user)
    };
  }

  @Get("messages/:messageId")
  async getMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string
  ) {
    return {
      item: await this.mailService.getMessage(user, messageId)
    };
  }

  @Get("messages/:messageId/attachments/:attachmentId/download")
  async downloadAttachment(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Param("attachmentId") attachmentId: string,
    @Res() res: Response
  ) {
    const attachment = await this.mailService.downloadAttachment(
      user,
      messageId,
      attachmentId
    );

    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(attachment.filename)}"`
    );
    res.setHeader("Content-Length", attachment.size);
    res.send(attachment.data);
  }

  @Get("messages/:messageId/action-logs/latest-failure")
  async getLatestFailedAction(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string
  ) {
    return {
      item: await this.mailService.getLatestFailedAction(user, messageId)
    };
  }

  @Post("compose")
  async composeMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: ComposeMessageDto
  ) {
    return {
      item: await this.mailService.composeMessage(user, body)
    };
  }

  @Post("messages/:messageId/reply")
  async replyToMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() body: ReplyMessageDto
  ) {
    return {
      item: await this.mailService.replyToMessage(user, messageId, body)
    };
  }

  @Post("messages/:messageId/forward")
  async forwardMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() body: ForwardMessageDto
  ) {
    return {
      item: await this.mailService.forwardMessage(user, messageId, body)
    };
  }

  @Patch("messages/:messageId/read-state")
  async updateReadState(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() body: UpdateMessageReadStateDto
  ) {
    return {
      item: await this.mailService.updateReadState(user, messageId, body)
    };
  }

  @Patch("messages/:messageId/archive-state")
  async updateArchiveState(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() body: UpdateMessageArchiveStateDto
  ) {
    return {
      item: await this.mailService.updateArchiveState(user, messageId, body)
    };
  }

  @Patch("messages/:messageId/delete")
  async deleteMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() body: DeleteMessageDto
  ) {
    return {
      item: await this.mailService.deleteMessage(user, messageId, body)
    };
  }

  @Patch("messages/:messageId/labels")
  async applyLabel(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() body: ApplyMessageLabelDto
  ) {
    return {
      item: await this.mailService.applyLabel(user, messageId, body)
    };
  }

  @Post("actions/:actionLogId/retry")
  async retryAction(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("actionLogId") actionLogId: string,
    @Body() body: RetryMessageActionDto
  ) {
    return {
      item: await this.mailService.retryAction(user, actionLogId, body)
    };
  }
}
