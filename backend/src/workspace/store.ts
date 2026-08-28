export type WorkspaceNodeKind = "project" | "seed";
export type WorkspaceNodeStatus = "planning" | "active" | "paused" | "completed";
export type ProjectDirection = "personal" | "creative" | "learning" | "community" | "venture" | "other";
export type ProjectMilestoneStatus = "planned" | "completed";
export type ProjectArtifactKind = "atelier" | "canvas" | "blueprint" | "note" | "link" | "other";
export type ProjectActivityType = "project-started" | "project-state-updated" | "next-action-updated" | "milestone-added" | "milestone-completed" | "milestone-reopened" | "artifact-recorded" | "invitation-sent" | "invitation-accepted" | "member-role-updated" | "member-removed" | "circle-updated" | "circle-message-sent" | "contribution-recorded" | "review-recorded";
export type ProjectMemberRole = "owner" | "contributor" | "mentor";
export type ProjectContributionType = "idea" | "research" | "design" | "code" | "funding" | "mentorship" | "operations" | "other";
export type ProjectMessageKind = "update" | "question" | "decision" | "request" | "celebration";

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
  contributorId: string | null;
  contributorName: string | null;
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

export interface ProjectReview {
  id: string;
  projectId: string;
  proudOf: string;
  learned: string | null;
  nextFocus: string | null;
  createdAt: string;
}

export interface ProjectCollaborator {
  userId: string;
  displayName: string;
  avatarDataUrl: string | null;
  role: ProjectMemberRole;
  joinedAt: string;
}

export interface ProjectContribution {
  id: string;
  projectId: string;
  contributorId: string;
  contributorName: string;
  type: ProjectContributionType;
  description: string;
  evidenceUrl: string | null;
  createdAt: string;
}

export interface ProjectMessage {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  kind: ProjectMessageKind;
  body: string;
  createdAt: string;
}

export interface ProjectAccess {
  role: ProjectMemberRole;
  canManage: boolean;
}

export interface ProjectPendingInvitation {
  id: string;
  inviteeId: string;
  displayName: string;
  role: Exclude<ProjectMemberRole, "owner">;
  createdAt: string;
}

export interface CollaborationInvitation {
  id: string;
  projectId: string;
  projectTitle: string;
  inviterName: string;
  role: Exclude<ProjectMemberRole, "owner">;
  createdAt: string;
}

export interface TopNotification {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface WorkspaceProjectDetail {
  project: WorkspaceProject;
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
  reviews: ProjectReview[];
  collaborators: ProjectCollaborator[];
  contributions: ProjectContribution[];
  messages: ProjectMessage[];
  access: ProjectAccess;
  pendingInvitations: ProjectPendingInvitation[];
  activity: ProjectActivity[];
}

export interface ProjectUpdateInput {
  nextAction?: string;
  status?: WorkspaceNodeStatus;
}

export interface ProjectFieldPositionInput {
  x: number;
  y: number;
}

interface ProjectInput {
  title: string;
  purpose: string;
  direction: ProjectDirection;
  nextAction: string;
  seedId?: string;
}

interface PersonalWorkspace {
  projects: WorkspaceProject[];
  reflections: Array<{ id: string; answer: string; createdAt: string }>;
  projectReviews: ProjectReview[];
  contributions: ProjectContribution[];
  milestones: ProjectMilestone[];
  artifacts: ProjectArtifact[];
  activities: ProjectActivity[];
  messages: ProjectMessage[];
}

const projectColors = ["#dfae63", "#cc7b5b", "#9eb488", "#d4a46f", "#d78397", "#9db9b0"];
const workspaces = new Map<string, PersonalWorkspace>();

function workspaceFor(userId: string): PersonalWorkspace {
  const existing = workspaces.get(userId);
  if (existing) return existing;
  const workspace: PersonalWorkspace = { projects: [], reflections: [], projectReviews: [], contributions: [], milestones: [], artifacts: [], activities: [], messages: [] };
  workspaces.set(userId, workspace);
  return workspace;
}

export function listWorkspaceNodes(userId: string): WorkspaceNodeRecord[] {
  return workspaceFor(userId).projects.map((project) => toNode(project));
}

export function getWorkspaceDashboard(userId: string) {
  const workspace = workspaceFor(userId);
  return {
    dailyFocus: null,
    projects: workspace.projects.map((project) => ({ ...project })),
    knowledge: [],
    research: [],
    assets: [],
    worlds: [],
    reflectionCount: workspace.reflections.length + workspace.projectReviews.length
  };
}

export function getPersonalDashboard(userId: string) {
  const workspace = workspaceFor(userId);
  const completedMilestones = workspace.milestones.filter((milestone) => milestone.status === "completed").length;
  const activeProjects = workspace.projects.filter((project) => project.status !== "completed");

  return {
    summary: {
      projectCount: workspace.projects.length,
      activeProjectCount: activeProjects.length,
      completedMilestoneCount: completedMilestones,
      milestoneCount: workspace.milestones.length,
      evidenceCount: workspace.artifacts.length,
      reflectionCount: workspace.reflections.length + workspace.projectReviews.length
    },
    projects: workspace.projects.map((project) => ({ ...project })),
    openActions: activeProjects
      .filter((project) => project.nextAction.trim().length > 0)
      .map((project) => ({ projectId: project.id, projectTitle: project.title, action: project.nextAction, progress: project.progress })),
    recentActivity: workspace.activities
      .map((activity) => ({ ...activity }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 8)
  };
}

export function createProject(userId: string, input: ProjectInput): WorkspaceProject {
  const workspace = workspaceFor(userId);
  const index = workspace.projects.length;
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

  workspace.projects.push(project);
  addActivity(workspace, project.id, "project-started", "Project started", "This commitment now has a place in your field.", now);
  return { ...project };
}

export function updateProject(userId: string, projectId: string, input: ProjectUpdateInput): WorkspaceProject | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);

