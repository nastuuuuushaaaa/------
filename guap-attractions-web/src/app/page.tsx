import HomeRouteList from "@/components/HomeRouteList";
import { getApiBaseUrl } from "@/lib/api-base";

type RouteSummaryDto = {
  id: number;
  title: string;
  description?: string | null;
  direction: string;
  imageUrl?: string | null;
  pointsCount: number;
  durationMinutes: number;
};

const API_BASE = getApiBaseUrl();

async function fetchRoutes(): Promise<RouteSummaryDto[]> {
  const res = await fetch(`${API_BASE}/api/routes`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Не удалось загрузить маршруты");
  }

  return res.json();
}

export default async function Home() {
  const routes = await fetchRoutes();

  return (
    <main className="min-h-page">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-6">
        <header>
          <h1 className="mb-1 text-xl font-bold tracking-tight text-guap-heading sm:text-2xl">
            Маршруты
          </h1>
          <p className="text-suai-text">
            Выберите прогулку от главного корпуса и узнайте историю зданий
            поблизости.
          </p>
        </header>

        <HomeRouteList routes={routes} />
      </div>
    </main>
  );
}
