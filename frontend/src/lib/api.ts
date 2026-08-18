const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

export interface ApiHealth {
  status: "ok";
  service: "top-api";
  timestamp: string;
}

export interface WorkspaceNodeData {
  id: string;
  title: string;
  description: string;
  kind: "world" | "venture" | "studio" | "learning" | "seed";
  status: "active" | "growing" | "planning";
  progress: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
  dailyFocus: {
    title: string;
    detail: string;
  };
  projects: Array<{
    id: string;
    title: string;
    category: string;
    nextMove: string;
    signal: string;
    momentum: number;
  }>;
  knowledge: Array<{
    id: string;
    title: string;
    detail: string;
    format: string;
  }>;
  research: Array<{
    id: string;
    title: string;
    detail: string;
  }>;
  assets: Array<{
    id: string;
    title: string;
    type: string;
    detail: string;
  }>;
  worlds: Array<{
    id: string;
    title: string;
    description: string;
    color: string;
  }>;
  reflectionCount: number;
}

export interface FocusSuggestion {
  projectId: string;
  title: string;
  action: string;
  reason: string;
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

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

export function createWorkspaceSeed(input: { title: string; description: string }): Promise<{ seed: WorkspaceNodeData }> {
  return request<{ seed: WorkspaceNodeData }>("/api/v1/workspace/seeds", {
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
