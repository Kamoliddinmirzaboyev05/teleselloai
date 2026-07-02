import type { Lead, LeadStatus } from "@/lib/types";

export function getProjectedLeads(
  leads: Lead[],
  activeId: string,
  overId: string,
  nextStatus: LeadStatus,
) {
  const activeLead = leads.find((lead) => lead.id === activeId);
  if (!activeLead) {
    return leads;
  }

  const activeIndex = leads.findIndex((lead) => lead.id === activeId);
  const withoutActive = leads.filter((lead) => lead.id !== activeId);
  const overLead = leads.find((lead) => lead.id === overId);

  if (overLead) {
    const overIndex = leads.findIndex((lead) => lead.id === overId);
    const overIndexAfterRemoval = withoutActive.findIndex((lead) => lead.id === overId);
    const insertIndex =
      activeLead.status === nextStatus && activeIndex < overIndex
        ? overIndexAfterRemoval + 1
        : overIndexAfterRemoval;
    return [
      ...withoutActive.slice(0, insertIndex),
      { ...activeLead, status: nextStatus },
      ...withoutActive.slice(insertIndex),
    ];
  }

  const columnLeadIndexes = leads
    .map((lead, index) => ({ lead, index }))
    .filter((item) => item.lead.status === nextStatus)
    .map((item) => item.index);
  const insertIndex = columnLeadIndexes.length ? columnLeadIndexes[columnLeadIndexes.length - 1] + 1 : leads.length;
  const adjustedIndex = activeIndex < insertIndex ? insertIndex - 1 : insertIndex;

  return [
    ...withoutActive.slice(0, adjustedIndex),
    { ...activeLead, status: nextStatus },
    ...withoutActive.slice(adjustedIndex),
  ];
}
