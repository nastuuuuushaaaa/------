/**
 * Вытаскивает текст ошибки из ответа: простой текст, JSON от сервера или по коду статуса.
 */
export async function readApiErrorMessage(res: Response, apiBase: string): Promise<string> {
  const raw = await res.text();
  const trimmed = raw.trim();

  if (trimmed) {
    if (trimmed.startsWith("{")) {
      try {
        const j = JSON.parse(trimmed) as Record<string, unknown>;
        const message = j.message ?? j.Message;
        if (typeof message === "string" && message.length > 0) return message;

        const title = j.title ?? j.Title;
        const detail = j.detail ?? j.Detail;
        if (typeof title === "string" && typeof detail === "string" && detail.length > 0) {
          return `${title}: ${detail}`;
        }
        if (typeof title === "string" && title.length > 0) return title;
        if (typeof detail === "string" && detail.length > 0) return detail;

        const errors = j.errors ?? j.Errors;
        if (errors && typeof errors === "object" && errors !== null) {
          const lines: string[] = [];
          for (const v of Object.values(errors as Record<string, unknown>)) {
            if (Array.isArray(v)) lines.push(...v.map(String));
            else if (v != null) lines.push(String(v));
          }
          if (lines.length) return lines.join("; ");
        }
      } catch {
        /* не JSON */
      }
    }
    if (trimmed.length < 800) return trimmed;
    return `${trimmed.slice(0, 400)}…`;
  }

  const { status, statusText } = res;
  if (status === 404) {
    return `Маршрут API не найден (404). Остановите старый процесс GuapAttractions.Api, затем из папки GuapAttractions.Api выполните: dotnet run --urls http://localhost:7181. Проверка: в браузере откройте ${apiBase}/api/auth/ping — должен вернуться JSON с ok: true; если там тоже 404, на порту всё ещё старая сборка или другой сервис. Сейчас запрос шёл на: ${apiBase}`;
  }
  if (status === 401 || status === 403) {
    return `Доступ запрещён (${status}).`;
  }
  if (status >= 500) {
    return `Ошибка на сервере (${status}${statusText ? ` ${statusText}` : ""}).`;
  }
  return `Запрос не выполнен (${status}${statusText ? ` ${statusText}` : ""}).`;
}
