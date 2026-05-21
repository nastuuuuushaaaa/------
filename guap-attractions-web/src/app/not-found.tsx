import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-page flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md space-y-4 text-center">
        <p className="text-5xl font-bold text-suai-brand">404</p>
        <h1 className="text-lg font-bold text-guap-heading">Страница не найдена</h1>
        <p className="text-sm text-suai-text">
          Такого адреса нет в приложении. Проверьте ссылку или вернитесь на
          главную.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-suai-button px-4 py-2 text-[13px] font-semibold text-white transition hover:opacity-90"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
