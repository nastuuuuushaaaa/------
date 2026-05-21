/**
 * Адрес API без слэша на конце.
 * Если переменная окружения пустая — не подставляем её, иначе запросы уйдут в Next и словят 404.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/+$/, "");
  return "http://localhost:7181";
}
