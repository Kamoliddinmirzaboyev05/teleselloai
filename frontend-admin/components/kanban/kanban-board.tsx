import { DndContext, DragEndEvent, useDroppable } from "@dnd-kit/core";

import type { Lead, LeadAIFilter, LeadStatus } from "@/lib/types";
import { LeadCard } from "@/components/kanban/lead-card";
import { cn } from "@/lib/utils";

const columns: Array<{ id: LeadStatus; title: string }> = [
  { id: "new", title: "Yangi mijozlar" },
  { id: "thinking", title: "O'ylayotganlar" },
  { id: "won", title: "Muvaffaqiyatli" },
  { id: "lost", title: "Rad etganlar" },
];

export function KanbanBoard({
  leads,
  loading,
  selectedLeadId,
  onSelectLead,
  onChangeStatus,
  onChangeAIFilter,
}: {
  leads: Lead[];
  loading: boolean;
  selectedLeadId?: string;
  onSelectLead: (lead: Lead) => void;
  onChangeStatus: (lead: Lead, status: LeadStatus) => void;
  onChangeAIFilter: (lead: Lead, aiFilter: LeadAIFilter) => void;
}) {
  function handleDragEnd(event: DragEndEvent) {
    const nextStatus = event.over?.id as LeadStatus | undefined;
    const lead = event.active.data.current?.lead as Lead | undefined;
    if (!lead || !nextStatus || lead.status === nextStatus) {
      return;
    }
    onChangeStatus(lead, nextStatus);
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid min-w-[980px] grid-cols-4 gap-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            leads={leads.filter((lead) => lead.status === column.id)}
            loading={loading}
            selectedLeadId={selectedLeadId}
            onSelectLead={onSelectLead}
            onChangeStatus={onChangeStatus}
            onChangeAIFilter={onChangeAIFilter}
          />
        ))}
      </div>
    </DndContext>
  );
}

function KanbanColumn({
  column,
  leads,
  loading,
  selectedLeadId,
  onSelectLead,
  onChangeStatus,
  onChangeAIFilter,
}: {
  column: { id: LeadStatus; title: string };
  leads: Lead[];
  loading: boolean;
  selectedLeadId?: string;
  onSelectLead: (lead: Lead) => void;
  onChangeStatus: (lead: Lead, status: LeadStatus) => void;
  onChangeAIFilter: (lead: Lead, aiFilter: LeadAIFilter) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-[calc(100vh-156px)] flex-col rounded border border-border bg-white transition",
        isOver && "border-primary bg-teal-50/50",
      )}
    >
      <div className="flex min-h-14 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{column.title}</h2>
        <span className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{leads.length}</span>
      </div>
      <div className="flex-1 space-y-3 overflow-auto p-3">
        {loading ? <div className="h-24 animate-pulse rounded bg-muted" /> : null}
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            active={lead.id === selectedLeadId}
            onClick={() => onSelectLead(lead)}
            onChangeStatus={(status) => onChangeStatus(lead, status)}
            onChangeAIFilter={(aiFilter) => onChangeAIFilter(lead, aiFilter)}
          />
        ))}
        {!loading && leads.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
            Bu ustun bo'sh
          </div>
        ) : null}
      </div>
    </section>
  );
}
