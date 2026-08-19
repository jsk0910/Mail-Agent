import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { MailRepository } from "../mail/mail.repository";
import { LocalLlmService } from "./local-llm.service";
import { AgentService } from "./agent.service";
import { AgentController } from "./agent.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [AgentController],
  providers: [MailRepository, LocalLlmService, AgentService],
  exports: [AgentService, LocalLlmService]
})
export class AgentModule {}
