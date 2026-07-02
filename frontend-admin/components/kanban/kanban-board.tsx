import { useRef } from "react";
import { closestCorners, DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

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
  onReorderLeads,
}: {
  leads: Lead[];
  loading: boolean;
  selectedLeadId?: string;
  onSelectLead: (lead: Lead) => void;
  onChangeStatus: (lead: Lead, status: LeadStatus) => void;
  onChangeAIFilter: (lead: Lead, aiFilter: LeadAIFilter) => void;
  onReorderLeads: (leads: Lead[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeOriginalStatusRef = useRef<LeadStatus | null>(null);

  function findLead(leadId: string) {
    return leads.find((lead) => lead.id === leadId);
  }

  function getOverStatus(event: DragOverEvent | DragEndEvent): LeadStatus | null {
    const over = event.over;
    if (!over) {
      return null;
    }
    if (over.data.current?.type === "column") {
      return over.data.current.status as LeadStatus;
    }
    if (over.data.current?.type === "lead") {
      return (over.data.current.lead as Lead).status;
    }
    return null;
  }

  function getProjectedLeads(activeId: string, overId: string, nextStatus: LeadStatus) {
    const activeLead = findLead(activeId);
    if (!activeLead) {
      return leads;
    }
    const overLead = findLead(overId);
    const activeIndex = leads.findIndex((lead) => lead.id === activeId);
    if (overLead) {
      const overIndex = leads.findIndex((lead) => lead.id === overId);
      const movedLead = { ...activeLead, status: nextStatus };
      const withoutActive = leads.filter((lead) => lead.id !== activeId);
      const overIndexAfterRemoval = withoutActive.findIndex((lead) => lead.id === overId);
      const insertIndex = activeIndex < overIndex ? overIndexAfterRemoval + 1 : overIndexAfterRemoval;
      return [...withoutActive.slice(0, insertIndex), movedLead, ...withoutActive.slice(insertIndex)];
    }

    const columnLeadIndexes = leads
      .map((lead, index) => ({ lead, index }))
      .filter((item) => item.lead.status === nextStatus)
      .map((item) => item.index);
    const insertIndex = columnLeadIndexes.length ? columnLeadIndexes[columnLeadIndexes.length - 1] + 1 : leads.length;
    const withoutActive = leads.filter((lead) => lead.id !== activeId);
    const adjustedIndex = activeIndex < insertIndex ? insertIndex - 1 : insertIndex;
    return [
      ...withoutActive.slice(0, adjustedIndex),
      { ...activeLead, status: nextStatus },
      ...withoutActive.slice(adjustedIndex),
    ];
  }

  function handleDragStart(_event: DragStartEvent) {
    const lead = findLead(String(_event.active.id));
    activeOriginalStatusRef.current = lead?.status ?? null;
    window.getSelection()?.removeAllRanges();
  }

  function handleDragOver(event: DragOverEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : "";
    const nextStatus = getOverStatus(event);
    if (!nextStatus || !overId) {
      return;
    }
    const activeLead = findLead(activeId);
    if (!activeLead || activeLead.status === nextStatus) {
      return;
    }
    onReorderLeads(getProjectedLeads(activeId, overId, nextStatus));
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : "";
    const nextStatus = getOverStatus(event);
    const activeLead = findLead(activeId);
    if (!activeLead || !nextStatus || !overId) {
      return;
    }
    const finalLeads = getProjectedLeads(activeId, overId, nextStatus);
    onReorderLeads(finalLeads);
    if (activeOriginalStatusRef.current && activeOriginalStatusRef.current !== nextStatus) {
      onChangeStatus(activeLead, nextStatus);
      activeOriginalStatusRef.current = null;
      return;
    }
    activeOriginalStatusRef.current = null;
    if (overId !== activeId) {
      const oldIndex = leads.findIndex((lead) => lead.id === activeId);
      const newIndex = leads.findIndex((lead) => lead.id === overId);
      if (oldIndex >= 0 && newIndex >= 0) {
        onReorderLeads(arrayMove(leads, oldIndex, newIndex));
      }
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="grid h-full min-w-[980px] grid-cols-4 gap-4">
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
  const { isOver, setNodeRef } = useDroppable({ id: column.id, data: { type: "column", status: column.id } });
  const { setNodeRef: setSortableNodeRef } = useDroppable({ id: `${column.id}-items`, data: { type: "column", status: column.id } });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-0 flex-col rounded-lg border border-border bg-white shadow-sm transition",
        isOver && "border-primary bg-teal-50/50",
      )}
    >
      <div className="flex min-h-14 items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{column.title}</h2>
        <span className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">{leads.length}</span>
      </div>
      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div ref={setSortableNodeRef} className="flex-1 space-y-3 overflow-y-auto p-3">
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
      </SortableContext>
    </section>
  );
}
