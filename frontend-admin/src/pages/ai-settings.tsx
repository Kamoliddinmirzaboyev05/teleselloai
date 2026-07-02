import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fetchAISettings, fetchGroqKeyStatus, updateAISettings, updateGroqKey } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { AISettings, FAQItem } from "@/lib/types";

const emptySettings: AISettings = {
  business_name: "",
  business_description: "",
  services: "",
  pricing: "",
  target_customers: "",
  tone: "samimiy, qisqa, professional",
  languages: "o'zbekcha",
  required_lead_fields: "ism, telefon, qiziqayotgan mahsulot",
  forbidden_topics: "",
  escalation_rules: "",
  custom_instructions: "",
  faq: [],
};

type TextAISettingsKey = Exclude<keyof AISettings, "faq">;

const textareas: Array<{ key: TextAISettingsKey; label: string; rows?: number }> = [
  { key: "business_description", label: "Biznes haqida", rows: 4 },
  { key: "services", label: "Xizmatlar / mahsulotlar", rows: 5 },
  { key: "pricing", label: "Narxlar", rows: 4 },
  { key: "target_customers", label: "Mijozlar kimlar", rows: 3 },
  { key: "forbidden_topics", label: "AI aytmasligi kerak bo'lgan gaplar", rows: 3 },
  { key: "escalation_rules", label: "Admin chaqiriladigan holatlar", rows: 3 },
  { key: "custom_instructions", label: "Qo'shimcha ko'rsatmalar", rows: 4 },
];

export default function AISettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AISettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState("");
  const [groqKeySet, setGroqKeySet] = useState(false);
  const [savingGroqKey, setSavingGroqKey] = useState(false);
  const [groqKeyMessage, setGroqKeyMessage] = useState("");

  const loadSettings = useCallback(async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const [nextSettings, keyStatus] = await Promise.all([fetchAISettings(), fetchGroqKeyStatus()]);
      setSettings(nextSettings);
      setGroqKeySet(keyStatus.groq_api_key_set);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateField<K extends keyof AISettings>(key: K, value: AISettings[K]) {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function updateTextField(key: TextAISettingsKey, value: string) {
    updateField(key, value);
  }

  function updateFAQ(index: number, patch: Partial<FAQItem>) {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      faq: current.faq.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  }

  function addFAQ() {
    updateField("faq", [...settings.faq, { question: "", answer: "" }]);
  }

  function removeFAQ(index: number) {
    updateField(
      "faq",
      settings.faq.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function onSave() {
    setSaving(true);
    try {
      setSettings(await updateAISettings(settings));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  async function onSaveGroqKey() {
    setSavingGroqKey(true);
    setGroqKeyMessage("");
    try {
      const status = await updateGroqKey(groqApiKey);
      setGroqKeySet(status.groq_api_key_set);
      setGroqApiKey("");
      setGroqKeyMessage(status.groq_api_key_set ? "Groq API key saqlandi" : "Groq API key o'chirildi");
    } catch {
      setGroqKeyMessage("Groq API key saqlanmadi");
    } finally {
      setSavingGroqKey(false);
    }
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-background">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5">
          <div>
            <h1 className="text-lg font-semibold">AI Sozlamalar</h1>
            <p className="text-sm text-muted-foreground">AI sotuvchini biznesingizga mos gapirtiring</p>
          </div>
          <Button onClick={onSave} disabled={loading || saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saqlanmoqda" : "Saqlash"}
          </Button>
        </header>

        <div className="mx-auto grid max-w-6xl gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <div className="rounded border border-border bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <label className="block flex-1 text-sm font-medium">
                  Groq API key
                  <Input
                    type="password"
                    value={groqApiKey}
                    onChange={(event) => {
                      setGroqKeyMessage("");
                      setGroqApiKey(event.target.value);
                    }}
                    className="mt-1"
                    placeholder={groqKeySet ? "Saqlangan, almashtirish uchun yangisini kiriting" : "gsk_..."}
                  />
                </label>
                <Button onClick={onSaveGroqKey} disabled={loading || savingGroqKey}>
                  <Save className="h-4 w-4" />
                  {savingGroqKey ? "Saqlanmoqda" : "Key saqlash"}
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {groqKeySet ? "Groq key saqlangan. Xavfsizlik uchun key qayta ko'rsatilmaydi." : "AI javob berishi uchun Groq API key kerak."}
              </p>
              {groqKeyMessage ? <p className="mt-3 rounded bg-teal-50 p-2 text-sm text-primary">{groqKeyMessage}</p> : null}
            </div>

            <div className="rounded border border-border bg-white p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Biznes nomi
                  <Input
                    value={settings.business_name}
                    onChange={(event) => updateField("business_name", event.target.value)}
                    className="mt-1"
                    placeholder="Masalan: Telesello AI"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Javob tili
                  <Input
                    value={settings.languages}
                    onChange={(event) => updateField("languages", event.target.value)}
                    className="mt-1"
                    placeholder="o'zbekcha, ruscha"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Gapirish uslubi
                  <Input
                    value={settings.tone}
                    onChange={(event) => updateField("tone", event.target.value)}
                    className="mt-1"
                    placeholder="samimiy, qisqa, professional"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Mijozdan olinadigan ma&apos;lumotlar
                  <Input
                    value={settings.required_lead_fields}
                    onChange={(event) => updateField("required_lead_fields", event.target.value)}
                    className="mt-1"
                    placeholder="ism, telefon, xizmat turi"
                  />
                </label>
              </div>
            </div>

            <div className="rounded border border-border bg-white p-4">
              <div className="grid gap-4">
                {textareas.map((item) => (
                  <label key={item.key} className="block text-sm font-medium">
                    {item.label}
                    <Textarea
                      value={String(settings[item.key] ?? "")}
                      onChange={(event) => updateTextField(item.key, event.target.value)}
                      rows={item.rows}
                      className="mt-1"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Savol-javob namunalari</h2>
                <Button variant="outline" onClick={addFAQ}>
                  <Plus className="h-4 w-4" />
                  Qo&apos;shish
                </Button>
              </div>
              <div className="space-y-3">
                {settings.faq.map((item, index) => (
                  <div key={index} className="rounded border border-border p-3">
                    <div className="mb-2 flex justify-end">
                      <Button variant="ghost" onClick={() => removeFAQ(index)} title="O'chirish">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={item.question}
                      onChange={(event) => updateFAQ(index, { question: event.target.value })}
                      placeholder="Mijoz savoli"
                    />
                    <Textarea
                      value={item.answer}
                      onChange={(event) => updateFAQ(index, { answer: event.target.value })}
                      placeholder="AI javobi"
                      className="mt-2"
                    />
                  </div>
                ))}
                {settings.faq.length === 0 ? (
                  <p className="rounded border border-dashed border-border p-4 text-sm text-muted-foreground">
                    Hali FAQ yo&apos;q. Eng ko&apos;p keladigan savollar va ideal javoblarni qo&apos;shing.
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="h-fit rounded border border-border bg-white p-4">
            <h2 className="text-sm font-semibold">Prompt preview</h2>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              <p>AI har javobdan oldin shu ma&apos;lumotlardan foydalanadi.</p>
              <p>Narx, xizmat va FAQ qanchalik aniq bo&apos;lsa, javoblar shunchalik barqaror bo&apos;ladi.</p>
              <p>Telefon yig&apos;ish va status aniqlash qoidalari avtomatik saqlanadi.</p>
              {saved ? <p className="rounded bg-emerald-50 p-2 text-emerald-700">Saqlangan</p> : null}
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
