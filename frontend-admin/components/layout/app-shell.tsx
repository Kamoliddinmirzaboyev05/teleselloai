"use client";

import { useEffect, useState } from "react";
import { Bot, LayoutDashboard, LogOut, Send, Settings, SlidersHorizontal, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { fetchMe } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import type { CurrentUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    void fetchMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        router.push("/login");
      });
  }, [router]);

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
        <button
          onClick={() => router.push("/dashboard")}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded",
            pathname === "/dashboard" ? "bg-teal-50 text-primary" : "text-muted-foreground hover:bg-muted",
          )}
          title="Dashboard"
        >
          <LayoutDashboard className="h-5 w-5" />
        </button>
        <button
          onClick={() => router.push("/ai-settings")}
          className={cn(
            "mt-2 flex h-9 w-9 items-center justify-center rounded",
            pathname === "/ai-settings" ? "bg-teal-50 text-primary" : "text-muted-foreground hover:bg-muted",
          )}
          title="AI Sozlamalar"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </button>
        <button
          onClick={() => router.push("/telegram")}
          className={cn(
            "mt-2 flex h-9 w-9 items-center justify-center rounded",
            pathname === "/telegram" ? "bg-teal-50 text-primary" : "text-muted-foreground hover:bg-muted",
          )}
          title="Telegram ulash"
        >
          <Send className="h-5 w-5" />
        </button>
        {user?.role === "superadmin" ? (
          <button
            onClick={() => router.push("/admins")}
            className={cn(
              "mt-2 flex h-9 w-9 items-center justify-center rounded",
              pathname === "/admins" ? "bg-teal-50 text-primary" : "text-muted-foreground hover:bg-muted",
            )}
            title="Adminlar"
          >
            <Users className="h-5 w-5" />
          </button>
        ) : null}
        <button
          onClick={() => router.push("/settings")}
          className={cn(
            "mt-2 flex h-9 w-9 items-center justify-center rounded",
            pathname === "/settings" ? "bg-teal-50 text-primary" : "text-muted-foreground hover:bg-muted",
          )}
          title="Sozlamalar"
        >
          <Settings className="h-5 w-5" />
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
