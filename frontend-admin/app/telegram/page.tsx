"use client";

import { useCallback, useEffect, useState } from "react";
import { KeyRound, Send, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
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

export default function TelegramPage() {
  const router = useRouter();
  const [account, setAccount] = useState<TelegramAccount>(emptyAccount);
  const [apiHash, setApiHash] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const loadAccount = useCallback(async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      setAccount(await fetchTelegramAccount());
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  return (
    <AppShell>
      <main className="min-h-screen bg-background">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5">
          <div>
            <h1 className="text-lg font-semibold">Telegram ulash</h1>
            <p className="text-sm text-muted-foreground">Har admin o&apos;z Telegram accountini ulaydi</p>
          </div>
          <span className="rounded bg-muted px-3 py-1 text-xs">{loading ? "loading" : account.telegram_status}</span>
        </header>

        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <form onSubmit={onSave} className="rounded border border-border bg-white p-4">
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

            <form onSubmit={onVerify} className="rounded border border-border bg-white p-4">
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

          <aside className="h-fit rounded border border-border bg-white p-4">
            <h2 className="text-sm font-semibold">Holat</h2>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>Status: {account.telegram_status}</p>
              <p>API hash: {account.telegram_api_hash_set ? "saqlangan" : "kiritilmagan"}</p>
              {account.telegram_last_error ? <p className="text-red-600">{account.telegram_last_error}</p> : null}
              {message ? <p className="rounded bg-teal-50 p-2 text-primary">{message}</p> : null}
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
