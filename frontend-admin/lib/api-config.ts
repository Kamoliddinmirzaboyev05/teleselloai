const API_BASE_URL_KEY = "telegram_ai_sales_api_base_url";
export const SERVER_API_BASE_URL = "";
const LEGACY_API_BASE_URLS = new Set([
  "https://teleselloai-api.159.223.151.104.sslip.io",
  "http://13.60.104.64",
]);

export const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_URL ?? SERVER_API_BASE_URL;

export function normalizeBaseUrl(value: string) {
  return value
    .trim()
    .replace(/\/docs\/?$/i, "")
    .replace(/\/+$/, "");
}

export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_API_BASE_URL;
  }
  const savedBaseUrl = normalizeBaseUrl(window.localStorage.getItem(API_BASE_URL_KEY) || "");
  if (!savedBaseUrl || LEGACY_API_BASE_URLS.has(savedBaseUrl)) {
    window.localStorage.removeItem(API_BASE_URL_KEY);
    return DEFAULT_API_BASE_URL;
  }
  return savedBaseUrl;
}

export function saveApiBaseUrl(value: string) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(API_BASE_URL_KEY, normalizeBaseUrl(value));
}
