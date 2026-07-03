import assert from "node:assert/strict";
import test from "node:test";
import { AgentResult } from "@prisma/client";

import { MailService } from "./mail.service";

test("retryAction retries failed mark_read using stored metadata", async () => {
  const calls: Array<{ isRead: boolean; reason?: string }> = [];

  const service = new MailService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never
  );

  Object.assign(service as object, {
    mailRepository: {
      findActionLogForUser: async () => ({
        id: "action_01",
        userId: "user_01",
        messageId: "message_01",
        actionType: "mark_read",
        reason: "failed previously",
        result: AgentResult.failure,
        metadata: {
          isRead: true
        }
      })
    },
    updateReadState: async (_user: unknown, _messageId: string, input: { isRead: boolean; reason?: string }) => {
      calls.push(input);
      return { id: "message_01" };
    }
  });

  await service.retryAction(
    { email: "tester@example.com", name: "Tester" },
    "action_01",
    {}
  );

  assert.deepEqual(calls, [
    {
      isRead: true,
      reason: "Retry requested for failed action mark_read."
    }
  ]);
});
