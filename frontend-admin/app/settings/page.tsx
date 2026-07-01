"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Save } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { changePassword } from "@/lib/api";
import { getApiBaseUrl, normalizeBaseUrl, saveApiBaseUrl } from "@/lib/api-config";

export default function SettingsPage() {
  const [baseUrl, setBaseUrl] = useState("");
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
      const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/health`);
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

  async function onChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage("");
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Yangi parol tasdiq bilan bir xil emas");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Parol o'zgartirildi");
    } catch {
      setPasswordMessage("Hozirgi parol noto'g'ri yoki yangi parol juda qisqa");
    } finally {
      setSavingPassword(false);
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

        <div className="max-w-3xl space-y-5 p-5">
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

          <section className="rounded border border-border bg-white p-4">
            <h2 className="text-sm font-semibold">Parolni o&apos;zgartirish</h2>
            <form onSubmit={onChangePassword} className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="block text-sm font-medium">
                Hozirgi parol
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="mt-1"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Yangi parol
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="mt-1"
                  minLength={6}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Tasdiqlash
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1"
                  minLength={6}
                  required
                />
              </label>
              <div className="md:col-span-3">
                <Button type="submit" disabled={savingPassword}>
                  <Save className="h-4 w-4" />
                  {savingPassword ? "Saqlanmoqda" : "Parolni saqlash"}
                </Button>
              </div>
            </form>
            {passwordMessage ? (
              <p className="mt-3 rounded bg-muted p-3 text-sm text-muted-foreground">{passwordMessage}</p>
            ) : null}
          </section>
        </div>
      </main>
    </AppShell>
  );
}
