'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/api-base";
import { loadUser } from "@/lib/auth";

const API_BASE = getApiBaseUrl();

type QuizDto = {
  id: number;
  routeId: number;
  title: string;
  description?: string | null;
};

type QuestionDto = {
  id: number;
  quizId: number;
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctIndex: number;
};

type ResultResponse = {
  id: number;
  correctAnswers: number;
  totalQuestions: number;
};

export default function QuizPage() {
  const params = useParams();
  const routeId = Number(params.routeId);

  const [quiz, setQuiz] = useState<QuizDto | null>(null);
  const [questions, setQuestions] = useState<QuestionDto[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<ResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId || isNaN(routeId)) return;

    const load = async () => {
      try {
        const quizRes = await fetch(`${API_BASE}/api/quiz/by-route/${routeId}`);
        if (!quizRes.ok) {
          setError("Викторина для этого маршрута не найдена.");
          setLoading(false);
          return;
        }

        const quizData = (await quizRes.json()) as QuizDto;
        setQuiz(quizData);

        const questionsRes = await fetch(`${API_BASE}/api/quiz/${quizData.id}/questions`);
        const questionsData = (await questionsRes.json()) as QuestionDto[];

        setQuestions(questionsData);
        setAnswers(new Array(questionsData.length).fill(null));
      } catch {
        setError("Ошибка загрузки викторины.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [routeId]);

  const handleSelectAnswer = (questionIdx: number, optionIdx: number) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[questionIdx] = optionIdx;
      return copy;
    });
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    const user = loadUser();
    if (!user) {
      setError("Необходимо войти в аккаунт для сохранения результата.");
      return;
    }

    const payload = answers.map((a) => a ?? 0);

    try {
      const res = await fetch(`${API_BASE}/api/quiz/${quiz.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(user.id),
        },
        body: JSON.stringify({ answers: payload }),
      });

      if (!res.ok) {
        setError("Ошибка отправки результатов.");
        return;
      }

      const data = (await res.json()) as ResultResponse;
      setResult(data);
    } catch {
      setError("Ошибка отправки результатов.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-page flex items-center justify-center">
        <p className="text-guap-muted">Загрузка викторины...</p>
      </main>
    );
  }

  if (error && !quiz) {
    return (
      <main className="min-h-page flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <Link href="/quizzes" className="text-suai-brand underline underline-offset-4 hover:opacity-90">
            Все викторины
          </Link>
        </div>
      </main>
    );
  }

  if (result) {
    const percentage = Math.round((result.correctAnswers / result.totalQuestions) * 100);
    const isGood = percentage >= 70;

    return (
      <main className="min-h-page">
        <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
          <h1 className="text-xl font-bold tracking-tight text-guap-heading">
            Результат викторины
          </h1>
          {quiz && <p className="text-suai-text">{quiz.title}</p>}

          <div
            className={`space-y-3 rounded-suai border p-6 text-center ${
              isGood ? "border-[#7bcd4a]/50 bg-[#f4fbf0]" : "border-suai-border bg-[#fff8f0]"
            }`}
          >
            <p className="text-4xl font-bold text-guap-heading">
              {result.correctAnswers} / {result.totalQuestions}
            </p>
            <p className="text-lg text-suai-text">
              {percentage}% правильных ответов
            </p>
            <p className="text-sm text-suai-text">
              {isGood
                ? "Отличный результат! Вы хорошо знаете этот маршрут."
                : "Попробуйте пройти маршрут ещё раз и узнать больше!"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/quizzes"
              className="rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
            >
              Все викторины
            </Link>
            <Link
              href="/profile"
              className="rounded-lg border border-suai-border px-4 py-2 text-[13px] font-medium text-suai-text transition hover:bg-guap-hover"
            >
              Личный кабинет
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const currentQuestion = questions[currentIdx];
  const options = currentQuestion
    ? [currentQuestion.option1, currentQuestion.option2, currentQuestion.option3, currentQuestion.option4]
    : [];

  const allAnswered = answers.every((a) => a !== null);

  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <nav className="text-sm text-guap-muted">
          <Link href="/quizzes" className="text-suai-brand underline underline-offset-4 hover:opacity-90">
            Викторины
          </Link>{" "}
          <span>/</span>{" "}
          <span className="text-suai-text">{quiz?.title ?? "Викторина"}</span>
        </nav>

        <header className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-guap-heading">
            {quiz?.title}
          </h1>
          {quiz?.description && (
            <p className="text-sm text-suai-text">{quiz.description}</p>
          )}
        </header>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
            {error}
          </p>
        )}

        <div className="space-y-5 rounded-suai border border-suai-border bg-guap-card p-5 shadow-suai">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-suai-brand">
              Вопрос {currentIdx + 1} из {questions.length}
            </p>
            <div className="flex flex-wrap gap-1">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-7 w-7 rounded-full text-xs font-semibold transition ${
                    idx === currentIdx
                      ? "bg-suai-button text-white"
                      : answers[idx] !== null
                      ? "bg-[#e8f2fb] text-suai-brand dark:bg-[#1a3a52] dark:text-suai-brand"
                      : "bg-guap-pill text-guap-muted"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <p className="text-base font-medium text-guap-heading">
            {currentQuestion?.text}
          </p>

          <div className="space-y-2">
            {options.map((opt, optIdx) => {
              const selected = answers[currentIdx] === optIdx + 1;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectAnswer(currentIdx, optIdx + 1)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-[13px] transition ${
                    selected
                      ? "border-suai-brand bg-[#f0f6fc] text-suai-brand"
                      : "border-suai-border bg-guap-card text-suai-text hover:border-suai-brand hover:bg-guap-hover"
                  }`}
                >
                  <span className="font-semibold mr-2">
                    {String.fromCharCode(1040 + optIdx)}.
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className={`rounded-lg border px-4 py-2 text-xs font-medium transition ${
                currentIdx > 0
                  ? "border-suai-border text-suai-text hover:bg-guap-hover"
                  : "cursor-default border-[#e9ecef] text-[#dee2e6]"
              }`}
            >
              ← Назад
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="rounded-lg border border-suai-border px-4 py-2 text-xs font-medium text-suai-text transition hover:bg-guap-hover"
              >
                Далее →
              </button>
            ) : (
              <button
                type="button"
                disabled={!allAnswered}
                onClick={handleSubmit}
                className={`rounded-lg px-5 py-2 text-[13px] font-semibold transition ${
                  allAnswered
                    ? "bg-[#7bcd4a] text-white hover:opacity-90"
                    : "cursor-default bg-gray-200 text-gray-400 dark:bg-guap-pill dark:text-guap-muted"
                }`}
              >
                Завершить викторину
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
