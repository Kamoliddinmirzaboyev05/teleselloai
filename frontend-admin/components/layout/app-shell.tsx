"use client";

import { Bot, LayoutDashboard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { clearToken } from "@/lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  function logout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-16 border-r border-border bg-white lg:flex lg:flex-col lg:items-center lg:py-4">
        <div className="mb-6 flex h-9 w-9 items-center justify-center rounded bg-primary text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded text-primary" title="Dashboard">
          <LayoutDashboard className="h-5 w-5" />
        </button>
        <button
          onClick={logout}
          className="mt-auto flex h-9 w-9 items-center justify-center rounded text-muted-foreground hover:bg-muted"
          title="Chiqish"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </aside>
      <main className="lg:pl-16">{children}</main>
    </div>
  );
}
