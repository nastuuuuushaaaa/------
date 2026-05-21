export type User = {
  id: number;
  firstName: string;
  lastName?: string | null;
  email: string;
};

const STORAGE_KEY = "guap_user";

/** Приводит поля к одному виду: с сервера иногда приходят имена с большой буквы. */
export function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = Number(o.id ?? o.Id);
  const firstName = String(o.firstName ?? o.FirstName ?? "");
  const email = String(o.email ?? o.Email ?? "");
  if (!Number.isFinite(id) || !email) return null;
  const lastName = o.lastName ?? o.LastName;
  return {
    id,
    firstName,
    email,
    lastName: lastName == null || lastName === "" ? null : String(lastName),
  };
}

export function saveUser(user: User) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function loadUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearUser() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

