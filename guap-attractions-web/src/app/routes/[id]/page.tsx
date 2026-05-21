import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import RoutePlanner from "@/components/RoutePlanner";
import { getApiBaseUrl } from "@/lib/api-base";

type AttractionDto = {
  id: number;
  title: string;
  address?: string | null;
  description?: string | null;
  audioUrl?: string | null;
};

type RoutePointDto = {
  pointId: number;
  order: number;
  minutesForPoint: number;
  attraction: AttractionDto;
  imageUrls?: string[];
};

type RouteDetailDto = {
  id: number;
  title: string;
  description?: string | null;
  direction: string;
  imageUrl?: string | null;
  pointsCount: number;
  durationMinutes: number;
  points: RoutePointDto[];
};

const API_BASE = getApiBaseUrl();

async function fetchRoute(id: string): Promise<RouteDetailDto> {
  const res = await fetch(`${API_BASE}/api/routes/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error(`Не удалось загрузить маршрут (${res.status})`);
  }

  return res.json();
}

type RoutePageProps = {
  params: { id: string };
};

export default async function RoutePage({ params }: RoutePageProps) {
  const route = await fetchRoute(params.id);

  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <nav className="text-sm text-guap-muted">
          <Link href="/" className="text-suai-brand underline underline-offset-4 hover:opacity-90">
            Маршруты
          </Link>{" "}
          <span>/</span>{" "}
          <span className="text-suai-text">{route.title}</span>
        </nav>

        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-suai-brand">
            Направление: {route.direction}
          </p>
          <h1 className="text-xl font-bold tracking-tight text-guap-heading sm:text-2xl">
            {route.title}
          </h1>
          {route.description && (
            <p className="max-w-2xl text-suai-text">{route.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-[12px] text-suai-text">
            <span className="rounded-full border border-suai-border bg-guap-card px-3 py-1">
              Примерно {route.durationMinutes} мин.
            </span>
            <span className="rounded-full border border-suai-border bg-guap-card px-3 py-1">
              Точек: {route.pointsCount}
            </span>
          </div>
        </header>

        <Suspense
          fallback={
            <div className="rounded-suai border border-suai-border bg-guap-card p-6 text-sm text-guap-muted">
              Загрузка настроек маршрута…
            </div>
          }
        >
          <RoutePlanner route={route} />
        </Suspense>
      </div>
    </main>
  );
}
