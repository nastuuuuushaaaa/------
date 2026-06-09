'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api-base";
import { loadUser } from "@/lib/auth";
import {
  getPointDisplayMinutes,
  loadAudioMinutesByAttractionId,
  minMinutesToFirstIncluded,
  travelMinutesToFirstIncluded,
  POINT_TIME_BUFFER_MINUTES,
} from "@/lib/route-time";

type AttractionDto = {
  id: number;
  title: string;
  address?: string | null;
  description?: string | null;
  audioUrl?: string | null;
  audioDurationMinutes?: number;
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

type RoutePlannerProps = {
  route: RouteDetailDto;
};

const API_BASE = getApiBaseUrl();

export default function RoutePlanner({ route }: RoutePlannerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [excludedIds, setExcludedIds] = useState<Set<number>>(() => new Set());
  const [minutesInput, setMinutesInput] = useState<string>("");
  const [timeErrorMessage, setTimeErrorMessage] = useState<string | null>(null);
  const [tripMode, setTripMode] = useState<"oneWay" | "roundTrip">(() =>
    searchParams.get("trip") === "roundTrip" ? "roundTrip" : "oneWay"
  );

  const [lastPointId, setLastPointId] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [audioMinutesByAttractionId, setAudioMinutesByAttractionId] = useState<
    Map<number, number>
  >(() => new Map());

  const lastPointName = useMemo(() => {
    if (!lastPointId) return null;
    const pt = route.points.find((p) => p.pointId === lastPointId);
    return pt ? pt.attraction.title : null;
  }, [lastPointId, route.points]);

  const visiblePoints = useMemo(() => {
    if (!lastPointId || isCompleted) return route.points;
    const idx = route.points.findIndex((p) => p.pointId === lastPointId);
    if (idx < 0) return route.points;
    return route.points.slice(idx);
  }, [route.points, lastPointId, isCompleted]);

  useEffect(() => {
    const user = loadUser();
    if (!user) return;

    fetch(`${API_BASE}/api/routes/${route.id}/progress`, {
      headers: { "X-User-Id": String(user.id) },
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data: { lastPointId: number | null; excludedPointIds: number[]; completed?: boolean } =
          await res.json();

        if (data.excludedPointIds?.length) {
          setExcludedIds(new Set(data.excludedPointIds));
        }
        if (data.lastPointId) {
          setLastPointId(data.lastPointId);
        }
        if (data.completed) {
          setIsCompleted(true);
        }
      })
      .catch(() => {});
  }, [route.id, route.points]);

  useEffect(() => {
    const t = searchParams.get("trip");
    setTripMode(t === "roundTrip" ? "roundTrip" : "oneWay");
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    loadAudioMinutesByAttractionId(route.points).then((map) => {
      if (!cancelled) setAudioMinutesByAttractionId(map);
    });
    return () => {
      cancelled = true;
    };
  }, [route.points]);

  const visibleStartIndex = useMemo(() => {
    if (!lastPointId || isCompleted) return 0;
    const idx = route.points.findIndex((p) => p.pointId === lastPointId);
    return idx >= 0 ? idx : 0;
  }, [route.points, lastPointId, isCompleted]);

  /** Минимум до первой посещаемой точки (переходы через исключённые учитываются). */
  const minToFirstIncluded = useMemo(() => {
    return minMinutesToFirstIncluded(
      route.points,
      excludedIds,
      audioMinutesByAttractionId,
      visibleStartIndex
    );
  }, [route.points, excludedIds, audioMinutesByAttractionId, visibleStartIndex]);

  /** Точное время перехода до первой посещаемой точки (только дорога, без запаса/аудио). */
  const travelToFirstIncluded = useMemo(() => {
    return travelMinutesToFirstIncluded(
      route.points,
      excludedIds,
      visibleStartIndex
    );
  }, [route.points, excludedIds, visibleStartIndex]);

  /** Сколько минут нужно минимум с учётом возврата в ГУАП. */
  const minRequiredMinutes = useMemo(() => {
    if (minToFirstIncluded == null) return null;
    if (tripMode === "roundTrip") {
      // Время возврата = время перехода до первой точки (путь обратно симметричен).
      const returnLeg = travelToFirstIncluded ?? 0;
      return minToFirstIncluded + returnLeg;
    }
    return minToFirstIncluded;
  }, [minToFirstIncluded, tripMode, travelToFirstIncluded]);

  const validateMinutes = (total: number): string | null => {
    if (Number.isNaN(total) || total <= 0) {
      return "Введите положительное число минут.";
    }
    if (minToFirstIncluded == null) {
      return "Отметьте хотя бы одну точку маршрута.";
    }
    if (minRequiredMinutes != null && total < minRequiredMinutes) {
      if (tripMode === "oneWay") {
        return `Времени недостаточно: до первой точки нужно около ${minToFirstIncluded} мин. (переход, запас ${POINT_TIME_BUFFER_MINUTES} мин. и аудиогид). Укажите не меньше ${minRequiredMinutes} мин.`;
      }
      const returnLeg = travelToFirstIncluded ?? 0;
      return `Времени недостаточно: до первой точки около ${minToFirstIncluded} мин. и ${returnLeg} мин. на возвращение в ГУАП (всего не меньше ${minRequiredMinutes} мин.).`;
    }
    return null;
  };

  const handleToggleExclude = (attractionId: number) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(attractionId)) next.delete(attractionId);
      else next.add(attractionId);
      return next;
    });
    setTimeErrorMessage(null);
  };

  const buildUrl = (total: number, startFrom?: number) => {
    const qs = new URLSearchParams();
    qs.set("minutes", String(total));
    qs.set("trip", tripMode === "roundTrip" ? "roundTrip" : "oneWay");
    const exArr = Array.from(excludedIds);
    if (exArr.length) qs.set("excluded", exArr.join(","));
    if (startFrom) qs.set("startFrom", String(startFrom));
    return `/routes/${route.id}/personal?${qs.toString()}`;
  };

  const handleBuildRoute = () => {
    const total = parseInt(minutesInput, 10);
    const err = validateMinutes(total);
    if (err) {
      setTimeErrorMessage(err);
      return;
    }
    setTimeErrorMessage(null);
    router.push(buildUrl(total));
  };

  const handleContinueRoute = () => {
    const total = parseInt(minutesInput, 10);
    const err = validateMinutes(total);
    if (err) {
      setTimeErrorMessage(err);
      return;
    }
    setTimeErrorMessage(null);
    router.push(buildUrl(total, lastPointId ?? undefined));
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-guap-heading">
          Настройка маршрута и доступное время
        </h2>

        {lastPointId && !isCompleted && lastPointName && (
          <div className="rounded-lg border border-suai-border bg-[#f0f6fc] px-4 py-3 text-sm text-suai-brand">
            Вы приостановили маршрут на точке:{" "}
            <span className="font-semibold">{lastPointName}</span>.
            Введите доступное время и нажмите «Продолжить маршрут», чтобы
            продолжить с этой точки.
          </div>
        )}

        {isCompleted && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Маршрут пройден. Вы можете пройти его заново с начала.
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-suai-text">
            {lastPointId && !isCompleted
              ? "Оставшиеся точки маршрута. Исключите неинтересные."
              : "Исключите уже посещённые или неинтересные точки маршрута."}
          </p>

          <div className="max-h-64 overflow-auto rounded-suai border border-suai-border bg-guap-card">
            <ul className="divide-y divide-suai-border">
              {visiblePoints.map((point) => {
                const a = point.attraction;
                const excluded = excludedIds.has(a.id);
                return (
                  <li key={point.pointId} className="flex items-start gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleExclude(a.id)}
                      className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold leading-none transition-colors ${
                        excluded
                          ? "border-red-400 bg-red-50 text-red-500"
                          : "border-green-400 bg-green-50 text-green-600"
                      }`}
                      aria-label={excluded ? "Вернуть точку" : "Исключить точку"}
                    >
                      {excluded ? "−" : "✓"}
                    </button>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-suai-brand">
                        Точка {point.order}
                      </p>
                      <p className="font-semibold text-guap-heading">{a.title}</p>
                      {a.address && <p className="text-xs text-guap-muted">{a.address}</p>}
                      <p className="mt-1 text-xs text-guap-muted">
                        {excluded
                          ? `Переход ~ ${point.minutesForPoint} мин. (точка исключена, без аудиогида и запаса)`
                          : `~ ${getPointDisplayMinutes(point, false, audioMinutesByAttractionId)} мин. (переход ${point.minutesForPoint} + запас ${POINT_TIME_BUFFER_MINUTES} мин. + аудиогид)`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-suai-text" id="trip-mode-heading">
            Какой маршрут вы планируете?
          </p>
          <div
            className="flex flex-col gap-2 rounded-suai border border-suai-border bg-guap-card px-4 py-3 sm:flex-row sm:flex-wrap sm:gap-6"
            role="radiogroup"
            aria-labelledby="trip-mode-heading"
          >
            <label className="flex cursor-pointer items-start gap-2 text-sm text-suai-text">
              <input
                type="radio"
                name="tripMode"
                className="mt-0.5"
                checked={tripMode === "roundTrip"}
                onChange={() => {
                  setTripMode("roundTrip");
                  setTimeErrorMessage(null);
                }}
              />
              <span>
                <span className="font-medium text-guap-heading">
                  Необходимо вернуться обратно в ГУАП после прогулки
                </span>
                <span className="block text-xs text-guap-muted">
                  В режиме возврата время расходуется на путь до точек, их посещение и аудиогид, а затем отдельно
                  учитывается резерв на обратную дорогу в ГУАП.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-suai-text">
              <input
                type="radio"
                name="tripMode"
                className="mt-0.5"
                checked={tripMode === "oneWay"}
                onChange={() => {
                  setTripMode("oneWay");
                  setTimeErrorMessage(null);
                }}
              />
              <span>
                <span className="font-medium text-guap-heading">
                  Прямой маршрут (не нужно возвращаться в вуз по завершении маршрута)
                </span>
                <span className="block text-xs text-guap-muted">
                  Всё доступное время идёт на точки маршрута и прослушивание аудиогида.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={`mb-1 block text-sm font-medium transition-colors ${
              timeErrorMessage ? "text-red-500" : "text-suai-text"
            }`}>
              Доступное время (минуты)
            </label>
            <input
              type="number"
              min={1}
              className={`w-32 rounded-lg border bg-guap-input px-3 py-1.5 text-[13px] text-suai-text outline-none transition-colors focus:ring-1 ${
                timeErrorMessage
                  ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                  : "border-suai-border focus:border-suai-brand focus:ring-suai-brand"
              }`}
              value={minutesInput}
              onChange={(e) => {
                setMinutesInput(e.target.value);
                setTimeErrorMessage(null);
              }}
              aria-invalid={timeErrorMessage ? true : undefined}
              aria-describedby={timeErrorMessage ? "minutes-error" : undefined}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {lastPointId && !isCompleted ? (
              <>
                <button
                  type="button"
                  onClick={handleContinueRoute}
                  className="rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                >
                  Продолжить маршрут
                </button>
                <button
                  type="button"
                  onClick={handleBuildRoute}
                  className="rounded-lg border border-suai-border px-4 py-2 text-[13px] font-medium text-suai-text transition hover:bg-guap-hover"
                >
                  Начать с начала
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleBuildRoute}
                className="rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
              >
                Построить персональный маршрут
              </button>
            )}
          </div>
          </div>
          {timeErrorMessage && (
            <p id="minutes-error" className="max-w-xl text-sm text-red-600 dark:text-red-400" role="alert">
              {timeErrorMessage}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
