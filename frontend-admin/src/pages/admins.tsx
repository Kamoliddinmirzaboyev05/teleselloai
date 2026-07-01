import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createUser, fetchMe, fetchUsers, updateUser } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";

export default function AdminsPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const me = await fetchMe();
      if (me.role !== "superadmin") {
        navigate("/dashboard");
        return;
      }
      setUsers(await fetchUsers());
    } catch {
      setError("Adminlar ro'yxatini yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  async function onCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const created = await createUser({
        username,
        password,
        full_name: fullName || undefined,
        role,
      });
      setUsers((current) => [created, ...current]);
      setUsername("");
      setFullName("");
      setPassword("");
      setRole("admin");
    } catch {
      setError("Admin yaratib bo'lmadi. Login takrorlanmaganini tekshiring.");
    }
  }

  async function onToggleActive(user: AdminUser) {
    const updated = await updateUser(user.id, { is_active: !user.is_active });
    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function onChangeRole(user: AdminUser, nextRole: "admin" | "superadmin") {
    const updated = await updateUser(user.id, { role: nextRole });
    setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-background">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-5">
          <div>
            <h1 className="text-lg font-semibold">Adminlar</h1>
            <p className="text-sm text-muted-foreground">Foydalanuvchi va rollarni boshqarish</p>
          </div>
          <Button variant="outline" onClick={loadUsers}>
            <RefreshCw className="h-4 w-4" />
            Yangilash
          </Button>
        </header>

        <div className="grid gap-5 p-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <form onSubmit={onCreate} className="h-fit rounded border border-border bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Yangi admin</h2>
            </div>
            <label className="mb-3 block text-sm font-medium">
              Login
              <Input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1" required />
            </label>
            <label className="mb-3 block text-sm font-medium">
              Ism
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1" />
            </label>
            <label className="mb-3 block text-sm font-medium">
              Parol
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1"
                required
              />
            </label>
            <label className="mb-4 block text-sm font-medium">
              Rol
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as "admin" | "superadmin")}
                className="mt-1 h-10 w-full rounded border border-border bg-white px-3 text-sm"
              >
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </label>
            {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full">
              <UserPlus className="h-4 w-4" />
              Qo&apos;shish
            </Button>
          </form>

          <section className="rounded border border-border bg-white">
            <div className="flex h-12 items-center justify-between border-b border-border px-4">
              <h2 className="text-sm font-semibold">Adminlar ro&apos;yxati</h2>
              <span className="text-xs text-muted-foreground">{users.length} ta</span>
            </div>
            <div className="divide-y divide-border">
              {loading ? <div className="p-4 text-sm text-muted-foreground">Yuklanmoqda</div> : null}
              {users.map((user) => (
                <div key={user.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px_140px_120px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{user.full_name || user.username}</p>
                      {user.role === "superadmin" ? <ShieldCheck className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                  <select
                    value={user.role}
                    onChange={(event) => onChangeRole(user, event.target.value as "admin" | "superadmin")}
                    className="h-9 rounded border border-border bg-white px-2 text-sm"
                  >
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                  <span className={user.is_active ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
                    {user.is_active ? "active" : "blocked"}
                  </span>
                  <Button variant="outline" onClick={() => onToggleActive(user)}>
                    {user.is_active ? "Bloklash" : "Yoqish"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
