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

export async function apiPut<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  token: string,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
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

export type Assignment = {
  id: string;
  title: string;
  description: string;
  mode: "individual" | "team";
  dueAt: string;
  maxScore: string | number;
  publishedAt: string | null;
  attachments?: Array<{
    id: string;
    kind: string;
    originalName: string;
    externalUrl?: string | null;
    mimeType: string;
  }>;
};

export type Submission = {
  id: string;
  status: string;
  content: string | null;
  submittedAt: string | null;
  attachments?: Array<{
    id: string;
    kind: string;
    originalName: string;
    externalUrl?: string | null;
  }>;
  grade?: { score: string | number; feedback: string | null } | null;
  student?: { id: string; fullName: string } | null;
};

export async function listAssignments(token: string, classId: string) {
  return apiGet<Assignment[]>(`/classes/${classId}/assignments`, token);
}

export async function createAssignment(
  token: string,
  classId: string,
  input: {
    title: string;
    description: string;
    mode: "individual" | "team";
    dueAt: string;
    maxScore: number;
    linkAttachments?: Array<{ url: string; title: string }>;
  },
) {
  return apiPost<Assignment>(`/classes/${classId}/assignments`, input, token);
}

export async function publishAssignment(token: string, id: string) {
  return apiPost<Assignment>(`/assignments/${id}/publish`, {}, token);
}

export async function getAssignment(token: string, id: string) {
  return apiGet<Assignment>(`/assignments/${id}`, token);
}

export async function submitAssignment(
  token: string,
  id: string,
  input: {
    content?: string;
    attachmentIds?: string[];
    linkAttachments?: Array<{ url: string; title: string }>;
  },
) {
  return apiPost<Submission>(`/assignments/${id}/submit`, input, token);
}

export async function mySubmission(token: string, id: string) {
  return apiGet<Submission | null>(`/assignments/${id}/submissions/me`, token);
}

export async function listSubmissions(token: string, id: string) {
  return apiGet<Submission[]>(`/assignments/${id}/submissions`, token);
}

export async function gradeSubmission(
  token: string,
  submissionId: string,
  input: { score: number; feedback?: string },
) {
  return apiPost(`/submissions/${submissionId}/grade`, input, token);
}

export async function createLinkAttachment(
  token: string,
  input: { url: string; title: string; purpose?: string },
) {
  return apiPost<{ id: string }>("/files/link", input, token);
}

export type ExamSummary = {
  id: string;
  title: string;
  publishedAt: string | null;
  questionsPerAttempt: number;
  maxAttempts: number | null;
  minPassingScore: string | number | null;
  _count?: { questions: number; attempts: number };
};

export type ExamAttemptView = {
  id: string;
  attemptNo: number;
  status: string;
  score?: string | number;
  maxScore?: string | number;
  passed?: boolean | null;
  timeLimitMin?: number | null;
  questions: Array<{
    questionId: string;
    position: number;
    type: string;
    prompt: string;
    points: string | number;
    allowFileUpload: boolean;
    options?: Array<{ id: string; text: string }>;
    answer: {
      value: unknown;
      isCorrect?: boolean | null;
      pointsAwarded?: string | number;
    } | null;
  }>;
};

export async function listExams(token: string, classId: string) {
  return apiGet<ExamSummary[]>(`/classes/${classId}/exams`, token);
}

export async function createExam(
  token: string,
  classId: string,
  input: Record<string, unknown>,
) {
  return apiPost(`/classes/${classId}/exams`, input, token);
}

export async function publishExam(token: string, id: string) {
  return apiPost(`/exams/${id}/publish`, {}, token);
}

export async function startExam(token: string, id: string) {
  return apiPost<ExamAttemptView>(`/exams/${id}/start`, {}, token);
}

export async function answerExam(
  token: string,
  attemptId: string,
  input: { questionId: string; answer?: unknown; attachmentIds?: string[] },
) {
  return apiPost(`/attempts/${attemptId}/answer`, input, token);
}

export async function submitExam(token: string, attemptId: string) {
  return apiPost<ExamAttemptView>(`/attempts/${attemptId}/submit`, {}, token);
}

export async function getHealth() {
  const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
  if (!res.ok) throw new Error("API health check failed");
  return res.json() as Promise<{ status: string; service: string; phase: number }>;
}

