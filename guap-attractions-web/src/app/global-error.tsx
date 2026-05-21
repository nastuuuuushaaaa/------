"use client";

/**
 * Если падает самый верхний layout — подхватываем здесь. Стили из layout.tsx
 * могут не подтянуться, поэтому всё об стиле прямо в разметке.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily:
            'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 13,
          color: "#606265",
          background: "#f7f9fa",
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            padding: 32,
            borderRadius: 12,
            border: "1px solid #e4e5e7",
            background: "#fff",
            boxShadow: "0 0 .5rem rgba(0,0,0,.075)",
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: "0 0 12px", fontSize: 18, color: "#333" }}>
            Критическая ошибка
          </h1>
          <p style={{ margin: "0 0 16px", lineHeight: 1.5 }}>
            Приложение не смогло загрузиться. Остановите сервер разработки, выполните{" "}
            <code style={{ background: "#f0f4f8", padding: "2px 6px", borderRadius: 4 }}>
              npm run clean
            </code>
            , затем{" "}
            <code style={{ background: "#f0f4f8", padding: "2px 6px", borderRadius: 4 }}>
              npm run dev
            </code>
            . Проект в папке OneDrive иногда ломает кэш сборки — перенос в обычную
            папку на диске помогает.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <p
              style={{
                margin: "0 0 16px",
                textAlign: "left",
                fontFamily: "ui-monospace, monospace",
                fontSize: 11,
                color: "#c00",
                wordBreak: "break-all",
              }}
            >
              {error.message}
            </p>
          )}
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              fontSize: 13,
              fontWeight: 600,
              color: "#fff",
              background: "#005aaa",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
