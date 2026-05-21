'use client';

import { useEffect, useMemo, useRef, useCallback } from "react";

type RouteMapProps = {
  referencePoints: string[];
  startAddress?: string;
  /** целиком маршрут или только путь от меня до выбранной точки */
  mode?: "route" | "navigation";
  /** координаты с GPS (нужны во втором режиме) */
  userPosition?: [number, number] | null;
  /** номер активной точки в списке (с нуля) */
  activePointIndex?: number;
};

const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";
const YMAPS_SRC = `https://api-maps.yandex.ru/2.1/?apikey=${API_KEY}&lang=ru_RU&load=package.full`;

function normalizeSpbAddress(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  const low = t.toLowerCase();
  if (low.includes("санкт-петербург") || low.includes("петербург")) return t;
  return `Санкт-Петербург, ${t}`;
}

let ymapsPromise: Promise<void> | null = null;

function ensureYmapsLoaded(): Promise<void> {
  if (ymapsPromise) return ymapsPromise;
  ymapsPromise = new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (w.ymaps) { w.ymaps.ready(() => resolve()); return; }
    const existing = document.querySelector(`script[src*="api-maps.yandex.ru"]`);
    if (existing) {
      const wait = () => { if (w.ymaps) w.ymaps.ready(() => resolve()); else setTimeout(wait, 100); };
      wait(); return;
    }
    const script = document.createElement("script");
    script.src = YMAPS_SRC;
    script.async = true;
    script.onload = () => {
      const wait = () => { if (w.ymaps) w.ymaps.ready(() => resolve()); else setTimeout(wait, 100); };
      wait();
    };
    script.onerror = () => { ymapsPromise = null; reject(new Error("Не удалось загрузить Яндекс.Карты")); };
    document.head.appendChild(script);
  });
  return ymapsPromise;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function geocodeOne(ymaps: any, address: string): Promise<[number, number] | null> {
  try {
    const res = await ymaps.geocode(address, { results: 1 });
    const coords = res?.geoObjects?.get?.(0)?.geometry?.getCoordinates?.();
    if (coords?.length === 2) return coords;
  } catch { /* геокодер не ответил */ }
  return null;
}

const GUAP_ADDRESS = "Санкт-Петербург, Большая Морская улица, 67";

