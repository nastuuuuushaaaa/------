'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base";
import { normalizeUser, saveUser } from "@/lib/auth";

const API_BASE = getApiBaseUrl();

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState<"form" | "code">("form");
  const [code, setCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 4) {
      setError("Пароль должен быть не короче 4 символов.");
      return;
    }
    if (password !== password2) {
      setError("Пароли не совпадают.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Ошибка регистрации");
        return;
      }

      setStep("code");
    } catch {
      setError("Ошибка соединения с сервером.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || "Неверный код");
        return;
      }

      const raw = await res.json();
      const user = normalizeUser(raw);
      if (!user) {
        setError("Некорректный ответ сервера.");
        return;
      }
      saveUser(user);
      router.push("/profile");
    } catch {
      setError("Ошибка соединения с сервером.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full rounded-lg border border-suai-border bg-guap-input px-3 py-2 text-[13px] text-suai-text outline-none transition focus:border-suai-brand focus:ring-1 focus:ring-suai-brand";

  if (step === "code") {
    return (
      <main className="min-h-page flex items-center justify-center">
        <form
          onSubmit={handleVerify}
          className="w-full max-w-md space-y-4 rounded-suai border border-suai-border bg-guap-card p-6 shadow-suai"
        >
          <h1 className="text-xl font-bold text-guap-heading">Подтверждение почты</h1>
          <p className="text-sm text-suai-text">
            На адрес <span className="font-medium text-suai-brand">{email}</span> отправлен
            6-значный код подтверждения. Введите его ниже.
          </p>
          <p className="text-xs text-guap-muted">
            Если письма нет, проверьте папку «Спам» — иногда код попадает туда.
          </p>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="space-y-1">
            <label className="text-sm font-medium text-suai-text">Код подтверждения</label>
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

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
              loading || code.length !== 6
                ? "cursor-default bg-gray-200 text-gray-400 dark:bg-guap-pill dark:text-guap-muted"
                : "bg-suai-button text-white hover:opacity-90"
            }`}
          >
            {loading ? "Проверка..." : "Подтвердить"}
          </button>

          <button
            type="button"
            onClick={() => { setStep("form"); setCode(""); setError(null); }}
            className="w-full text-xs text-guap-muted hover:text-suai-text underline underline-offset-4"
          >
            Вернуться к форме регистрации
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-page flex items-center justify-center">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-4 rounded-suai border border-suai-border bg-guap-card p-6 shadow-suai"
      >
        <h1 className="text-xl font-bold text-guap-heading">Регистрация</h1>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-1">
          <label className="text-sm font-medium text-suai-text">Имя</label>
          <input className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-suai-text">Фамилия</label>
          <input className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-suai-text">Email</label>
          <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-suai-text">Придумайте пароль</label>
          <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-suai-text">Повторите пароль</label>
          <input type="password" className={inputCls} value={password2} onChange={(e) => setPassword2(e.target.value)} required />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition ${
            loading ? "cursor-default bg-gray-200 text-gray-400 dark:bg-guap-pill dark:text-guap-muted" : "bg-suai-button text-white hover:opacity-90"
          }`}
        >
          {loading ? "Отправка кода..." : "Зарегистрироваться"}
        </button>
      </form>
    </main>
  );
}
