"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="space-y-4 rounded-suai border border-suai-border bg-guap-card p-6 shadow-suai">
          <h1 className="text-lg font-bold text-guap-heading">
            Ошибка при загрузке маршрута
          </h1>
          <p className="text-sm text-suai-text">
            Проверьте, что API запущен и доступен по адресу из{" "}
            <code className="rounded bg-guap-pill px-1">NEXT_PUBLIC_API_BASE_URL</code>
            , затем нажмите «Повторить».
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <p className="break-all rounded-lg bg-[#fff5f5] p-2 font-mono text-xs text-red-600">
              {error.message}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
            >
              Повторить
            </button>
            <Link
              href="/"
              className="rounded-lg border border-suai-border px-4 py-2 text-[13px] font-medium text-suai-text transition hover:bg-guap-hover"
            >
              К списку маршрутов
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
