import { PauseCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ChatMessage, Lead, LeadStatus } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export function ChatPanel({
  lead,
  messages,
  onChangeStatus,
}: {
  lead: Lead | null;
  messages: ChatMessage[];
  onChangeStatus: (lead: Lead, status: LeadStatus) => void;
}) {
  if (!lead) {
    return <aside className="border-l border-border bg-white p-5 text-sm text-muted-foreground">Lead tanlanmagan</aside>;
  }

  return (
    <aside className="flex min-h-0 flex-col border-l border-border bg-white">
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{lead.first_name || "Nomsiz lead"}</h2>
            <p className="truncate text-sm text-muted-foreground">@{lead.telegram_username || lead.telegram_id}</p>
          </div>
          <Badge value={lead.status} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <span>{lead.phone || "Telefon yo'q"}</span>
          <span>{lead.product_interest || "Qiziqish yo'q"}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <select
            value={lead.status}
            onChange={(event) => onChangeStatus(lead, event.target.value as LeadStatus)}
            className="h-8 rounded border border-border bg-white px-2 text-xs"
          >
            <option value="new">new</option>
            <option value="thinking">thinking</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>
          {lead.ai_paused ? (
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
              <PauseCircle className="h-3.5 w-3.5" />
              AI pause
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className={cn("flex", message.role === "assistant" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[82%] rounded px-3 py-2 text-sm",
                message.role === "assistant" && "bg-primary text-primary-foreground",
                message.role === "user" && "bg-muted",
                message.role === "admin" && "bg-slate-900 text-white",
                message.role === "system" && "border border-border bg-white",
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="mt-1 text-[11px] opacity-70">{formatDateTime(message.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
