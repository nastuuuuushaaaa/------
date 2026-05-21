'use client';

import Link from "next/link";
import { useState } from "react";
import { getApiBaseUrl } from "@/lib/api-base";
import { readApiErrorMessage } from "@/lib/api-error";

const API_BASE = getApiBaseUrl();

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const inputCls =
    "w-full rounded-lg border border-suai-border bg-guap-input px-3 py-2 text-[13px] text-suai-text outline-none transition focus:border-suai-brand focus:ring-1 focus:ring-suai-brand";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError(await readApiErrorMessage(res, API_BASE));
        return;
      }

      setDone(true);
    } catch {
      setError(
        `Не удалось связаться с сервером (${API_BASE}). Запустите API и проверьте NEXT_PUBLIC_API_BASE_URL.`
      );
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="min-h-page flex items-center justify-center">
        <div className="w-full max-w-md space-y-4 rounded-suai border border-suai-border bg-guap-card p-6 shadow-suai">
          <h1 className="text-xl font-bold text-guap-heading">Проверьте почту</h1>
          <p className="text-sm text-suai-text">
            Если указанный адрес зарегистрирован, на него отправлено письмо с 6-значным кодом. Введите код на
            странице установки нового пароля.
          </p>
          <p className="text-xs text-guap-muted">
            Письмо может оказаться в папке «Спам». Код действителен 15 минут.
          </p>
          <Link
            href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
            className="block w-full rounded-lg bg-suai-button px-3 py-2 text-center text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            Ввести код и новый пароль
          </Link>
          <Link
            href="/auth/login"
            className="block w-full text-center text-xs text-guap-muted underline underline-offset-4 hover:text-suai-text"
          >
            Вернуться ко входу
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-page flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-suai border border-suai-border bg-guap-card p-6 shadow-suai"
      >
        <h1 className="text-xl font-bold text-guap-heading">Восстановление пароля</h1>
        <p className="text-sm text-suai-text">
          Укажите email аккаунта — мы отправим код для сброса пароля.
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

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
            loading ? "cursor-default bg-gray-200 text-gray-400 dark:bg-guap-pill dark:text-guap-muted" : "bg-suai-button text-white hover:opacity-90"
          }`}
        >
          {loading ? "Отправка..." : "Отправить код"}
        </button>

        <Link
          href="/auth/login"
          className="block w-full text-center text-xs text-guap-muted underline underline-offset-4 hover:text-suai-text"
        >
          Назад ко входу
        </Link>
      </form>
    </main>
  );
}
