import { describe, expect, it } from "vitest";

import type { Lead } from "@/lib/types";
import { getProjectedLeads } from "@/components/kanban/kanban-board.logic";

function lead(id: string, status: Lead["status"]): Lead {
  return {
    id,
    account_id: "account",
    telegram_id: Number(id.replace(/\D/g, "")) || 1,
    telegram_username: id,
    first_name: id,
    phone: null,
    product_interest: null,
    status,
    ai_paused: false,
    ai_filter: "default",
    last_user_message_at: null,
    last_ai_message_at: null,
    created_at: "2026-07-02T10:00:00Z",
    updated_at: "2026-07-02T10:00:00Z",
  };
}

describe("getProjectedLeads", () => {
  it("moves a dragged lead to the end of an empty column drop zone", () => {
    const leads = [lead("lead-1", "new"), lead("lead-2", "new")];

    const projected = getProjectedLeads(leads, "lead-1", "thinking", "thinking");

    expect(projected.map((item) => [item.id, item.status])).toEqual([
      ["lead-2", "new"],
      ["lead-1", "thinking"],
    ]);
  });

  it("places a dragged lead beside the card currently under the pointer", () => {
    const leads = [lead("lead-1", "new"), lead("lead-2", "thinking"), lead("lead-3", "thinking")];

    const projected = getProjectedLeads(leads, "lead-1", "lead-2", "thinking");

    expect(projected.map((item) => [item.id, item.status])).toEqual([
      ["lead-1", "thinking"],
      ["lead-2", "thinking"],
      ["lead-3", "thinking"],
    ]);
  });
});
