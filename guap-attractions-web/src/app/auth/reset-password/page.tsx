'use client';

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";
import { readApiErrorMessage } from "@/lib/api-error";

const API_BASE = getApiBaseUrl();

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("email");
    if (q) setEmail(q);
  }, [searchParams]);

  const inputCls =
    "w-full rounded-lg border border-suai-border bg-guap-input px-3 py-2 text-[13px] text-suai-text outline-none transition focus:border-suai-brand focus:ring-1 focus:ring-suai-brand";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 4) {
      setError("Пароль должен быть не короче 4 символов.");
      return;
    }
    if (password !== password2) {
      setError("Пароли не совпадают.");
      return;
    }
    if (code.length !== 6) {
      setError("Введите 6-значный код из письма.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password }),
      });

      if (!res.ok) {
        setError(await readApiErrorMessage(res, API_BASE));
        return;
      }

      router.push("/auth/login");
    } catch {
      setError(
        `Не удалось связаться с сервером (${API_BASE}). Запустите API и проверьте NEXT_PUBLIC_API_BASE_URL.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-suai border border-suai-border bg-guap-card p-6 shadow-suai"
    >
      <h1 className="text-xl font-bold text-guap-heading">Новый пароль</h1>
      <p className="text-sm text-suai-text">
        Введите код из письма и придумайте новый пароль.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-1">
        <label className="text-sm font-medium text-suai-text">Email</label>
        <input
          type="email"
          className={inputCls}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-suai-text">Код из письма</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          className="w-full rounded-lg border border-suai-border bg-guap-input px-3 py-2 text-center font-mono text-lg tracking-[0.3em] text-suai-text outline-none transition focus:border-suai-brand focus:ring-1 focus:ring-suai-brand"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-suai-text">Новый пароль</label>
        <input
          type="password"
          className={inputCls}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-suai-text">Повторите пароль</label>
        <input
          type="password"
          className={inputCls}
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
          loading ? "cursor-default bg-gray-200 text-gray-400 dark:bg-guap-pill dark:text-guap-muted" : "bg-suai-button text-white hover:opacity-90"
        }`}
      >
        {loading ? "Сохранение..." : "Сохранить пароль"}
      </button>

      <Link
        href="/auth/forgot-password"
        className="block w-full text-center text-xs text-guap-muted underline underline-offset-4 hover:text-suai-text"
      >
        Запросить код повторно
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-page flex items-center justify-center">
      <Suspense
        fallback={
          <div className="w-full max-w-md rounded-suai border border-suai-border bg-guap-card p-6 text-center text-sm text-guap-muted shadow-suai">
            Загрузка...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
