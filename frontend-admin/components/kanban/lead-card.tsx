import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Bot, Clock, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Lead, LeadAIFilter, LeadStatus } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";

export function LeadCard({
  lead,
  active,
  onClick,
  onChangeStatus,
  onChangeAIFilter,
}: {
  lead: Lead;
  active: boolean;
  onClick: () => void;
  onChangeStatus: (status: LeadStatus) => void;
  onChangeAIFilter: (aiFilter: LeadAIFilter) => void;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: lead.id,
    data: { type: "lead", lead },
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer rounded-lg border bg-white p-3 text-sm shadow-sm transition hover:border-primary hover:shadow-md",
        active ? "border-primary shadow-sm ring-2 ring-teal-100" : "border-border",
        isDragging && "z-20 opacity-70 shadow-lg",
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
      <button
        type="button"
        className="mb-2 h-7 w-full rounded border border-dashed border-border bg-background text-xs font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
        onClick={(event) => event.stopPropagation()}
        title="Cardni boshqa ustunga ko'chirish"
        {...listeners}
        {...attributes}
      >
        Ko'chirish
      </button>
      {lead.ai_filter !== "default" ? (
        <p className="mb-2 inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-1 text-xs font-medium text-primary">
          <Bot className="h-3.5 w-3.5" />
          {lead.ai_filter === "allow" ? "Tanlangan" : "Yozmasin listida"}
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
      <select
        value={lead.ai_filter}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => onChangeAIFilter(event.target.value as LeadAIFilter)}
        className="mt-2 h-8 w-full rounded border border-border bg-white px-2 text-xs"
      >
        <option value="default">AI: oddiy</option>
        <option value="allow">AI: tanlanganlarga qo'shish</option>
        <option value="block">AI: yozmasin listiga qo'shish</option>
      </select>
    </article>
  );
}
