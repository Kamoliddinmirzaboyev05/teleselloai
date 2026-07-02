import { Bot, Clock, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Lead, LeadStatus } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export function LeadCard({
  lead,
  active,
  onClick,
  onChangeStatus,
}: {
  lead: Lead;
  active: boolean;
  onClick: () => void;
  onChangeStatus: (status: LeadStatus) => void;
}) {
  return (
    <article
      className={cn(
        "cursor-pointer rounded border bg-white p-3 text-sm transition hover:border-primary",
        active ? "border-primary shadow-sm" : "border-border",
      )}
      onClick={onClick}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{lead.first_name || "Nomsiz lead"}</h3>
          <p className="truncate text-xs text-muted-foreground">@{lead.telegram_username || lead.telegram_id}</p>
        </div>
        <Badge value={lead.status} />
      </div>
      {lead.ai_filter !== "default" ? (
        <p className="mb-2 inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-medium text-primary">
          <Bot className="h-3.5 w-3.5" />
          {lead.ai_filter === "allow" ? "AI yozsin" : "AI yozmasin"}
        </p>
      ) : null}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <Phone className="h-3.5 w-3.5" />
          {lead.phone || "Telefon yo'q"}
        </p>
        <p className="flex items-center gap-1">
          <UserRound className="h-3.5 w-3.5" />
          {lead.product_interest || "Qiziqish aniqlanmagan"}
        </p>
        <p className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(lead.last_user_message_at)}
        </p>
      </div>
      <select
        value={lead.status}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChangeStatus(event.target.value as LeadStatus)}
        className="mt-3 h-8 w-full rounded border border-border bg-white px-2 text-xs"
      >
        <option value="new">new</option>
        <option value="thinking">thinking</option>
        <option value="won">won</option>
        <option value="lost">lost</option>
      </select>
    </article>
  );
}
