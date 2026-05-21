'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base";
import { normalizeUser, saveUser } from "@/lib/auth";

const API_BASE = getApiBaseUrl();

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Ошибка входа");
        return;
      }

      const raw = await res.json();
      const user = normalizeUser(raw);
      if (!user) {
        setError("Некорректный ответ сервера. Проверьте версию API.");
        return;
      }
      saveUser(user);
      router.push("/profile");
    } catch {
      setError(
        `Не удалось связаться с сервером (${API_BASE}). Запустите API и проверьте NEXT_PUBLIC_API_BASE_URL.`
      );
    }
  };

  return (
    <main className="min-h-page flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-suai border border-suai-border bg-guap-card p-6 shadow-suai"
      >
        <h1 className="text-xl font-bold text-guap-heading">Вход</h1>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-1">
          <label className="text-sm font-medium text-suai-text">Email</label>
          <input
            type="email"
            className="w-full rounded-lg border border-suai-border bg-guap-input px-3 py-2 text-[13px] text-suai-text outline-none transition focus:border-suai-brand focus:ring-1 focus:ring-suai-brand"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-suai-text">Пароль</label>
          <input
            type="password"
            className="w-full rounded-lg border border-suai-border bg-guap-input px-3 py-2 text-[13px] text-suai-text outline-none transition focus:border-suai-brand focus:ring-1 focus:ring-suai-brand"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-suai-button px-3 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
        >
          Войти
        </button>

        <p className="text-center text-xs text-guap-muted">
          <Link
            href="/auth/forgot-password"
            className="text-suai-brand underline underline-offset-4 hover:opacity-90"
          >
            Забыли пароль?
          </Link>
        </p>
      </form>
    </main>
  );
}