export function RouteMap({
  referencePoints,
  startAddress,
  mode = "route",
  userPosition,
  activePointIndex = 0,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const resolvedCoordsRef = useRef<{ coords: [number, number]; label: string }[]>([]);

  const normalizedPoints = useMemo(
    () => referencePoints.map(normalizeSpbAddress).filter(Boolean),
    [referencePoints]
  );
  const normalizedStart = useMemo(
    () => (startAddress ? normalizeSpbAddress(startAddress) : null),
    [startAddress]
  );

  /* весь маршрут на карте */
  const drawFullRoute = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ymaps = (window as any).ymaps;
    const map = mapRef.current;
    if (!ymaps || !map || normalizedPoints.length === 0) return;

    map.geoObjects.removeAll();

    const [startCoords, ...geoResults] = await Promise.all([
      normalizedStart ? geocodeOne(ymaps, normalizedStart) : Promise.resolve(null),
      ...normalizedPoints.map((addr) => geocodeOne(ymaps, addr)),
    ]);

    const resolved: { coords: [number, number]; label: string; idx: number }[] = [];
    for (let i = 0; i < normalizedPoints.length; i++) {
      const c = geoResults[i];
      if (c) resolved.push({ coords: c, label: normalizedPoints[i], idx: i });
    }
    resolvedCoordsRef.current = resolved.map((r) => ({ coords: r.coords, label: r.label }));
    if (resolved.length === 0) return;

    const waypoints = [
      ...(startCoords ? [startCoords] : []),
      ...resolved.map((r) => r.coords),
    ];

    if (waypoints.length >= 2) {
      const CHUNK = 10;
      for (let i = 0; i < waypoints.length - 1; i += CHUNK - 1) {
        const chunk = waypoints.slice(i, i + CHUNK);
        if (chunk.length < 2) break;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.geoObjects.add(new (ymaps as any).multiRouter.MultiRoute(
            { referencePoints: chunk, params: { routingMode: "pedestrian" } },
            { wayPointVisible: false, boundsAutoApply: false }
          ));
        } catch {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.geoObjects.add(new (ymaps as any).Polyline(
            chunk, {}, { strokeColor: "#4A90E2", strokeWidth: 3, strokeOpacity: 0.7 }
          ));
        }
      }
    }

    [...resolved].reverse().forEach(({ coords, label, idx }) => {
      map.geoObjects.add(new ymaps.Placemark(
        coords,
        { iconContent: String(idx + 1), balloonContent: label },
        { preset: "islands#blueCircleIcon" }
      ));
    });

    if (startCoords) {
      map.geoObjects.add(new ymaps.Placemark(
        startCoords,
        { iconContent: "ГУАП", balloonContent: normalizedStart ?? GUAP_ADDRESS },
        { preset: "islands#greenStretchyIcon" }
      ));
    }

    const bounds = ymaps.util.bounds.fromPoints(waypoints);
    map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
  }, [normalizedPoints, normalizedStart]);

  /* режим «иду к точке» */
  const drawNavigation = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ymaps = (window as any).ymaps;
    const map = mapRef.current;
    if (!ymaps || !map) return;

    map.geoObjects.removeAll();

    if (!userPosition) {
      map.geoObjects.add(new ymaps.Placemark(
        [59.9386, 30.3141], { balloonContent: "Определяем местоположение..." },
        { preset: "islands#grayCircleDotIcon" }
      ));
      return;
    }

    // если координат ещё нет — добиваем геокодером
    let targetCoords: [number, number] | null =
      resolvedCoordsRef.current[activePointIndex]?.coords ?? null;
    const targetLabel = resolvedCoordsRef.current[activePointIndex]?.label
      ?? normalizedPoints[activePointIndex] ?? "";

    if (!targetCoords && normalizedPoints[activePointIndex]) {
      targetCoords = await geocodeOne(ymaps, normalizedPoints[activePointIndex]);
    }

    // метка «я здесь»
    map.geoObjects.add(new ymaps.Placemark(
      userPosition,
      { balloonContent: "Вы здесь" },
      { preset: "islands#redCircleDotIcon" }
    ));

    if (!targetCoords) return;

    // целевая точка
    map.geoObjects.add(new ymaps.Placemark(
      targetCoords,
      { iconContent: String(activePointIndex + 1), balloonContent: targetLabel },
      { preset: "islands#blueCircleIcon" }
    ));

    // пеший маршрут до точки
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.geoObjects.add(new (ymaps as any).multiRouter.MultiRoute(
        {
          referencePoints: [userPosition, targetCoords],
          params: { routingMode: "pedestrian" },
        },
        { boundsAutoApply: true }
      ));
    } catch {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.geoObjects.add(new (ymaps as any).Polyline(
        [userPosition, targetCoords], {},
        { strokeColor: "#ef4444", strokeWidth: 4, strokeOpacity: 0.8 }
      ));
      const bounds = ymaps.util.bounds.fromPoints([userPosition, targetCoords]);
      map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 60 });
    }
  }, [userPosition, activePointIndex, normalizedPoints]);

  /* первичная отрисовка карты */
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    ensureYmapsLoaded()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ymaps = (window as any).ymaps;
        if (!mapRef.current) {
          mapRef.current = new ymaps.Map(containerRef.current, {
            center: [59.9386, 30.3141],
            zoom: 12,
            controls: ["zoomControl", "fullscreenControl"],
          });
        }
        if (mode === "navigation") drawNavigation();
        else drawFullRoute();
      })
      .catch(() => { /* скрипт карт не загрузился */ });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* обновить линию маршрута, если сменились точки */
  useEffect(() => {
    if (!mapRef.current) return;
    if (mode === "route") drawFullRoute();
  }, [mode, drawFullRoute]);

  /* обновить навигацию, если сдвинулись координаты или точка */
  useEffect(() => {
    if (!mapRef.current) return;
    if (mode === "navigation") drawNavigation();
  }, [mode, drawNavigation]);

  return (
    <div
      ref={containerRef}
      className="h-80 w-full overflow-hidden rounded-suai border border-suai-brand"
    />
  );
}
