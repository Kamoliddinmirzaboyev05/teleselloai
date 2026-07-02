const API_BASE_URL_KEY = "telegram_ai_sales_api_base_url";
export const SERVER_API_BASE_URL = "";

export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL ?? SERVER_API_BASE_URL;

export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_API_BASE_URL;
  }
  window.localStorage.removeItem(API_BASE_URL_KEY);
  return DEFAULT_API_BASE_URL;
}
