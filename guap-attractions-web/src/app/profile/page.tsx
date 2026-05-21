'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api-base";
import { loadUser, clearUser, type User } from "@/lib/auth";

const API_BASE = getApiBaseUrl();

type RouteSummaryDto = {
  id: number;
  title: string;
  description?: string | null;
  direction: string;
  pointsCount: number;
  durationMinutes: number;
};

type ProgressInfo = {
  routeId: number;
  lastPointId: number | null;
  hasProgress: boolean;
  completed: boolean;
  excludedPointIds: number[];
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [routes, setRoutes] = useState<RouteSummaryDto[]>([]);
  const [progress, setProgress] = useState<Record<number, ProgressInfo>>({});

  useEffect(() => {
    setUser(loadUser());
  }, []);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const res = await fetch(`${API_BASE}/api/routes`);
      if (!res.ok) return;
      const data = (await res.json()) as RouteSummaryDto[];
      setRoutes(data);

      const entries: Record<number, ProgressInfo> = {};
      await Promise.all(
        data.map(async (route) => {
          try {
            const r = await fetch(
              `${API_BASE}/api/routes/${route.id}/progress`,
              { headers: { "X-User-Id": String(user.id) } }
            );
            if (!r.ok) return;
            const p = (await r.json()) as {
              routeId: number;
              lastPointId: number | null;
              excludedPointIds: number[];
              completed: boolean;
            };
            entries[route.id] = {
              routeId: p.routeId,
              lastPointId: p.lastPointId,
              hasProgress: true,
              completed: p.completed,
              excludedPointIds: p.excludedPointIds ?? [],
            };
          } catch {}
        })
      );

      setProgress(entries);
    };

    load().catch(() => {});
  }, [user]);

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setRoutes([]);
    setProgress({});
    window.dispatchEvent(new Event("user-logout"));
  };

  const handleReset = async (routeId: number) => {
    if (!user) return;
    await fetch(`${API_BASE}/api/routes/${routeId}/progress`, {
      method: "DELETE",
      headers: { "X-User-Id": String(user.id) },
    }).catch(() => {});

    setProgress((prev) => {
      const copy = { ...prev };
      delete copy[routeId];
      return copy;
    });
  };

  if (!user) {
    return (
      <main className="min-h-page">
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
          <header>
            <h1 className="mb-1 text-xl font-bold tracking-tight text-guap-heading sm:text-2xl">
              Личный кабинет
            </h1>
            <p className="text-suai-text">
              Войдите или зарегистрируйтесь, чтобы сохранять прогресс по
              маршрутам и проходить викторины.
            </p>
          </header>

          <div className="rounded-suai border border-suai-border bg-[#f0f6fc] px-5 py-4 shadow-suai dark:bg-[#1e2835]">
            <p className="mb-3 text-[15px] font-semibold leading-snug text-guap-heading">
              Для доступа к личному кабинету необходима учётная запись.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/auth/login"
                className="rounded-lg border border-suai-border bg-guap-card px-4 py-2 text-[13px] font-medium text-suai-text transition hover:bg-guap-hover"
              >
                Войти
              </Link>
              <Link
                href="/auth/register"
                className="rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
              >
                Регистрация
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const routesWithProgress = routes.filter((r) => progress[r.id]?.hasProgress);

  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <header>
          <h1 className="mb-1 text-xl font-bold tracking-tight text-guap-heading sm:text-2xl">
            Личный кабинет
          </h1>
          <p className="text-suai-text">
            Прогресс по маршрутам и доступ к викторинам привязаны к вашей
            учётной записи.
          </p>
        </header>

        <div className="flex flex-col gap-3 rounded-suai border border-suai-border bg-guap-card p-4 shadow-suai sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-suai-text">
            <span className="font-semibold text-guap-heading">
              {user.firstName} {user.lastName ?? ""}
            </span>
            <span className="text-guap-muted"> · </span>
            {user.email}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 self-start rounded-lg border border-suai-border px-4 py-2 text-[13px] font-medium text-suai-text transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 sm:self-center"
          >
            Выйти
          </button>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-guap-heading">Маршруты с прогрессом</h2>

          {routesWithProgress.length === 0 ? (
            <p className="text-sm text-guap-muted">
              Вы ещё не начинали прохождение маршрутов или прогресс не
              сохранён.
            </p>
          ) : (
            <ul className="space-y-3">
              {routesWithProgress.map((route) => (
                <li
                  key={route.id}
                  className="flex flex-col gap-3 rounded-suai border border-suai-border bg-guap-card p-4 shadow-suai sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-suai-brand">
                      Направление: {route.direction}
                    </p>
                    <p className="text-base font-semibold text-guap-heading">
                      {route.title}
                    </p>
                    <p className="text-xs text-suai-text">
                      Примерно {route.durationMinutes} мин., точек:{" "}
                      {route.pointsCount}
                    </p>
                    {progress[route.id]?.completed && (
                      <p className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        Маршрут пройден
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {!progress[route.id]?.completed && (
                      <Link
                        href={`/routes/${route.id}`}
                        className="rounded-lg bg-suai-button px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                      >
                        Продолжить
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => handleReset(route.id)}
                      className="rounded-lg border border-suai-border px-4 py-2 text-xs font-medium text-suai-text transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    >
                      Сбросить прогресс
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
