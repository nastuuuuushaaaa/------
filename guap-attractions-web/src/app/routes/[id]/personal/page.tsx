'use client';

import dynamic from "next/dynamic";
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api-base";
import { loadUser } from "@/lib/auth";

/** две трети времени на маршрут и аудио, треть запас на дорогу обратно в ГУАП */
function routeBudgetMinutesReturnToGuap(totalMinutes: number): number {
  return Math.floor((totalMinutes * 2) / 3);
}

const RouteMap = dynamic(
  () => import("@/components/RouteMap").then((m) => m.RouteMap),
  { ssr: false }
);

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
  /** фото точки из базы; */
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

export default function PersonalRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-page flex items-center justify-center">
          <p className="text-guap-muted">Загрузка маршрута...</p>
        </main>
      }
    >
      <PersonalRouteContent />
    </Suspense>
  );
}

function PersonalRouteContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeId = params.id as string;

  const excludedIds = useMemo(() => {
    const raw = searchParams.get("excluded");
    if (!raw) return new Set<number>();
    return new Set(raw.split(",").map(Number).filter((n) => !isNaN(n)));
  }, [searchParams]);

  const minutes = Number(searchParams.get("minutes")) || 0;
  const startFromPointId = Number(searchParams.get("startFrom")) || 0;
  const roundTrip = searchParams.get("trip") === "roundTrip";

  const [route, setRoute] = useState<RouteDetailDto | null>(null);
  const [personalPoints, setPersonalPoints] = useState<RoutePointDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [routeCompleted, setRouteCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const [mapMode, setMapMode] = useState<"route" | "navigation">("route");
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [navError, setNavError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const startGeoWatch = () => {
    if (watchIdRef.current !== null) return;
    if (!navigator.geolocation) {
      setNavError("Геолокация не поддерживается вашим браузером");
      return;
    }
    setNavError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setNavError(null);
      },
      (err) => {
        if (err.code === 1) setNavError("Доступ к геолокации запрещён. Разрешите в настройках браузера.");
        else if (err.code === 2) setNavError("Не удалось определить местоположение");
        else setNavError("Ошибка определения местоположения");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopGeoWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserPos(null);
    setNavError(null);
  };

  const switchToNavigation = () => { setMapMode("navigation"); startGeoWatch(); };
  const switchToRoute = () => { setMapMode("route"); stopGeoWatch(); };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const skipScrollToTopRef = useRef(true);

  function scrollWindowToTop() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  useLayoutEffect(() => {
    if (loading || personalPoints.length === 0) return;
    if (skipScrollToTopRef.current) {
      skipScrollToTopRef.current = false;
      return;
    }
    scrollWindowToTop();
    const t1 = window.setTimeout(scrollWindowToTop, 100);
    const t2 = window.setTimeout(scrollWindowToTop, 350);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [currentIndex, loading, personalPoints.length]);

  useEffect(() => {
    let cancelled = false;

    const buildSlice = (
      allIncluded: RoutePointDto[],
      total: number,
      startFrom: number,
      excludedForSave: Set<number>,
      roundTripMode: boolean
    ) => {
      let startIdx = 0;
      if (startFrom > 0) {
        const found = allIncluded.findIndex((p) => p.pointId === startFrom);
        if (found >= 0) startIdx = found;
      }

      const budget =
        roundTripMode && total > 0 ? routeBudgetMinutesReturnToGuap(total) : total;

      let acc = 0;
      const result: RoutePointDto[] = [];
      for (let i = startIdx; i < allIncluded.length; i++) {
        const p = allIncluded[i];
        acc += p.minutesForPoint;
        if (acc <= budget) result.push(p);
        else break;
      }
      if (result.length === 0 && allIncluded.length > 0) {
        result.push(allIncluded[startIdx] ?? allIncluded[0]);
      }

      if (cancelled) return;
      setPersonalPoints(result);
      setCurrentIndex(0);

      const user = loadUser();
      if (user && result.length > 0) {
        fetch(`${API_BASE}/api/routes/${routeId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-User-Id": String(user.id) },
          body: JSON.stringify({ lastPointId: result[0].pointId, excludedPointIds: Array.from(excludedForSave) }),
        }).catch(() => {});
      }
    };

    fetch(`${API_BASE}/api/routes/${routeId}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data: RouteDetailDto) => {
        if (cancelled) return;
        setRoute(data);

        const user = loadUser();

        if (user) {
          fetch(`${API_BASE}/api/routes/${data.id}/progress`, {
            headers: { "X-User-Id": String(user.id) },
          })
            .then(async (res) => (res.ok ? res.json() : null))
            .then((progress: { lastPointId: number | null; excludedPointIds: number[]; completed?: boolean } | null) => {
              if (cancelled) return;
              if (progress?.completed) setRouteCompleted(true);

              const effExcluded = excludedIds.size > 0
                ? excludedIds
                : progress?.excludedPointIds?.length
                  ? new Set(progress.excludedPointIds)
                  : excludedIds;

              const included = data.points.filter((p) => !effExcluded.has(p.attraction.id));
              const effectiveStartFrom = startFromPointId || 0;
              if (minutes > 0) {
                buildSlice(included, minutes, effectiveStartFrom, effExcluded, roundTrip);
              }
            })
            .catch(() => {
              if (cancelled) return;
              const included = data.points.filter((p) => !excludedIds.has(p.attraction.id));
              if (minutes > 0) {
                buildSlice(included, minutes, startFromPointId, excludedIds, roundTrip);
              }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        } else {
          const included = data.points.filter((p) => !excludedIds.has(p.attraction.id));
          if (minutes > 0) {
            buildSlice(included, minutes, startFromPointId, excludedIds, roundTrip);
          }
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [routeId, minutes, startFromPointId, excludedIds, searchParams, roundTrip]);

  const savePosition = (pointId: number) => {
    const user = loadUser();
    if (!user) return;
    fetch(`${API_BASE}/api/routes/${routeId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": String(user.id) },
      body: JSON.stringify({ lastPointId: pointId, excludedPointIds: Array.from(excludedIds) }),
    }).catch(() => {});
  };

  const handlePause = () => {
    if (personalPoints.length > 0) savePosition(personalPoints[currentIndex].pointId);
    const tripQs = roundTrip ? "roundTrip" : "oneWay";
    router.push(`/routes/${routeId}?trip=${tripQs}`);
  };

  const handleComplete = async () => {
    const user = loadUser();
    if (!user || personalPoints.length === 0) return;
    try {
      await fetch(`${API_BASE}/api/routes/${routeId}/progress/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-User-Id": String(user.id) },
        body: JSON.stringify({ lastPointId: personalPoints[currentIndex].pointId }),
      });
      setRouteCompleted(true);
    } catch {}
  };

  const activePoint = personalPoints.length > 0 ? personalPoints[currentIndex] : null;
  const canPrev = personalPoints.length > 0 && currentIndex > 0;
  const canNext = personalPoints.length > 0 && currentIndex < personalPoints.length - 1;

  if (loading) {
    return (
      <main className="min-h-page flex items-center justify-center">
        <p className="text-guap-muted">Загрузка маршрута...</p>
      </main>
    );
  }

  if (!route) {
    return (
      <main className="min-h-page">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="mb-4 text-red-500">Не удалось загрузить маршрут.</p>
          <Link href="/" className="text-suai-brand underline underline-offset-4 hover:opacity-90">
            Вернуться к списку маршрутов
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <nav className="text-sm text-guap-muted">
          <Link href="/" className="text-suai-brand underline underline-offset-4 hover:opacity-90">
            Маршруты
          </Link>{" "}
          <span>/</span>{" "}
          <Link
            href={`/routes/${route.id}?trip=${roundTrip ? "roundTrip" : "oneWay"}`}
            className="text-suai-brand underline underline-offset-4 hover:opacity-90"
          >
            {route.title}
          </Link>{" "}
          <span>/</span>{" "}
          <span className="text-suai-text">Персональный маршрут</span>
        </nav>

        {personalPoints.length === 0 ? (
          <div className="py-16 text-center text-guap-muted">
            <p>Не удалось построить маршрут с заданными параметрами.</p>
            <Link
              href={`/routes/${route.id}?trip=${roundTrip ? "roundTrip" : "oneWay"}`}
              className="mt-4 inline-block text-suai-brand underline underline-offset-4 hover:opacity-90"
            >
              Вернуться к настройке
            </Link>
          </div>
        ) : (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-guap-heading">
              Персональный маршрут ({personalPoints.length} точек)
            </h2>

            {activePoint && (
              <div className="space-y-4 rounded-suai border border-suai-border bg-guap-card p-5 shadow-suai">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-suai-brand">
                      Точка {currentIndex + 1} из {personalPoints.length}
                    </p>
                    <h3 className="text-lg font-semibold text-guap-heading">
                      {activePoint.attraction.title}
                    </h3>
                    {activePoint.attraction.address && (
                      <p className="text-sm text-suai-text">{activePoint.attraction.address}</p>
                    )}
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-guap-pill px-3 py-1 text-xs text-suai-text">
                    ~ {activePoint.minutesForPoint} мин.
                  </span>
                </div>

                {activePoint.attraction.description && (
                  <p className="text-sm text-suai-text">{activePoint.attraction.description}</p>
                )}

                {(() => {
                  const imgs =
                    activePoint.imageUrls && activePoint.imageUrls.length > 0
                      ? activePoint.imageUrls
                      : [];
                  if (imgs.length === 0) return null;
                  return (
                    <div
                      className={`grid gap-3 ${
                        imgs.length >= 3
                          ? "grid-cols-1 sm:grid-cols-3"
                          : imgs.length === 2
                            ? "grid-cols-1 sm:grid-cols-2"
                            : "grid-cols-1"
                      }`}
                    >
                      {imgs.map((src, i) => (
                        <div
                          key={`${src}-${i}`}
                          className="aspect-[4/3] w-full min-h-0 overflow-hidden rounded-lg border border-suai-border bg-guap-hover"
                        >
                          <img
                            src={src}
                            alt={activePoint.attraction.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  {activePoint.attraction.audioUrl && (
                    <div>
                      <p className="text-xs text-guap-muted mb-1">Аудиогид:</p>
                      <audio controls className="w-full" src={activePoint.attraction.audioUrl}>
                        Ваш браузер не поддерживает аудио.
                      </audio>
                    </div>
                  )}

                  <div className="flex overflow-hidden rounded-lg border border-suai-border text-xs">
                    <button
                      type="button"
                      onClick={switchToRoute}
                      className={`flex-1 px-3 py-1.5 font-medium transition ${
                        mapMode === "route"
                          ? "bg-suai-button text-white"
                          : "bg-guap-hover text-suai-text hover:bg-guap-pill"
                      }`}
                    >
                      Маршрут
                    </button>
                    <button
                      type="button"
                      onClick={switchToNavigation}
                      className={`flex-1 px-3 py-1.5 font-medium transition ${
                        mapMode === "navigation"
                          ? "bg-suai-button text-white"
                          : "bg-guap-hover text-suai-text hover:bg-guap-pill"
                      }`}
                    >
                      Навигация
                    </button>
                  </div>

                  {navError && <p className="text-xs text-red-500">{navError}</p>}
                  {mapMode === "navigation" && !userPos && !navError && (
                    <p className="text-xs text-guap-muted animate-pulse">Определяем ваше местоположение...</p>
                  )}

                  <RouteMap
                    startAddress="Санкт-Петербург, Большая Морская улица, 67"
                    referencePoints={personalPoints.map((p) => {
                      const addr = (p.attraction.address ?? "").trim();
                      if (addr) return addr;
                      return p.attraction.title;
                    })}
                    mode={mapMode}
                    userPosition={userPos}
                    activePointIndex={currentIndex}
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-suai-border pt-2 text-xs">
                  <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => {
                      setCurrentIndex((idx) => {
                        const newIdx = Math.max(0, idx - 1);
                        savePosition(personalPoints[newIdx].pointId);
                        return newIdx;
                      });
                    }}
                    className={`rounded-lg border px-3 py-1.5 font-medium transition ${
                      canPrev
                        ? "border-suai-border text-suai-text hover:bg-guap-hover"
                        : "cursor-default border-[#e9ecef] text-[#dee2e6]"
                    }`}
                  >
                    ← Предыдущая точка
                  </button>
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => {
                      setCurrentIndex((idx) => {
                        const newIdx = Math.min(personalPoints.length - 1, idx + 1);
                        savePosition(personalPoints[newIdx].pointId);
                        return newIdx;
                      });
                    }}
                    className={`rounded-lg border px-3 py-1.5 font-medium transition ${
                      canNext
                        ? "border-suai-border text-suai-text hover:bg-guap-hover"
                        : "cursor-default border-[#e9ecef] text-[#dee2e6]"
                    }`}
                  >
                    Следующая точка →
                  </button>
                </div>
              </div>
            )}

            {routeCompleted ? (
              <div className="flex flex-wrap items-center gap-3 rounded-suai border border-[#7bcd4a]/40 bg-[#f4fbf0] p-4">
                <p className="text-sm font-semibold text-[#1d663b]">Маршрут пройден!</p>
                <Link
                  href={`/quiz/${route.id}`}
                  className="rounded-lg bg-suai-button px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  Пройти викторину
                </Link>
                <Link
                  href="/profile"
                  className="rounded-lg border border-suai-border px-4 py-2 text-xs font-medium text-suai-text transition hover:bg-guap-hover"
                >
                  В личный кабинет
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePause}
                  className="rounded-lg border border-suai-brand px-4 py-2 text-[13px] font-semibold text-suai-brand transition hover:bg-[#f0f6fc]"
                >
                  Приостановить маршрут
                </button>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="rounded-lg bg-[#7bcd4a] px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                >
                  Закончить прохождение маршрута
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