  if (!project) return null;

  if (input.nextAction !== undefined) {
    project.nextAction = input.nextAction;
    if (input.status === undefined) project.status = "active";
  }
  if (input.status !== undefined) project.status = input.status;
  project.updatedAt = new Date().toISOString();
  if (input.nextAction !== undefined) {
    addActivity(workspace, project.id, "next-action-updated", "Next move protected", input.nextAction, project.updatedAt);
  }
  if (input.status !== undefined) {
    addActivity(workspace, project.id, "project-state-updated", projectStateActivityTitle(input.status), null, project.updatedAt);
  }
  return { ...project };
}

export function updateProjectPosition(userId: string, projectId: string, input: ProjectFieldPositionInput): WorkspaceProject | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);

  if (!project) return null;

  project.x = input.x;
  project.y = input.y;
  project.updatedAt = new Date().toISOString();
  return { ...project };
}

export function getProjectDetail(userId: string, projectId: string): WorkspaceProjectDetail | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  if (!project) return null;

  return {
    project: { ...project },
    milestones: workspace.milestones
      .filter((milestone) => milestone.projectId === projectId)
      .map((milestone) => ({ ...milestone })),
    artifacts: workspace.artifacts
      .filter((artifact) => artifact.projectId === projectId)
      .map((artifact) => ({ ...artifact })),
    reviews: workspace.projectReviews
      .filter((review) => review.projectId === projectId)
      .map((review) => ({ ...review }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    collaborators: [{ userId, displayName: "You", avatarDataUrl: null, role: "owner", joinedAt: project.createdAt }],
    contributions: workspace.contributions
      .filter((contribution) => contribution.projectId === projectId)
      .map((contribution) => ({ ...contribution }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    messages: workspace.messages
      .filter((message) => message.projectId === projectId)
      .map((message) => ({ ...message }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    access: { role: "owner", canManage: true },
    pendingInvitations: [],
    activity: workspace.activities
      .filter((activity) => activity.projectId === projectId)
      .map((activity) => ({ ...activity }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  };
}

export function addProjectMilestone(userId: string, projectId: string, title: string): ProjectMilestone | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const milestone: ProjectMilestone = {
    id: crypto.randomUUID(),
    projectId,
    title,
    status: "planned",
    createdAt: now,
    completedAt: null
  };

  workspace.milestones.push(milestone);
  touchProject(workspace, project, now);
  addActivity(workspace, projectId, "milestone-added", "Milestone added", title, now);
  return { ...milestone };
}

export function setProjectMilestoneStatus(userId: string, projectId: string, milestoneId: string, status: ProjectMilestoneStatus): ProjectMilestone | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  const milestone = workspace.milestones.find((candidate) => candidate.id === milestoneId && candidate.projectId === projectId);
  if (!project || !milestone) return null;

  const now = new Date().toISOString();
  milestone.status = status;
  milestone.completedAt = status === "completed" ? now : null;
  touchProject(workspace, project, now);
  addActivity(
    workspace,
    projectId,
    status === "completed" ? "milestone-completed" : "milestone-reopened",
    status === "completed" ? "Milestone completed" : "Milestone reopened",
    milestone.title,
    now
  );
  return { ...milestone };
}

export function addProjectArtifact(userId: string, projectId: string, input: { title: string; kind: ProjectArtifactKind; note?: string }): ProjectArtifact | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const artifact: ProjectArtifact = {
    id: crypto.randomUUID(),
    projectId,
    contributorId: userId,
    contributorName: "You",
    title: input.title,
    kind: input.kind,
    note: input.note || null,
    createdAt: now
  };

  workspace.artifacts.push(artifact);
  touchProject(workspace, project, now);
  addActivity(workspace, projectId, "artifact-recorded", "Evidence recorded", input.title, now);
  return { ...artifact };
}

export function addProjectMessage(userId: string, projectId: string, body: string, kind: ProjectMessageKind = "update"): ProjectMessage | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const message: ProjectMessage = {
    id: crypto.randomUUID(),
    projectId,
    authorId: userId,
    authorName: "You",
    kind,
    body,
    createdAt: now
  };

  workspace.messages.push(message);
  project.updatedAt = now;
  addActivity(workspace, projectId, "circle-message-sent", "Project circle message sent", null, now);
  return { ...message };
}

export function addProjectContribution(userId: string, projectId: string, input: { type: ProjectContributionType; description: string; evidenceUrl?: string }): ProjectContribution | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const contribution: ProjectContribution = {
    id: crypto.randomUUID(),
    projectId,
    contributorId: userId,
    contributorName: "You",
    type: input.type,
    description: input.description,
    evidenceUrl: input.evidenceUrl || null,
    createdAt: now
  };

  workspace.contributions.push(contribution);
  project.updatedAt = now;
  addActivity(workspace, projectId, "contribution-recorded", `${contributionTypeLabel(input.type)} contribution added`, input.description, now);
  return { ...contribution };
}

export function addProjectReview(userId: string, projectId: string, input: { proudOf: string; learned?: string; nextFocus?: string }): ProjectReview | null {
  const workspace = workspaceFor(userId);
  const project = workspace.projects.find((candidate) => candidate.id === projectId);
  if (!project) return null;

  const now = new Date().toISOString();
  const review: ProjectReview = {
    id: crypto.randomUUID(),
    projectId,
    proudOf: input.proudOf,
    learned: input.learned || null,
    nextFocus: input.nextFocus || null,
    createdAt: now
  };

  workspace.projectReviews.push(review);
  project.updatedAt = now;
  addActivity(workspace, projectId, "review-recorded", "Project review kept", input.proudOf, now);
  return { ...review };
}

export function saveReflection(userId: string, answer: string) {
  const workspace = workspaceFor(userId);
  const reflection = {
    id: crypto.randomUUID(),
    answer,
    createdAt: new Date().toISOString()
  };

  workspace.reflections.push(reflection);
  return reflection;
}

export function getFocus(userId: string, projectId?: string) {
  const workspace = workspaceFor(userId);
  const project = projectId
    ? workspace.projects.find((candidate) => candidate.id === projectId)
    : workspace.projects.find((candidate) => candidate.status !== "completed") ?? workspace.projects[0];

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

function touchProject(workspace: PersonalWorkspace, project: WorkspaceProject, updatedAt: string): void {
  project.status = "active";
  project.updatedAt = updatedAt;
  const relatedMilestones = workspace.milestones.filter((milestone) => milestone.projectId === project.id);
  const completedMilestones = relatedMilestones.filter((milestone) => milestone.status === "completed").length;
  project.progress = relatedMilestones.length === 0 ? 0 : Math.round((completedMilestones / relatedMilestones.length) * 100);
}

function projectStateActivityTitle(status: WorkspaceNodeStatus): string {
  return { planning: "Project returned to beginning", active: "Project returned to practice", paused: "Project paused", completed: "Project completed" }[status];
}

function contributionTypeLabel(type: ProjectContributionType): string {
  return { idea: "Idea", research: "Research", design: "Design", code: "Code", funding: "Funding", mentorship: "Mentorship", operations: "Operations", other: "Work" }[type];
}

function addActivity(workspace: PersonalWorkspace, projectId: string, type: ProjectActivityType, title: string, detail: string | null, createdAt: string): void {
  workspace.activities.push({
    id: crypto.randomUUID(),
    projectId,
    type,
    title,
    detail,
    createdAt
  });
}
