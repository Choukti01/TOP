const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

export interface ApiHealth {
  status: "ok";
  service: "top-api";
  timestamp: string;
}

export type ProjectDirection = "personal" | "creative" | "learning" | "community" | "venture" | "other";
export type ProjectStatus = "planning" | "active" | "paused" | "completed";

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
    throw new Error(payload?.error ?? `TOP API request failed with status ${response.status}.`);
  }

  return response.json() as Promise<T>;
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

export function updateWorkspaceProject(projectId: string, input: { nextAction: string }): Promise<{ project: WorkspaceProject }> {
  return request<{ project: WorkspaceProject }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
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
