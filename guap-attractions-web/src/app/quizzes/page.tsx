'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api-base";
import { loadUser, type User } from "@/lib/auth";

const API_BASE = getApiBaseUrl();

type RouteSummaryDto = {
  id: number;
  title: string;
  direction: string;
};

type QuizInfo = {
  id: number;
  routeId: number;
  title: string;
  description?: string | null;
};

type ProgressInfo = {
  completed: boolean;
};

type QuizResultInfo = {
  id: number;
  quizId: number;
  correctAnswers: number;
  totalQuestions: number;
};

type QuizCard = {
  quiz: QuizInfo;
  route: RouteSummaryDto;
  isUnlocked: boolean;
  bestResult: QuizResultInfo | null;
  attemptsCount: number;
};

export default function QuizzesPage() {
  const [cards, setCards] = useState<QuizCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routesLoaded, setRoutesLoaded] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setAuthReady(true);

    const onLogout = () => setUser(null);
    window.addEventListener("user-logout", onLogout);
    return () => window.removeEventListener("user-logout", onLogout);
  }, []);

  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      setLoadError(null);
      try {
        const routesRes = await fetch(`${API_BASE}/api/routes`);
        if (!routesRes.ok) {
          if (!cancelled) {
            setLoadError(
              `Не удалось загрузить маршруты (код ${routesRes.status}). Проверьте, что API запущен по адресу ${API_BASE}.`
            );
            setRoutesLoaded(0);
            setCards([]);
          }
          return;
        }

        const routes = (await routesRes.json()) as RouteSummaryDto[];
        if (!cancelled) setRoutesLoaded(routes.length);

        const quizMap: Record<number, QuizInfo> = {};
        await Promise.all(
          routes.map(async (route) => {
            try {
              const qRes = await fetch(`${API_BASE}/api/quiz/by-route/${route.id}`);
              if (qRes.ok) {
                quizMap[route.id] = (await qRes.json()) as QuizInfo;
              }
            } catch {
              /* отдельный маршрут без викторины — не ошибка страницы */
            }
          })
        );

        const progressMap: Record<number, ProgressInfo> = {};
        let results: QuizResultInfo[] = [];

        if (user) {
          await Promise.all(
            routes.map(async (route) => {
              try {
                const r = await fetch(`${API_BASE}/api/routes/${route.id}/progress`, {
                  headers: { "X-User-Id": String(user.id) },
                });
                if (r.ok) {
                  progressMap[route.id] = (await r.json()) as ProgressInfo;
                }
              } catch {}
            })
          );

          try {
            const qr = await fetch(`${API_BASE}/api/quiz/results`, {
              headers: { "X-User-Id": String(user.id) },
            });
            if (qr.ok) {
              results = (await qr.json()) as QuizResultInfo[];
            }
          } catch {}
        }

        if (cancelled) return;

        const built: QuizCard[] = [];
        for (const route of routes) {
          const quiz = quizMap[route.id];
          if (!quiz) continue;

          if (!user) {
            built.push({ quiz, route, isUnlocked: false, bestResult: null, attemptsCount: 0 });
            continue;
          }

          const routeAttempts = results.filter((r) => r.quizId === quiz.id);
          const isUnlocked = progressMap[route.id]?.completed === true || routeAttempts.length > 0;
          const best =
            routeAttempts.length > 0
              ? routeAttempts.reduce((a, b) =>
                  a.correctAnswers / (a.totalQuestions || 1) >= b.correctAnswers / (b.totalQuestions || 1) ? a : b
                )
              : null;

          built.push({ quiz, route, isUnlocked, bestResult: best, attemptsCount: routeAttempts.length });
        }

        setCards(built);
      } catch {
        if (!cancelled) {
          setLoadError(
            `Нет связи с API (${API_BASE}). Запустите бэкенд GuapAttractions.Api и проверьте NEXT_PUBLIC_API_BASE_URL в .env.local.`
          );
          setCards([]);
          setRoutesLoaded(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [authReady, user]);

  if (!authReady || loading) {
    return (
      <main className="min-h-page">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-guap-muted">Загрузка викторин...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <header>
          <h1 className="mb-1 text-xl font-bold tracking-tight text-guap-heading sm:text-2xl">
            Викторины
          </h1>
          <p className="text-suai-text">
            Проверьте свои знания о достопримечательностях! Викторина открывается
            после прохождения маршрута.
          </p>
        </header>

        {loadError && (
          <div className="rounded-suai border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 shadow-suai">
            {loadError}
          </div>
        )}

        {!user && (
          <div className="rounded-suai border border-suai-border bg-[#f0f6fc] px-5 py-4 shadow-suai dark:bg-[#1e2835]">
            <p className="mb-3 text-[15px] font-semibold leading-snug text-guap-heading">
              Войдите или зарегистрируйтесь, чтобы проходить викторины.
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
        )}

        {cards.length === 0 && !loadError ? (
          <p className="text-suai-text">
            {routesLoaded === 0
              ? "Нет маршрутов в базе — сначала добавьте маршруты."
              : "Для загруженных маршрутов нет записей викторин в базе (таблица «викторина»). Выполните скрипты заполнения БД или добавьте викторины для этих маршрутов."}
          </p>
        ) : cards.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {cards.map(({ quiz, route, isUnlocked, bestResult, attemptsCount }) => (
              <div
                key={quiz.id}
                className={`space-y-3 rounded-suai border border-suai-border bg-guap-card p-5 transition ${
                  isUnlocked ? "shadow-suai" : ""
                }`}
              >
                <div className={`space-y-1 ${isUnlocked ? "" : "opacity-60"}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-guap-muted">
                    {route.title}
                  </p>
                  <h2 className="text-base font-semibold text-guap-heading">
                    {quiz.title}
                  </h2>
                  {quiz.description && (
                    <p className="text-[13px] text-suai-text">{quiz.description}</p>
                  )}
                </div>

                {bestResult && user && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-guap-muted">Лучший результат:</span>
                    <span
                      className={`font-semibold ${
                        bestResult.correctAnswers / bestResult.totalQuestions >= 0.7
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {bestResult.correctAnswers}/{bestResult.totalQuestions} (
                      {Math.round((bestResult.correctAnswers / bestResult.totalQuestions) * 100)}%)
                    </span>
                    {attemptsCount > 1 && (
                      <span className="text-guap-muted text-xs">· {attemptsCount} попыток</span>
                    )}
                  </div>
                )}

                <div className="pt-1">
                  {isUnlocked ? (
                    <Link
                      href={`/quiz/${route.id}`}
                      className="inline-block rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
                    >
                      {attemptsCount > 0 ? "Пройти ещё раз" : "Пройти викторину"}
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <span className="inline-block rounded-lg bg-guap-pill px-4 py-2 text-sm text-guap-muted cursor-default opacity-60">
                        Закрыто
                      </span>
                      {user && (
                        <p className="text-[13px] font-medium leading-snug text-suai-text">
                          Пройдите{" "}
                          <Link
                            href={`/routes/${route.id}`}
                            className="font-semibold text-suai-brand underline underline-offset-2 hover:opacity-90"
                          >
                            маршрут «{route.title}»
                          </Link>
                          , чтобы открыть
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
