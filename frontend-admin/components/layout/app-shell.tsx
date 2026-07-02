"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

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
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.localStorage.getItem("telegram_ai_sales_sidebar_collapsed") === "true";
  });

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

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("telegram_ai_sales_sidebar_collapsed", String(next));
      return next;
    });
  }

  const sidebarWidthClass = collapsed ? "lg:w-16" : "lg:w-60";
  const contentPaddingClass = collapsed ? "lg:pl-16" : "lg:pl-60";
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-white transition-[width] duration-200 lg:flex lg:flex-col",
          collapsed ? "lg:items-center lg:px-3 lg:py-4" : "lg:p-4",
          sidebarWidthClass,
        )}
      >
        <div className={cn("mb-7 flex w-full items-center", collapsed ? "justify-center" : "gap-3")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-5 w-5" />
          </div>
          <div className={cn("min-w-0", collapsed && "hidden")}>
            <p className="text-sm font-semibold leading-tight">TeleSel AI</p>
            <p className="truncate text-xs text-muted-foreground">Sales CRM</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            "mb-3 flex h-9 items-center rounded text-muted-foreground transition duration-150 hover:bg-muted hover:text-foreground",
            collapsed ? "w-10 justify-center" : "w-full gap-3 px-3 text-sm font-medium",
          )}
          title={collapsed ? "Sidebarni kengaytirish" : "Sidebarni yig'ish"}
          aria-label={collapsed ? "Sidebarni kengaytirish" : "Sidebarni yig'ish"}
        >
          <ToggleIcon className="h-4 w-4 shrink-0" />
          <span className={cn(collapsed && "hidden")}>{collapsed ? "" : "Sidebar"}</span>
        </button>

        <nav className={cn("space-y-1", collapsed && "flex w-full flex-col items-center")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                className={({ isActive }) =>
                  cn(
                    "flex h-10 items-center rounded text-sm font-medium transition duration-150",
                    collapsed ? "w-10 justify-center" : "w-full gap-3 px-3 text-left",
                    isActive
                      ? "bg-teal-50 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn("truncate", collapsed && "hidden")}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {user?.role === "superadmin" ? (
          <NavLink
            to="/admins"
            aria-label="Adminlar"
            className={({ isActive }) =>
              cn(
                "mt-1 flex h-10 items-center rounded text-sm font-medium transition duration-150",
                collapsed ? "w-10 justify-center" : "w-full gap-3 px-3 text-left",
                isActive
                  ? "bg-teal-50 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
            title="Adminlar"
          >
            <Users className="h-4 w-4 shrink-0" />
            <span className={cn(collapsed && "hidden")}>Adminlar</span>
          </NavLink>
        ) : null}

        <div className={cn("mt-auto rounded border border-border bg-background p-3", collapsed && "w-10 border-0 bg-transparent p-0")}>
          {user ? (
            <>
              {collapsed ? (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded bg-teal-50 text-sm font-semibold text-primary"
                  title={`${user.username} (${user.role})`}
                >
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
              ) : (
                <>
                  <p className="truncate text-sm font-medium">{user.username}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{user.role}</p>
                </>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className={cn("animate-pulse rounded bg-muted", collapsed ? "h-10 w-10" : "h-4 w-24")} />
              <div className={cn("h-3 w-16 animate-pulse rounded bg-muted", collapsed && "hidden")} />
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={cn(
            "mt-3 flex h-10 items-center rounded text-sm font-medium text-muted-foreground transition duration-150 hover:bg-muted hover:text-foreground",
            collapsed ? "w-10 justify-center" : "w-full gap-3 px-3",
          )}
          title="Chiqish"
          aria-label="Chiqish"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(collapsed && "hidden")}>Chiqish</span>
        </button>
      </aside>
      <main className={cn("animate-page-enter transition-[padding] duration-200", contentPaddingClass)}>{children}</main>
    </div>
  );
}
