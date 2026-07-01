"use client";

import { Bot, LayoutDashboard, LogOut, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { clearToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

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
