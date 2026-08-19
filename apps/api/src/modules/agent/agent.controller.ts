import {
  Body,
  Controller,
  Get,
  Param,
  Post
} from "@nestjs/common";
import { AgentService } from "./agent.service";
import { AnalyzeMessageDto, SaveLocalAnalysisDto, SuggestReplyDto } from "./agent.types";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";

@Controller("agent")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post("messages/:messageId/analyze")
  async analyzeMessage(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() dto: AnalyzeMessageDto
  ) {
    const item = await this.agentService.analyzeMessage(user, messageId, dto.instruction);
    return { item };
  }

  @Get("messages/:messageId/analysis")
  async getAnalysis(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string
  ) {
    const item = await this.agentService.getAnalysis(user, messageId);
    return { item };
  }

  @Post("messages/:messageId/analysis/local")
  async saveLocalAnalysis(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() dto: SaveLocalAnalysisDto
  ) {
    const item = await this.agentService.saveLocalAnalysis(user, messageId, dto);
    return { item };
  }

  @Post("messages/:messageId/suggest-reply")
  async suggestReply(
    @CurrentUser() user: AuthenticatedUserContext,
    @Param("messageId") messageId: string,
    @Body() dto: SuggestReplyDto
  ) {
    const item = await this.agentService.suggestReply(user, messageId, dto);
    return { item };
  }
}
