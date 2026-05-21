'use client';

import Link from "next/link";
import { useMemo, useState } from "react";

export type HomeRouteSummary = {
  id: number;
  title: string;
  description?: string | null;
  direction: string;
  imageUrl?: string | null;
  pointsCount: number;
  durationMinutes: number;
};

type Props = {
  routes: HomeRouteSummary[];
};

export default function HomeRouteList({ routes }: Props) {
  const directions = useMemo(() => {
    const set = new Set(routes.map((r) => r.direction));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [routes]);

  const [direction, setDirection] = useState<string>("");

  const filtered = useMemo(() => {
    if (!direction) return routes;
    return routes.filter((r) => r.direction === direction);
  }, [routes, direction]);

  if (routes.length === 0) {
    return <p className="text-guap-muted">Маршруты пока не найдены.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div className="w-full min-w-0 sm:max-w-xs">
          <label
            htmlFor="direction-filter"
            className="mb-1 block text-sm font-medium text-suai-text"
          >
            Направление
          </label>
          <select
            id="direction-filter"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="w-full max-w-full min-w-0 rounded-lg border border-suai-border bg-guap-input px-3 py-2 text-[13px] text-suai-text outline-none transition focus:border-suai-brand focus:ring-1 focus:ring-suai-brand"
          >
            <option value="">Все направления</option>
            {directions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-suai-text">
          Нет маршрутов с выбранным направлением.{" "}
          <button
            type="button"
            onClick={() => setDirection("")}
            className="font-medium text-suai-brand underline underline-offset-2 hover:opacity-90"
          >
            Показать все
          </button>
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((route) => (
            <Link
              key={route.id}
              href={`/routes/${route.id}`}
              className="group rounded-suai border border-suai-border bg-guap-card p-5 shadow-suai transition hover:border-suai-brand hover:shadow-md"
            >
              <div className="flex flex-col gap-2">
                <h2 className="text-base font-semibold text-guap-heading transition group-hover:text-suai-brand">
                  {route.title}
                </h2>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-suai-brand">
                  Направление: {route.direction}
                </p>
                {route.description && (
                  <p className="text-[13px] text-suai-text">{route.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-[12px] text-suai-text">
                  <span className="rounded-full bg-guap-pill px-3 py-1">
                    Примерно {route.durationMinutes} мин.
                  </span>
                  <span className="rounded-full bg-guap-pill px-3 py-1">
                    Точек: {route.pointsCount}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
