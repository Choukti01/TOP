// Keep the browser app and API on the same localhost site in development so
// the secure session cookie is never treated as a third-party cookie.
const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface ApiHealth {
  status: "ok";
  service: "top-api";
  timestamp: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  biography: string | null;
  location: string | null;
  createdAt: string;
}

export type ProjectDirection = "personal" | "creative" | "learning" | "community" | "venture" | "other";
export type ProjectStatus = "planning" | "active" | "paused" | "completed";
export type ProjectMilestoneStatus = "planned" | "completed";
export type ProjectArtifactKind = "atelier" | "canvas" | "blueprint" | "note" | "link" | "other";
export type ProjectActivityType = "project-started" | "next-action-updated" | "milestone-added" | "milestone-completed" | "milestone-reopened" | "artifact-recorded";

export interface WorkspaceNodeData {
  id: string;
  title: string;
  description: string;
  kind: "project" | "seed";
  status: ProjectStatus;
  progress: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkspaceProject extends WorkspaceNodeData {
  direction: ProjectDirection;
  purpose: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  status: ProjectMilestoneStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface ProjectArtifact {
  id: string;
  projectId: string;
  title: string;
  kind: ProjectArtifactKind;
  note: string | null;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  projectId: string;
  type: ProjectActivityType;
  title: string;
  detail: string | null;
  createdAt: string;
}

export interface WorkspaceProjectDetail {
  project: WorkspaceProject;
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
  activity: ProjectActivity[];
}

export interface WorkspaceOverview {
  world: {
    id: string;
    name: string;
    subtitle: string;
  };
  nodes: WorkspaceNodeData[];
  updatedAt: string;
}

export interface WorkspaceDashboard {
  dailyFocus: null;
  projects: WorkspaceProject[];
  knowledge: Array<{ id: string; title: string; detail: string; format: string }>;
  research: Array<{ id: string; title: string; detail: string }>;
  assets: Array<{ id: string; title: string; type: string; detail: string }>;
  worlds: Array<{ id: string; title: string; description: string; color: string }>;
  reflectionCount: number;
}

export interface FocusSuggestion {
  projectId: string;
  title: string;
  action: string;
  reason: string;
}

export interface PersonalDashboard {
  summary: {
    projectCount: number;
    activeProjectCount: number;
    completedMilestoneCount: number;
    milestoneCount: number;
    evidenceCount: number;
    reflectionCount: number;
  };
  projects: WorkspaceProject[];
  openActions: Array<{ projectId: string; projectTitle: string; action: string; progress: number }>;
  recentActivity: ProjectActivity[];
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: "include",
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("TOP took too long to respond. Your local tools are still available.");
    }

    throw new Error("TOP could not reach the workspace service. Check that the API is running.");
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    if (response.status === 401) window.dispatchEvent(new Event("top-auth-expired"));
    throw new Error(payload?.error ?? `TOP API request failed with status ${response.status}.`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function registerTopAccount(input: { email: string; displayName: string; password: string }): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/v1/auth/register", { method: "POST", body: input });
}

export function loginTopAccount(input: { email: string; password: string }): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/v1/auth/login", { method: "POST", body: input });
}

export function getTopSession(): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/v1/auth/session");
}

export function logoutTopAccount(): Promise<void> {
  return request<void>("/api/v1/auth/logout", { method: "POST" });
}

export function updateTopProfile(input: { displayName?: string; biography?: string | null; location?: string | null }): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/v1/auth/profile", { method: "PATCH", body: input });
}

export function getApiHealth(): Promise<ApiHealth> {
  return request<ApiHealth>("/health");
}

export function getWorkspaceOverview(): Promise<WorkspaceOverview> {
  return request<WorkspaceOverview>("/api/v1/workspace/overview");
}

export function getWorkspaceDashboard(): Promise<WorkspaceDashboard> {
  return request<WorkspaceDashboard>("/api/v1/workspace/dashboard");
}

export function getPersonalDashboard(): Promise<PersonalDashboard> {
  return request<PersonalDashboard>("/api/v1/workspace/profile-dashboard");
}

export function createWorkspaceProject(input: {
  title: string;
  purpose: string;
  direction: ProjectDirection;
  nextAction: string;
}): Promise<{ project: WorkspaceProject }> {
  return request<{ project: WorkspaceProject }>("/api/v1/workspace/projects", {
    method: "POST",
    body: input
  });
}

export function updateWorkspaceProject(projectId: string, input: { nextAction?: string; status?: ProjectStatus }): Promise<{ project: WorkspaceProject }> {
  return request<{ project: WorkspaceProject }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    body: input
  });
}

export function updateWorkspaceProjectPosition(projectId: string, input: { x: number; y: number }): Promise<{ project: WorkspaceProject }> {
  return request<{ project: WorkspaceProject }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/field-position`, {
    method: "PATCH",
    body: input
  });
}

export function getWorkspaceProject(projectId: string): Promise<WorkspaceProjectDetail> {
  return request<WorkspaceProjectDetail>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}`);
}

export function createProjectMilestone(projectId: string, input: { title: string }): Promise<{ milestone: ProjectMilestone }> {
  return request<{ milestone: ProjectMilestone }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/milestones`, {
    method: "POST",
    body: input
  });
}

export function updateProjectMilestone(projectId: string, milestoneId: string, input: { status: ProjectMilestoneStatus }): Promise<{ milestone: ProjectMilestone }> {
  return request<{ milestone: ProjectMilestone }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/milestones/${encodeURIComponent(milestoneId)}`, {
    method: "PATCH",
    body: input
  });
}

export function createProjectArtifact(projectId: string, input: { title: string; kind: ProjectArtifactKind; note?: string }): Promise<{ artifact: ProjectArtifact }> {
  return request<{ artifact: ProjectArtifact }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/artifacts`, {
    method: "POST",
    body: input
  });
}

export function saveWorkspaceReflection(answer: string): Promise<{ message: string }> {
  return request<{ message: string }>("/api/v1/workspace/reflections", {
    method: "POST",
    body: { answer }
  });
}

export function getFocusSuggestion(projectId?: string): Promise<FocusSuggestion> {
  return request<FocusSuggestion>("/api/v1/workspace/focus", {
    method: "POST",
    body: projectId ? { projectId } : {}
  });
}