export type SmtpPublicSettings = {
  configured: boolean;
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  hasPassword: boolean;
  sourceHint?: string;
  updatedAt?: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsPage = {
  data: NotificationItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
};

export async function getSmtpSettings(token: string) {
  return apiGet<SmtpPublicSettings>("/admin/smtp", token);
}

export async function updateSmtpSettings(
  token: string,
  input: {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    username?: string | null;
    password?: string | null;
    fromEmail: string;
    fromName: string;
  },
) {
  return apiPut<SmtpPublicSettings>("/admin/smtp", input, token);
}

export async function testSmtp(token: string, to: string) {
  return apiPost<{ ok: boolean; skipped?: boolean; messageId?: string }>(
    "/admin/smtp/test",
    { to },
    token,
  );
}

export async function listNotifications(
  token: string,
  opts?: { unreadOnly?: boolean; page?: number },
) {
  const q = new URLSearchParams();
  if (opts?.unreadOnly) q.set("unreadOnly", "true");
  if (opts?.page) q.set("page", String(opts.page));
  const qs = q.toString();
  return apiGet<NotificationsPage>(
    `/notifications${qs ? `?${qs}` : ""}`,
    token,
  );
}

export async function markNotificationRead(token: string, id: string) {
  return apiPatch(`/notifications/${id}/read`, {}, token);
}

export async function markAllNotificationsRead(token: string) {
  return apiPost("/notifications/read-all", {}, token);
}

export type ParentChild = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};
export type ChildSummary = ParentChild;

export type ChildGrade = {
  id: string;
  score: string | number;
  maxScore: string | number;
  feedback: string | null;
  assignment?: { id: string; title: string; classId: string } | null;
};

export type ChildSubmission = {
  id: string;
  status: string;
  submittedAt: string | null;
  assignment?: { id: string; title: string; classId: string; dueAt?: string } | null;
  grade?: { score: string | number; maxScore?: string | number | null } | null;
};

export type ParentLinkRequest = {
  id: string;
  status: string;
  createdAt: string;
  parent: { id: string; fullName: string; email: string };
  student: { id: string; fullName: string; email: string };
};

export type AdminStats = {
  users: number;
  teachers: number;
  students: number;
  parents: number;
  classes: number;
  assignments: number;
  submissions: number;
  exams: number;
  pendingParentLinks: number;
};

export async function requestParentLink(token: string, studentEmail: string) {
  return apiPost<ParentLinkRequest>(
    "/parents/link-request",
    { studentEmail },
    token,
  );
}

export async function listParentLinkRequests(token: string) {
  return apiGet<ParentLinkRequest[]>("/parents/link-requests", token);
}

export async function approveParentLink(token: string, id: string) {
  return apiPost<ParentLinkRequest>(
    `/parents/link-requests/${id}/approve`,
    {},
    token,
  );
}

export async function rejectParentLink(token: string, id: string) {
  return apiPost<ParentLinkRequest>(
    `/parents/link-requests/${id}/reject`,
    {},
    token,
  );
}

export async function listParentChildren(token: string) {
  return apiGet<ParentChild[]>("/parents/children", token);
}

export async function getChildGrades(token: string, childId: string) {
  return apiGet<ChildGrade[]>(`/parents/children/${childId}/grades`, token);
}

export async function getChildSubmissions(token: string, childId: string) {
  return apiGet<ChildSubmission[]>(
    `/parents/children/${childId}/submissions`,
    token,
  );
}

export async function getAdminStats(token: string) {
  return apiGet<AdminStats>("/admin/stats", token);
}

export async function inviteUser(
  token: string,
  input: {
    email: string;
    fullName: string;
    role: "TEACHER" | "STUDENT" | "PARENT" | "ADMIN";
    password: string;
    schoolId?: string | null;
  },
) {
  return apiPost("/admin/users/invite", input, token);
}

export async function listUsers(
  token: string,
  opts?: { role?: string; q?: string },
) {
  const q = new URLSearchParams();
  if (opts?.role) q.set("role", opts.role);
  if (opts?.q) q.set("q", opts.q);
  const qs = q.toString();
  return apiGet<{
    data: Array<{
      id: string;
      email: string;
      fullName: string;
      role: string;
      schoolId: string | null;
    }>;
    meta: { total: number };
  }>(`/users${qs ? `?${qs}` : ""}`, token);
}
