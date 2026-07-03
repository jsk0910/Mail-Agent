import { Body, Controller, Post } from "@nestjs/common";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthenticatedUserContext } from "../../common/auth/authenticated-user.types";
import { SyncService } from "./sync.service";
import { CreateSyncJobDto } from "./sync.types";

@Controller("sync/jobs")
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post()
  async createSyncJob(
    @CurrentUser() user: AuthenticatedUserContext,
    @Body() body: CreateSyncJobDto
  ) {
    return {
      item: await this.syncService.createJob(user, body)
    };
  }
}
