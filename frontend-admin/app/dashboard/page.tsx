"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PauseCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Button } from "@/components/ui/button";
import { fetchLeadChat, fetchLeads, updateLead } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ChatMessage, Lead, LeadStatus } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0],
    [leads, selectedLeadId],
  );

  const loadLeads = useCallback(async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const data = await fetchLeads();
      setLeads(data);
      if (!selectedLeadId && data[0]) {
        setSelectedLeadId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [router, selectedLeadId]);

  const loadChat = useCallback(async (leadId: string) => {
    setMessages(await fetchLeadChat(leadId));
  }, []);

  async function onSelectLead(lead: Lead) {
    setSelectedLeadId(lead.id);
    await loadChat(lead.id);
  }

  async function onChangeStatus(lead: Lead, status: LeadStatus) {
    const updated = await updateLead(lead.id, { status });
    setLeads((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function onTogglePause(lead: Lead) {
    const updated = await updateLead(lead.id, { ai_paused: !lead.ai_paused });
    setLeads((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    if (selectedLead?.id) {
      void loadChat(selectedLead.id);
    }
  }, [loadChat, selectedLead?.id]);

  return (
    <AppShell>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5">
          <div>
            <h1 className="text-lg font-semibold">CRM Dashboard</h1>
            <p className="text-sm text-muted-foreground">{leads.length} ta lead</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedLead ? (
              <Button variant="secondary" onClick={() => onTogglePause(selectedLead)}>
                <PauseCircle className="h-4 w-4" />
                {selectedLead.ai_paused ? "AI yoqish" : "AI pause"}
              </Button>
            ) : null}
            <Button variant="outline" onClick={loadLeads}>
              <RefreshCw className="h-4 w-4" />
              Yangilash
            </Button>
          </div>
        </header>
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="overflow-auto p-4">
            <KanbanBoard
              leads={leads}
              loading={loading}
              selectedLeadId={selectedLead?.id}
              onSelectLead={onSelectLead}
              onChangeStatus={onChangeStatus}
            />
          </section>
          <ChatPanel lead={selectedLead ?? null} messages={messages} onChangeStatus={onChangeStatus} />
        </div>
      </div>
    </AppShell>
  );
}
