import type { Lead, LeadStatus } from "@/lib/types";
import { LeadCard } from "@/components/kanban/lead-card";

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
}: {
  leads: Lead[];
  loading: boolean;
  selectedLeadId?: string;
  onSelectLead: (lead: Lead) => void;
  onChangeStatus: (lead: Lead, status: LeadStatus) => void;
}) {
  return (
    <div className="grid min-w-[980px] grid-cols-4 gap-3">
      {columns.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.id);
        return (
          <div key={column.id} className="rounded border border-border bg-white">
            <div className="flex h-12 items-center justify-between border-b border-border px-3">
              <h2 className="text-sm font-semibold">{column.title}</h2>
              <span className="text-xs text-muted-foreground">{columnLeads.length}</span>
            </div>
            <div className="space-y-2 p-2">
              {loading ? <div className="h-20 rounded bg-muted" /> : null}
              {columnLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  active={lead.id === selectedLeadId}
                  onClick={() => onSelectLead(lead)}
                  onChangeStatus={(status) => onChangeStatus(lead, status)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
