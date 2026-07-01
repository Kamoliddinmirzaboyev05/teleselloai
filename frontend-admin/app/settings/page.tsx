"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getApiBaseUrl, saveApiBaseUrl } from "@/lib/api-config";

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setBaseUrl(getApiBaseUrl());
  }, []);

  function onSave() {
    saveApiBaseUrl(baseUrl);
    setBaseUrl(getApiBaseUrl());
    setMessage("Base URL saqlandi");
  }

  async function onCheck() {
    setChecking(true);
    setMessage("");
    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/health`);
      if (!response.ok) {
        throw new Error("Health check failed");
      }
      setMessage("Backend ulanmoqda: OK");
    } catch {
      setMessage("Backendga ulanib bo'lmadi");
    } finally {
      setChecking(false);
    }
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-background">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5">
          <div>
            <h1 className="text-lg font-semibold">Sozlamalar</h1>
            <p className="text-sm text-muted-foreground">Admin panel qaysi backend APIga ulanishini boshqarish</p>
          </div>
        </header>

        <div className="max-w-3xl p-5">
          <section className="rounded border border-border bg-white p-4">
            <h2 className="text-sm font-semibold">Backend Base URL</h2>
            <label className="mt-4 block text-sm font-medium">
              API manzili
              <Input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                className="mt-1"
                placeholder="https://teleselloai-api.159.223.151.104.sslip.io"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={onSave}>
                <Save className="h-4 w-4" />
                Saqlash
              </Button>
              <Button variant="outline" onClick={onCheck} disabled={checking}>
                <CheckCircle2 className="h-4 w-4" />
                {checking ? "Tekshirilmoqda" : "Health check"}
              </Button>
            </div>
            {message ? <p className="mt-3 rounded bg-muted p-3 text-sm text-muted-foreground">{message}</p> : null}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
