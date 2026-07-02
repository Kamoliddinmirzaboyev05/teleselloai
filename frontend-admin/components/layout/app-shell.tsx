"use client";

import { useEffect, useState } from "react";
import { Bot, LayoutDashboard, LogOut, Send, Settings, SlidersHorizontal, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { fetchMe } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import type { CurrentUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ai-settings", label: "AI sozlamalar", icon: SlidersHorizontal },
  { to: "/telegram", label: "Telegram ulash", icon: Send },
  { to: "/settings", label: "Sozlamalar", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    void fetchMe()
      .then(setUser)
      .catch(() => {
        clearToken();
        navigate("/login");
      });
  }, [navigate]);

  function logout() {
    clearToken();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-white lg:flex lg:flex-col lg:p-4">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">TeleSel AI</p>
            <p className="truncate text-xs text-muted-foreground">Sales CRM</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={cn(
                  "flex h-10 w-full items-center gap-3 rounded px-3 text-left text-sm font-medium transition duration-150",
                  pathname === item.to
                    ? "bg-teal-50 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {user?.role === "superadmin" ? (
          <button
            onClick={() => navigate("/admins")}
            className={cn(
              "mt-1 flex h-10 w-full items-center gap-3 rounded px-3 text-left text-sm font-medium transition duration-150",
              pathname === "/admins"
                ? "bg-teal-50 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            title="Adminlar"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span>Adminlar</span>
          </button>
        ) : null}

        <div className="mt-auto rounded border border-border bg-background p-3">
          {user ? (
            <>
              <p className="truncate text-sm font-medium">{user.username}</p>
              <p className="mt-1 text-xs text-muted-foreground">{user.role}</p>
            </>
          ) : (
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className="mt-3 flex h-10 w-full items-center gap-3 rounded px-3 text-sm font-medium text-muted-foreground transition duration-150 hover:bg-muted hover:text-foreground"
          title="Chiqish"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Chiqish</span>
        </button>
      </aside>
      <main className="animate-page-enter lg:pl-60">{children}</main>
    </div>
  );
}
