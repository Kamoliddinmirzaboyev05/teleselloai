import { getToken } from "@/lib/auth";
import type { AISettings, ChatMessage, Lead, LeadStatus } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function login(username: string, password: string) {
  return request<{ access_token: string; token_type: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function fetchLeads() {
  return request<Lead[]>("/api/leads");
}

export function fetchLeadChat(leadId: string) {
  return request<ChatMessage[]>(`/api/leads/${leadId}/chat`);
}

export function updateLead(leadId: string, patch: Partial<Pick<Lead, "first_name" | "phone" | "product_interest" | "ai_paused">> & { status?: LeadStatus }) {
  return request<Lead>(`/api/leads/${leadId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function fetchAISettings() {
  return request<AISettings>("/api/ai-settings");
}

export function updateAISettings(settings: AISettings) {
  return request<AISettings>("/api/ai-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}
