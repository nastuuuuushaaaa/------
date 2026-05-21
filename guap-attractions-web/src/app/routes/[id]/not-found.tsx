import Link from "next/link";

export default function RouteNotFound() {
  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <h1 className="mb-2 text-lg font-bold text-guap-heading">Маршрут не найден</h1>
        <p className="mb-6 text-sm text-suai-text">
          В базе нет маршрута с таким номером или он был удалён.
        </p>
        <Link
          href="/"
          className="text-suai-brand underline underline-offset-4 hover:opacity-90"
        >
          Вернуться к списку маршрутов
        </Link>
      </div>
    </main>
  );
}
