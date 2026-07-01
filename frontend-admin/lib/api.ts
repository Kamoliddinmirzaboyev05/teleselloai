import { getApiBaseUrl } from "@/lib/api-config";
import { getToken } from "@/lib/auth";
import type { AdminUser, AISettings, ChatMessage, CurrentUser, Lead, LeadStatus, TelegramAccount } from "@/lib/types";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
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
  return request<{ access_token: string; token_type: string; user: CurrentUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function fetchMe() {
  return request<CurrentUser>("/api/auth/me");
}

export function changePassword(payload: { current_password: string; new_password: string }) {
  return request<{ status: string }>("/api/auth/password", {
    method: "POST",
    body: JSON.stringify(payload),
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

export function fetchUsers() {
  return request<AdminUser[]>("/api/users");
}

export function createUser(payload: { username: string; password: string; full_name?: string; role?: "admin" | "superadmin" }) {
  return request<AdminUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(userId: string, payload: Partial<{ password: string; full_name: string | null; role: "admin" | "superadmin"; is_active: boolean }>) {
  return request<AdminUser>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchTelegramAccount() {
  return request<TelegramAccount>("/api/telegram-account");
}

export function updateTelegramAccount(payload: Partial<{ name: string; telegram_api_id: string; telegram_api_hash: string; telegram_phone: string }>) {
  return request<TelegramAccount>("/api/telegram-account", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function startTelegramLogin() {
  return request<{ status: string; message: string }>("/api/telegram-account/login/start", { method: "POST" });
}

export function verifyTelegramLogin(payload: { code: string; password?: string }) {
  return request<{ status: string; message: string; requires_password: boolean }>("/api/telegram-account/login/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
