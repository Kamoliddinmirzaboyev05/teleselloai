import { useCallback, useEffect, useState } from "react";
import { KeyRound, Send, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AppShell, SidebarToggleButton } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchTelegramAccount, startTelegramLogin, updateTelegramAccount, verifyTelegramLogin } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { TelegramAccount } from "@/lib/types";

const emptyAccount: TelegramAccount = {
  account_id: "",
  name: "",
  telegram_api_id: "",
  telegram_api_hash_set: false,
  telegram_phone: "",
  telegram_status: "disconnected",
  telegram_last_error: null,
};

const setupSteps = [
  "my.telegram.org saytiga kiring va telefon raqamingiz bilan login qiling.",
  "API development tools bo'limidan app yarating.",
  "api_id va api_hash qiymatlarini shu forma ichiga kiriting.",
  "Telefon raqamingizni +998... formatida yozing, Saqlash va Kod yuborish bosing.",
  "Telegramga kelgan kodni kiriting. Agar so'ralsa, 2FA parolni ham yozing.",
];

export default function TelegramPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState<TelegramAccount>(emptyAccount);
  const [apiHash, setApiHash] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      setAccount(await fetchTelegramAccount());
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadAccount();
  }, [loadAccount]);

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setMessage("");
    try {
      const updated = await updateTelegramAccount({
        name: account.name,
        telegram_api_id: account.telegram_api_id,
        telegram_api_hash: apiHash || undefined,
        telegram_phone: account.telegram_phone,
      });
      setAccount(updated);
      setApiHash("");
      setMessage("Telegram ma'lumotlari saqlandi");
    } catch {
      setMessage("Saqlashda xatolik bo'ldi");
    } finally {
      setWorking(false);
    }
  }

  async function onStartLogin() {
    setWorking(true);
    setMessage("");
    try {
      const response = await startTelegramLogin();
      setAccount((current) => ({ ...current, telegram_status: response.status }));
      setMessage(response.message);
    } catch {
      setMessage("Telegram kod yuborilmadi. API ID, hash va telefonni tekshiring.");
    } finally {
      setWorking(false);
    }
  }

  async function onVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorking(true);
    setMessage("");
    try {
      const response = await verifyTelegramLogin({ code, password: password || undefined });
      setMessage(response.message);
      if (!response.requires_password) {
        setCode("");
        setPassword("");
        await loadAccount();
      }
    } catch {
      setMessage("Kod yoki 2FA parol noto'g'ri");
    } finally {
      setWorking(false);
    }
  }

  const statusHint =
    account.telegram_status === "password_required"
      ? "Telegram 2FA parolini kiriting va yana Tasdiqlash bosing."
      : account.telegram_status === "code_sent"
        ? "Telegramga kelgan kodni kiriting."
        : "";

  return (
    <AppShell>
      <main className="min-h-screen bg-background">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5">
          <div className="flex items-center gap-3">
            <SidebarToggleButton />
            <div>
              <h1 className="text-lg font-semibold">Telegram ulash</h1>
              <p className="text-sm text-muted-foreground">Har admin o&apos;z Telegram accountini ulaydi</p>
            </div>
          </div>
          <span className="rounded bg-muted px-3 py-1 text-xs">{loading ? "yuklanmoqda" : account.telegram_status}</span>
        </header>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {loading ? (
              <div className="rounded border border-border bg-white p-4 shadow-sm">
                <div className="h-5 w-44 animate-pulse rounded bg-muted" />
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="h-20 animate-pulse rounded bg-muted" />
                  <div className="h-20 animate-pulse rounded bg-muted" />
                  <div className="h-20 animate-pulse rounded bg-muted" />
                  <div className="h-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ) : null}

            <form onSubmit={onSave} className="rounded border border-border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Telegram credential</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Account nomi
                  <Input
                    value={account.name}
                    onChange={(event) => setAccount((current) => ({ ...current, name: event.target.value }))}
                    className="mt-1"
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  Telefon
                  <Input
                    value={account.telegram_phone}
                    onChange={(event) => setAccount((current) => ({ ...current, telegram_phone: event.target.value }))}
                    className="mt-1"
                    placeholder="+998..."
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  App api_id
                  <Input
                    value={account.telegram_api_id}
                    onChange={(event) => setAccount((current) => ({ ...current, telegram_api_id: event.target.value }))}
                    className="mt-1"
                    required
                  />
                </label>
                <label className="block text-sm font-medium">
                  App api_hash
                  <Input
                    value={apiHash}
                    onChange={(event) => setApiHash(event.target.value)}
                    className="mt-1"
                    placeholder={account.telegram_api_hash_set ? "Saqlangan, o'zgartirish uchun yangisini kiriting" : ""}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit" disabled={working}>
                  <ShieldCheck className="h-4 w-4" />
                  Saqlash
                </Button>
                <Button type="button" variant="outline" onClick={onStartLogin} disabled={working}>
                  <Send className="h-4 w-4" />
                  Kod yuborish
                </Button>
              </div>
            </form>

            <form onSubmit={onVerify} className="rounded border border-border bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold">Telegram kodni tasdiqlash</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Telegram kod
                  <Input value={code} onChange={(event) => setCode(event.target.value)} className="mt-1" required />
                </label>
                <label className="block text-sm font-medium">
                  2FA parol
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-1"
                    placeholder="Agar Telegram so'rasa"
                  />
                </label>
              </div>
              <Button type="submit" className="mt-4" disabled={working}>
                <ShieldCheck className="h-4 w-4" />
                Tasdiqlash
              </Button>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="h-fit rounded border border-border bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Qayerdan olinadi?</h2>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                {setupSteps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-teal-50 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="h-fit rounded border border-border bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Holat</h2>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>Status: {account.telegram_status}</p>
                <p>API hash: {account.telegram_api_hash_set ? "saqlangan" : "kiritilmagan"}</p>
                {statusHint ? <p className="rounded bg-amber-50 p-2 text-amber-700">{statusHint}</p> : null}
                {account.telegram_last_error ? <p className="text-red-600">{account.telegram_last_error}</p> : null}
                {message ? <p className="rounded bg-teal-50 p-2 text-primary">{message}</p> : null}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
