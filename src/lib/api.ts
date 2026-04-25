const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export function getApiBaseUrl() {
  return API_URL;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  withAuth = false,
): Promise<T> {
  const url = `${API_URL}${path}`;

  const headers = new Headers(options.headers ?? {});
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (withAuth) {
    const token = localStorage.getItem("voyagemind_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = (data as { message?: string } | null)?.message ?? "Erro ao comunicar com o servidor";
    throw new Error(message);
  }

  return data as T;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  await apiFetch<unknown>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getCurrentUser() {
  return apiFetch<AuthResponse["user"] & { passports?: unknown[] }>("/auth/me", {}, true);
}

export interface PassportItem {
  id: string;
  title: string;
  description?: string | null;
  tag?: string | null;
  unlockDate?: string | null;
  createdAt: string;
}

export async function getPassports(): Promise<PassportItem[]> {
  return apiFetch<PassportItem[]>("/passports", {}, true);
}

export async function createPassport(input: {
  title: string;
  description?: string;
  tag?: string;
  unlockDate?: string;
}) {
  return apiFetch<PassportItem>("/passports", {
    method: "POST",
    body: JSON.stringify(input)
  }, true);
}

export async function getAiSuggestions(input: {
  place: string;
  budget: string;
  days: number;
  blindMode?: boolean;
}) {
  return apiFetch<{
    title: string;
    overview: string;
    itinerary: string[];
    tags: string[];
  }>("/ai/suggest", {
    method: "POST",
    body: JSON.stringify(input)
  }, false);
}

export async function sendAiChatMessage(input: {
  message: string;
  history?: { role: "user" | "model", parts: { text: string }[] }[];
  blindMode?: boolean;
}) {
  return apiFetch<{ text: string }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(input)
  }, false);
}
