import { useCallback, useEffect, useMemo, useState } from "react";
import { PauseCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ChatPanel } from "@/components/chat/chat-panel";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { fetchAIChatFilter, fetchAIPauseStatus, fetchLeadChat, fetchLeads, updateAIChatFilter, updateAIPauseStatus, updateLead } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { AIChatFilterMode, ChatMessage, Lead, LeadAIFilter, LeadStatus } from "@/lib/types";

const aiFilterOptions: Array<{ value: AIChatFilterMode; label: string }> = [
  { value: "all", label: "Hammaga yozsin" },
  { value: "humans", label: "Faqat odamlarga yozsin" },
  { value: "new", label: "Faqat yangi yozganlarga" },
  { value: "selected", label: "Faqat tanlangan chatlarga" },
  { value: "exclude", label: "Yozmasin listidan tashqari hammaga" },
  { value: "none", label: "Hech kimga yozmasin" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiPaused, setAiPaused] = useState(false);
  const [aiFilterMode, setAiFilterMode] = useState<AIChatFilterMode>("all");
  const [pauseSaving, setPauseSaving] = useState(false);
  const [pauseMessage, setPauseMessage] = useState("");

  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) ?? leads[0],
    [leads, selectedLeadId],
  );

  const loadLeads = useCallback(async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const [data, pauseStatus, filterStatus] = await Promise.all([fetchLeads(), fetchAIPauseStatus(), fetchAIChatFilter()]);
      setLeads(data);
      setAiPaused(pauseStatus.ai_paused);
      setAiFilterMode(filterStatus.mode);
      if (!selectedLeadId && data[0]) {
        setSelectedLeadId(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, selectedLeadId]);

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

  async function onChangeLeadAIFilter(lead: Lead, aiFilter: LeadAIFilter) {
    const updated = await updateLead(lead.id, { ai_filter: aiFilter });
    setLeads((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function onChangeAIChatFilter(mode: AIChatFilterMode) {
    const updated = await updateAIChatFilter(mode);
    setAiFilterMode(updated.mode);
  }

  async function onTogglePause() {
    setPauseSaving(true);
    setPauseMessage("");
    try {
      const updated = await updateAIPauseStatus({ ai_paused: !aiPaused });
      setAiPaused(updated.ai_paused);
    } catch {
      setPauseMessage("Global AI pause uchun backendni yangilash kerak.");
    } finally {
      setPauseSaving(false);
    }
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
            <select
              value={aiFilterMode}
              onChange={(event) => void onChangeAIChatFilter(event.target.value as AIChatFilterMode)}
              className="h-9 rounded border border-border bg-white px-3 text-sm"
              title="AI kimga yozsin"
            >
              {aiFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button variant={aiPaused ? "primary" : "secondary"} onClick={onTogglePause} disabled={pauseSaving}>
              <PauseCircle className="h-4 w-4" />
              {aiPaused ? "AI ni yoqish" : "AI ni o'chirish"}
            </Button>
            <Button variant="outline" onClick={loadLeads}>
              <RefreshCw className="h-4 w-4" />
              Yangilash
            </Button>
          </div>
        </header>
        {pauseMessage ? <p className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-sm text-amber-800">{pauseMessage}</p> : null}
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
          <ChatPanel
            lead={selectedLead ?? null}
            messages={messages}
            aiPaused={aiPaused}
            onChangeStatus={onChangeStatus}
            onChangeAIFilter={onChangeLeadAIFilter}
          />
        </div>
      </div>
    </AppShell>
  );
}
