export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  schoolId: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type Classroom = {
  id: string;
  name: string;
  section: string | null;
  subject: string | null;
  joinCode: string;
  _count?: { memberships: number; posts: number };
  memberships?: Array<{ roleInClass: string }>;
};

export type ClassPost = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  author: { id: string; fullName: string; email: string };
  attachments: Array<{ id: string; originalName: string; mimeType: string }>;
};

export type AcademicCycle = {
  id: string;
  name: string;
  schoolId: string;
  isActive: boolean;
};

const ACCESS_KEY = "sca_access_token";
const REFRESH_KEY = "sca_refresh_token";
const USER_KEY = "sca_user";

export function saveSession(data: AuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string };
    return body.message ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string | null,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function loginRequest(email: string, password: string) {
  return apiPost<AuthResponse>("/auth/login", { email, password });
}

export async function registerRequest(input: {
  email: string;
  password: string;
  fullName: string;
  role: "TEACHER" | "STUDENT" | "PARENT";
}) {
  return apiPost<AuthResponse>("/auth/register", input);
}

export async function listClasses(token: string) {
  return apiGet<Classroom[]>("/classes", token);
}

export async function createClass(
  token: string,
  input: {
    name: string;
    cycleId: string;
    section?: string;
    subject?: string;
  },
) {
  return apiPost<Classroom>("/classes", input, token);
}

export async function joinClass(token: string, joinCode: string) {
  return apiPost<{ class: Classroom }>("/classes/join", { joinCode }, token);
}

export async function getClass(token: string, id: string) {
  return apiGet<Classroom & { joinCode: string }>("/classes/" + id, token);
}

export async function listPosts(token: string, classId: string) {
  return apiGet<ClassPost[]>(`/classes/${classId}/posts`, token);
}

export async function createPost(
  token: string,
  classId: string,
  input: { title: string; body: string; attachmentIds?: string[] },
) {
  return apiPost<ClassPost>(`/classes/${classId}/posts`, input, token);
}

export async function listCycles(token: string) {
  return apiGet<AcademicCycle[]>("/cycles", token);
}

export async function getHealth() {
  const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("API health check failed");
  return res.json() as Promise<{ status: string; service: string; phase: number }>;
}
