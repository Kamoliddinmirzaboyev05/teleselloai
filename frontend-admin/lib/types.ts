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

export type CurrentUser = {
  id: string;
  username: string;
  role: "admin" | "superadmin";
  account_id: string;
};

export type AdminUser = {
  id: string;
  username: string;
  full_name: string | null;
  role: "admin" | "superadmin";
  account_id: string;
  is_active: boolean;
  created_at: string;
};

export type TelegramAccount = {
  account_id: string;
  name: string;
  telegram_api_id: string;
  telegram_api_hash_set: boolean;
  telegram_phone: string;
  telegram_status: string;
  telegram_last_error: string | null;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type AISettings = {
  business_name: string;
  business_description: string;
  services: string;
  pricing: string;
  target_customers: string;
  tone: string;
  languages: string;
  required_lead_fields: string;
  forbidden_topics: string;
  escalation_rules: string;
  custom_instructions: string;
  faq: FAQItem[];
};

export type AIPauseStatus = {
  ai_paused: boolean;
};

export type GroqKeyStatus = {
  groq_api_key_set: boolean;
};
