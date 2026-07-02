import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/lib/api";
import { getApiBaseUrl, saveApiBaseUrl } from "@/lib/api-config";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBaseUrl(getApiBaseUrl());
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    saveApiBaseUrl(baseUrl);
    try {
      const response = await login(username, password);
      saveToken(response.access_token);
      navigate("/dashboard");
    } catch {
      setError("Login yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded border border-border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Telegram AI Sales CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Admin panelga kirish</p>
        </div>
        <label className="mb-3 block text-sm font-medium">
          Login
          <Input value={username} onChange={(event) => setUsername(event.target.value)} className="mt-1" />
        </label>
        <label className="mb-3 block text-sm font-medium">
          Backend Base URL
          <Input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            className="mt-1"
            placeholder="http://13.60.104.64"
          />
        </label>
        <label className="mb-4 block text-sm font-medium">
          Parol
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1"
          />
        </label>
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          <LogIn className="h-4 w-4" />
          {loading ? "Kirilmoqda" : "Kirish"}
        </Button>
      </form>
    </main>
  );
}
