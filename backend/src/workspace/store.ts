export type WorkspaceNodeKind = "project" | "seed";
export type WorkspaceNodeStatus = "planning" | "active" | "paused" | "completed";
export type ProjectDirection = "personal" | "creative" | "learning" | "community" | "venture" | "other";

export interface WorkspaceNodeRecord {
  id: string;
  title: string;
  description: string;
  kind: WorkspaceNodeKind;
  status: WorkspaceNodeStatus;
  progress: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WorkspaceProject extends WorkspaceNodeRecord {
  direction: ProjectDirection;
  purpose: string;
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectInput {
  title: string;
  purpose: string;
  direction: ProjectDirection;
  nextAction: string;
}

const projectColors = ["#dfae63", "#cc7b5b", "#9eb488", "#d4a46f", "#d78397", "#9db9b0"];
const projects: WorkspaceProject[] = [];
const reflections: Array<{ id: string; answer: string; createdAt: string }> = [];

export function listWorkspaceNodes(): WorkspaceNodeRecord[] {
  return projects.map((project) => toNode(project));
}

export function getWorkspaceDashboard() {
  return {
    dailyFocus: null,
    projects: projects.map((project) => ({ ...project })),
    knowledge: [],
    research: [],
    assets: [],
    worlds: [],
    reflectionCount: reflections.length
  };
}

export function createProject(input: ProjectInput): WorkspaceProject {
  const index = projects.length;
  const now = new Date().toISOString();
  const angle = index * 2.399963229728653;
  const radius = 120 + Math.floor(index / 4) * 110;

  const project: WorkspaceProject = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.purpose,
    purpose: input.purpose,
    direction: input.direction,
    nextAction: input.nextAction,
    kind: "project",
    status: "planning",
    progress: 0,
    color: projectColors[index % projectColors.length]!,
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
    width: 270,
    height: 168,
    createdAt: now,
    updatedAt: now
  };

  projects.push(project);
  return { ...project };
}

export function updateProject(projectId: string, input: { nextAction: string }): WorkspaceProject | null {
  const project = projects.find((candidate) => candidate.id === projectId);

  if (!project) return null;

  project.nextAction = input.nextAction;
  project.status = "active";
  project.updatedAt = new Date().toISOString();
  return { ...project };
}

export function saveReflection(answer: string) {
  const reflection = {
    id: crypto.randomUUID(),
    answer,
    createdAt: new Date().toISOString()
  };

  reflections.push(reflection);
  return reflection;
}

export function getFocus(projectId?: string) {
  const project = projectId
    ? projects.find((candidate) => candidate.id === projectId)
    : projects.find((candidate) => candidate.status !== "completed") ?? projects[0];

  if (!project) return null;

  return {
    projectId: project.id,
    title: project.title,
    action: project.nextAction || "Name one small next action that you can complete this week.",
    reason: project.nextAction
      ? "This is the action you chose. Protect enough time to finish it before adding more to the field."
      : "A project becomes real when its next action is specific enough to do."
  };
}

function toNode(project: WorkspaceProject): WorkspaceNodeRecord {
  const { direction: _direction, purpose: _purpose, nextAction: _nextAction, createdAt: _createdAt, updatedAt: _updatedAt, ...node } = project;
  return { ...node };
}
