/** Запас времени на каждую посещаемую (не исключённую) точку, мин. */
export const POINT_TIME_BUFFER_MINUTES = 3;

export type RoutePointForTime = {
  pointId: number;
  minutesForPoint: number;
  attraction: {
    id: number;
    audioUrl?: string | null;
    /** из API (длительность_аудио_мин), минуты с округлением вверх */
    audioDurationMinutes?: number;
  };
};

const audioDurationSecondsCache = new Map<string, number>();

/** Длительность аудио в минутах, округление вверх. */
export function ceilAudioMinutes(durationSeconds: number): number {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  return Math.ceil(durationSeconds / 60);
}

/** Время аудиогида для точки (мин.), 0 если нет файла. */
export function getAudioMinutes(
  attractionId: number,
  audioMinutesByAttractionId: Map<number, number>,
  fromApi?: number
): number {
  if (fromApi != null && fromApi >= 0) return fromApi;
  return audioMinutesByAttractionId.get(attractionId) ?? 0;
}

/** Суммарное время полного маршрута (все точки посещаются). */
export function computeFullRouteDurationMinutes(
  points: RoutePointForTime[],
  audioMinutesByAttractionId: Map<number, number>
): number {
  return points.reduce(
    (sum, p) =>
      sum +
      getPointDisplayMinutes(
        p,
        false,
        audioMinutesByAttractionId,
        p.attraction.audioDurationMinutes
      ),
    0
  );
}

/**
 * Стоимость прохождения точки в минутах:
 * - всегда время перехода (minutesForPoint);
 * - для неисключённой точки дополнительно запас и аудиогид.
 */
export function getPointTimeCost(
  travelMinutes: number,
  excluded: boolean,
  audioMinutes: number
): number {
  if (excluded) return travelMinutes;
  return travelMinutes + POINT_TIME_BUFFER_MINUTES + audioMinutes;
}

/** Время на посещение (без учёта перехода): запас + аудио. */
export function getPointVisitExtraMinutes(
  excluded: boolean,
  audioMinutes: number
): number {
  if (excluded) return 0;
  return POINT_TIME_BUFFER_MINUTES + audioMinutes;
}

/** Полное время на точку для отображения (переход + посещение). */
export function getPointDisplayMinutes(
  point: RoutePointForTime,
  excluded: boolean,
  audioMinutesByAttractionId: Map<number, number>,
  audioMinutesFromApi?: number
): number {
  const audio = getAudioMinutes(
    point.attraction.id,
    audioMinutesByAttractionId,
    audioMinutesFromApi ?? point.attraction.audioDurationMinutes
  );
  return getPointTimeCost(point.minutesForPoint, excluded, audio);
}

/**
 * Минимальное время до первой посещаемой точки (с учётом переходов через исключённые).
 */
export function minMinutesToFirstIncluded(
  points: RoutePointForTime[],
  excludedIds: Set<number>,
  audioMinutesByAttractionId: Map<number, number>,
  startIndex = 0
): number | null {
  let acc = 0;
  for (let i = startIndex; i < points.length; i++) {
    const p = points[i];
    const excluded = excludedIds.has(p.attraction.id);
    const audio = getAudioMinutes(
      p.attraction.id,
      audioMinutesByAttractionId,
      p.attraction.audioDurationMinutes
    );
    acc += getPointTimeCost(p.minutesForPoint, excluded, audio);
    if (!excluded) return acc;
  }
  return null;
}

/** Две трети бюджета на маршрут при возврате в ГУАП. */
export function routeBudgetMinutesReturnToGuap(totalMinutes: number): number {
  return Math.floor((totalMinutes * 2) / 3);
}

/**
 * Строит список посещаемых точек по бюджету времени.
 * Исключённые точки не попадают в маршрут, но их время перехода учитывается в бюджете.
 */
export function buildPersonalRouteSlice<T extends RoutePointForTime>(
  allPoints: T[],
  budgetMinutes: number,
  excludedIds: Set<number>,
  audioMinutesByAttractionId: Map<number, number>,
  startFromPointId = 0
): T[] {
  let startIdx = 0;
  if (startFromPointId > 0) {
    const found = allPoints.findIndex((p) => p.pointId === startFromPointId);
    if (found >= 0) startIdx = found;
  }

  let acc = 0;
  const result: T[] = [];

  for (let i = startIdx; i < allPoints.length; i++) {
    const p = allPoints[i];
    const excluded = excludedIds.has(p.attraction.id);
    const audio = getAudioMinutes(
      p.attraction.id,
      audioMinutesByAttractionId,
      p.attraction.audioDurationMinutes
    );
    const travel = p.minutesForPoint;
    const visitExtra = getPointVisitExtraMinutes(excluded, audio);

    if (!excluded) {
      const totalForVisit = travel + visitExtra;
      if (acc + totalForVisit > budgetMinutes && result.length > 0) break;
      acc += totalForVisit;
      result.push(p);
      if (acc > budgetMinutes && result.length === 1) break;
    } else {
      acc += travel;
    }
  }

  if (result.length === 0) {
    for (let i = startIdx; i < allPoints.length; i++) {
      if (!excludedIds.has(allPoints[i].attraction.id)) {
        result.push(allPoints[i]);
        break;
      }
    }
  }

  return result;
}

export async function loadAudioDurationSeconds(url: string): Promise<number> {
  if (!url) return 0;
  const cached = audioDurationSecondsCache.get(url);
  if (cached !== undefined) return cached;

  return new Promise((resolve) => {
    const audio = new Audio(url);
    audio.preload = "metadata";

    const finish = (seconds: number) => {
      audioDurationSecondsCache.set(url, seconds);
      resolve(seconds);
    };

    audio.addEventListener("loadedmetadata", () => {
      finish(Number.isFinite(audio.duration) ? audio.duration : 0);
    });
    audio.addEventListener("error", () => finish(0));
  });
}

/** Загружает длительности аудио по id достопримечательности (минуты, ceil). */
export async function loadAudioMinutesByAttractionId(
  points: RoutePointForTime[]
): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  const tasks = points.map(async (p) => {
    if (p.attraction.audioDurationMinutes != null) {
      map.set(p.attraction.id, p.attraction.audioDurationMinutes);
      return;
    }
    const url = p.attraction.audioUrl;
    if (!url) {
      map.set(p.attraction.id, 0);
      return;
    }
    const seconds = await loadAudioDurationSeconds(url);
    map.set(p.attraction.id, ceilAudioMinutes(seconds));
  });
  await Promise.all(tasks);
  return map;
}
