export type LeadStatus = "new" | "thinking" | "won" | "lost";

export type Lead = {
  id: string;
  account_id: string;
  telegram_id: number;
  telegram_username: string | null;
  first_name: string | null;
  phone: string | null;
  product_interest: string | null;
  status: LeadStatus;
  ai_paused: boolean;
  last_user_message_at: string | null;
  last_ai_message_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  lead_id: string;
  telegram_message_id: number | null;
  role: "user" | "assistant" | "admin" | "system";
  content: string;
  is_audio: boolean;
  audio_path: string | null;
  created_at: string;
};
