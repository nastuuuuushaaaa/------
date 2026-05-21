"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
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
    <main className="min-h-page flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-4 rounded-suai border border-suai-border bg-guap-card p-8 text-center shadow-suai">
        <h1 className="text-lg font-bold text-guap-heading">Что-то пошло не так</h1>
        <p className="text-sm text-suai-text">
          Не удалось отобразить страницу. Попробуйте обновить или вернуться на
          главную.
        </p>
        {process.env.NODE_ENV === "development" && error.message && (
          <p className="break-all rounded-lg bg-guap-pill p-2 text-left font-mono text-xs text-red-600 dark:text-red-400">
            {error.message}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
          >
            Попробовать снова
          </button>
          <Link
            href="/"
            className="rounded-lg border border-suai-border px-4 py-2 text-[13px] font-medium text-suai-text transition hover:bg-guap-hover"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
