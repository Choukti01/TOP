import { and, eq, inArray, or } from "drizzle-orm";

import type { AppConfig } from "../config/env.js";
import { createDatabase } from "../db/client.js";
import { contributions, profiles, projectActivity, projectArtifacts, projectMembers, projectMilestones, projects, reflections, users } from "../db/schema.js";
import {
  addProjectArtifact,
  addProjectContribution,
  addProjectReview,
  addProjectMilestone,
  createProject,
  getFocus,
  getPersonalDashboard,
  getProjectDetail,
  getWorkspaceDashboard,
  listWorkspaceNodes,
  saveReflection,
  setProjectMilestoneStatus,
  updateProject,
  updateProjectPosition,
  type ProjectActivity,
  type ProjectActivityType,
  type ProjectArtifact,
  type ProjectArtifactKind,
  type ProjectCollaborator,
  type ProjectContribution,
  type ProjectContributionType,
  type ProjectDirection,
  type ProjectFieldPositionInput,
  type ProjectMilestone,
  type ProjectMilestoneStatus,
  type ProjectReview,
  type ProjectUpdateInput,
  type WorkspaceNodeRecord,
  type WorkspaceProject,
  type WorkspaceProjectDetail
} from "./store.js";

export interface WorkspaceRepository {
  listNodes(userId: string): Promise<WorkspaceNodeRecord[]>;
  getDashboard(userId: string): Promise<ReturnType<typeof getWorkspaceDashboard>>;
  getPersonalDashboard(userId: string): Promise<ReturnType<typeof getPersonalDashboard>>;
  createProject(userId: string, input: ProjectInput): Promise<WorkspaceProject>;
  updateProject(userId: string, projectId: string, input: ProjectUpdateInput): Promise<WorkspaceProject | null>;
  updateProjectPosition(userId: string, projectId: string, input: ProjectFieldPositionInput): Promise<WorkspaceProject | null>;
  getProjectDetail(userId: string, projectId: string): Promise<WorkspaceProjectDetail | null>;
  addMilestone(userId: string, projectId: string, title: string): Promise<ProjectMilestone | null>;
  setMilestoneStatus(userId: string, projectId: string, milestoneId: string, status: ProjectMilestoneStatus): Promise<ProjectMilestone | null>;
  addArtifact(userId: string, projectId: string, input: { title: string; kind: ProjectArtifactKind; note?: string }): Promise<ProjectArtifact | null>;
  addCollaborator(userId: string, projectId: string, input: { email: string; role: "contributor" | "mentor" }): Promise<ProjectCollaborator | null>;
  addContribution(userId: string, projectId: string, input: { type: ProjectContributionType; description: string; evidenceUrl?: string }): Promise<ProjectContribution | null>;
  addReview(userId: string, projectId: string, input: { proudOf: string; learned?: string; nextFocus?: string }): Promise<ProjectReview | null>;
  saveReflection(userId: string, answer: string): Promise<{ id: string; answer: string; createdAt: string }>;
  getFocus(userId: string, projectId?: string): Promise<ReturnType<typeof getFocus>>;
}

interface ProjectInput {
  title: string;
  purpose: string;
  direction: ProjectDirection;
  nextAction: string;
  seedId?: string;
}

const colors = ["#dfae63", "#cc7b5b", "#9eb488", "#d4a46f", "#d78397", "#9db9b0"];

export function createWorkspaceRepository(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): WorkspaceRepository {
  return config.databaseUrl && config.databaseEnabled ? new PostgreSqlWorkspaceRepository(config) : new MemoryWorkspaceRepository();
}

class MemoryWorkspaceRepository implements WorkspaceRepository {
  public async listNodes(userId: string) { return listWorkspaceNodes(userId); }
  public async getDashboard(userId: string) { return getWorkspaceDashboard(userId); }
  public async getPersonalDashboard(userId: string) { return getPersonalDashboard(userId); }
  public async createProject(userId: string, input: ProjectInput) { return createProject(userId, input); }
  public async updateProject(userId: string, projectId: string, input: ProjectUpdateInput) { return updateProject(userId, projectId, input); }
  public async updateProjectPosition(userId: string, projectId: string, input: ProjectFieldPositionInput) { return updateProjectPosition(userId, projectId, input); }
  public async getProjectDetail(userId: string, projectId: string) { return getProjectDetail(userId, projectId); }
  public async addMilestone(userId: string, projectId: string, title: string) { return addProjectMilestone(userId, projectId, title); }
  public async setMilestoneStatus(userId: string, projectId: string, milestoneId: string, status: ProjectMilestoneStatus) { return setProjectMilestoneStatus(userId, projectId, milestoneId, status); }
  public async addArtifact(userId: string, projectId: string, input: { title: string; kind: ProjectArtifactKind; note?: string }) { return addProjectArtifact(userId, projectId, input); }
  public async addCollaborator(_userId: string, _projectId: string, _input: { email: string; role: "contributor" | "mentor" }) { return null; }
  public async addContribution(userId: string, projectId: string, input: { type: ProjectContributionType; description: string; evidenceUrl?: string }) { return addProjectContribution(userId, projectId, input); }
  public async addReview(userId: string, projectId: string, input: { proudOf: string; learned?: string; nextFocus?: string }) { return addProjectReview(userId, projectId, input); }
  public async saveReflection(userId: string, answer: string) { return saveReflection(userId, answer); }
  public async getFocus(userId: string, projectId?: string) { return getFocus(userId, projectId); }
}

class PostgreSqlWorkspaceRepository implements WorkspaceRepository {
  private readonly database: ReturnType<typeof createDatabase>["db"];

  public constructor(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">) {
    this.database = createDatabase(config).db;
  }

  public async listNodes(userId: string): Promise<WorkspaceNodeRecord[]> {
    const rows = await this.listProjects(userId);
    return rows.map((row) => toProject(row).node);
  }

  public async getDashboard(userId: string): Promise<ReturnType<typeof getWorkspaceDashboard>> {
    const [projectRows, reflectionRows] = await Promise.all([
      this.listProjects(userId),
      this.database.select({ id: reflections.id }).from(reflections).where(eq(reflections.userId, userId))
    ]);
    return {
      dailyFocus: null,
      projects: projectRows.map((row) => toProject(row).project),
      knowledge: [],
      research: [],
      assets: [],
      worlds: [],
      reflectionCount: reflectionRows.length
    };
  }

  public async getPersonalDashboard(userId: string): Promise<ReturnType<typeof getPersonalDashboard>> {
    const projectRows = await this.listProjects(userId);
    const projectIds = projectRows.map((project) => project.id);
    const [milestoneRows, artifactRows, reflectionRows, activityRows] = await Promise.all([
      projectIds.length > 0 ? this.database.select({ id: projectMilestones.id, status: projectMilestones.status }).from(projectMilestones).where(inArray(projectMilestones.projectId, projectIds)) : Promise.resolve([]),
      projectIds.length > 0 ? this.database.select({ id: projectArtifacts.id }).from(projectArtifacts).where(inArray(projectArtifacts.projectId, projectIds)) : Promise.resolve([]),
      this.database.select({ id: reflections.id }).from(reflections).where(eq(reflections.userId, userId)),
      projectIds.length > 0 ? this.database.select().from(projectActivity).where(inArray(projectActivity.projectId, projectIds)) : Promise.resolve([])
    ]);
    const mappedProjects = projectRows.map((row) => toProject(row).project);
    const recentActivity = activityRows
      .map((activity) => toActivity(activity))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 8);
    const activeProjects = mappedProjects.filter((project) => project.status !== "completed");

    return {
      summary: {
        projectCount: mappedProjects.length,
        activeProjectCount: activeProjects.length,
        completedMilestoneCount: milestoneRows.filter((milestone) => milestone.status === "completed").length,
        milestoneCount: milestoneRows.length,
        evidenceCount: artifactRows.length,
        reflectionCount: reflectionRows.length
      },
      projects: mappedProjects,
      openActions: activeProjects.filter((project) => project.nextAction.trim().length > 0).map((project) => ({ projectId: project.id, projectTitle: project.title, action: project.nextAction, progress: project.progress })),
      recentActivity
    };
  }

  public async createProject(userId: string, input: ProjectInput): Promise<WorkspaceProject> {
    const current = await this.listProjects(userId);
    const index = current.length;
    const now = new Date();
    const angle = index * 2.399963229728653;
    const radius = 120 + Math.floor(index / 4) * 110;
    const [row] = await this.database.insert(projects).values({
      ownerId: userId,
      seedId: input.seedId ?? null,
      title: input.title,
      purpose: input.purpose,
      direction: input.direction,
      nextAction: input.nextAction,
      status: "planning",
      progress: 0,
      color: colors[index % colors.length]!,
      fieldX: Math.round(Math.cos(angle) * radius),
      fieldY: Math.round(Math.sin(angle) * radius),
      fieldWidth: 270,
      fieldHeight: 168,
      createdAt: now,
      updatedAt: now
    }).returning();
    if (!row) throw new Error("TOP could not create this project.");
    await this.recordActivity(row.id, "project-started", "Project started", "This commitment now has a place in your field.", now);
    return toProject(row).project;
  }

  public async updateProject(userId: string, projectId: string, input: ProjectUpdateInput): Promise<WorkspaceProject | null> {
    const now = new Date();
    const [row] = await this.database.update(projects).set({
      ...(input.nextAction !== undefined ? { nextAction: input.nextAction } : {}),
      ...(input.status !== undefined ? { status: input.status } : input.nextAction !== undefined ? { status: "active" } : {}),
      updatedAt: now
    }).where(and(eq(projects.id, projectId), eq(projects.ownerId, userId))).returning();
    if (!row) return null;
    if (input.nextAction !== undefined) {
      await this.recordActivity(projectId, "next-action-updated", "Next move protected", input.nextAction, now);
    }
    if (input.status !== undefined) {
      await this.recordActivity(projectId, "project-state-updated", projectStateActivityTitle(input.status), null, now);
    }
    return toProject(row).project;
  }

  public async updateProjectPosition(userId: string, projectId: string, input: ProjectFieldPositionInput): Promise<WorkspaceProject | null> {
    const [row] = await this.database.update(projects).set({ fieldX: input.x, fieldY: input.y, updatedAt: new Date() }).where(and(eq(projects.id, projectId), eq(projects.ownerId, userId))).returning();
    return row ? toProject(row).project : null;
  }

  public async getProjectDetail(userId: string, projectId: string): Promise<WorkspaceProjectDetail | null> {
    const project = await this.findProject(userId, projectId);
    if (!project) return null;
    const access = await this.getProjectAccess(userId, project);
    if (!access) return null;
    const [milestoneRows, artifactRows, reviewRows, collaborators, contributionRows, activityRows] = await Promise.all([
      this.database.select().from(projectMilestones).where(eq(projectMilestones.projectId, projectId)),
      this.listArtifacts(projectId),
      this.database.select().from(reflections).where(eq(reflections.projectId, projectId)),
      this.listCollaborators(project),
      this.listContributions(projectId),
      this.database.select().from(projectActivity).where(eq(projectActivity.projectId, projectId))
    ]);
    return {
      project: toProject(project).project,
      milestones: milestoneRows.map(toMilestone),
      artifacts: artifactRows,
      reviews: reviewRows.map(toReview).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      collaborators,
      contributions: contributionRows,
      access,
      activity: activityRows.map(toActivity).sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    };
  }

  public async addCollaborator(userId: string, projectId: string, input: { email: string; role: "contributor" | "mentor" }): Promise<ProjectCollaborator | null> {
    const project = await this.findOwnedProject(userId, projectId);
    if (!project) return null;

    const email = input.email.trim().toLowerCase();
    const [person] = await this.database
      .select({ userId: users.id, displayName: profiles.displayName })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.email, email));
    if (!person) return null;

    const displayName = person.displayName ?? email.split("@")[0] ?? "TOP member";
    if (person.userId === project.ownerId) {
      return { userId: person.userId, displayName, role: "owner", joinedAt: iso(project.createdAt) };
    }

    const now = new Date();
    await this.database.insert(projectMembers).values({ projectId, userId: person.userId, role: input.role, joinedAt: now }).onConflictDoUpdate({
      target: [projectMembers.projectId, projectMembers.userId],
      set: { role: input.role }
    });
    await this.recordActivity(projectId, "circle-updated", "Project circle updated", `${displayName} is a ${input.role}.`, now);
    return { userId: person.userId, displayName, role: input.role, joinedAt: iso(now) };
  }

  public async addContribution(userId: string, projectId: string, input: { type: ProjectContributionType; description: string; evidenceUrl?: string }): Promise<ProjectContribution | null> {
    const project = await this.findProject(userId, projectId);
    if (!project) return null;
    const access = await this.getProjectAccess(userId, project);
    if (!access) return null;

    const now = new Date();
    const [row] = await this.database.insert(contributions).values({
      projectId,
      contributorId: userId,
      type: input.type,
      description: input.description,
      evidenceUrl: input.evidenceUrl || null,
      createdAt: now
    }).returning();
    if (!row) throw new Error("TOP could not keep this contribution.");

    const [person] = await this.database.select({ displayName: profiles.displayName, email: users.email }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, userId));
    const contributorName = person?.displayName ?? person?.email.split("@")[0] ?? "TOP member";
    await this.database.update(projects).set({ updatedAt: now }).where(eq(projects.id, projectId));
    await this.recordActivity(projectId, "contribution-recorded", `${contributionTypeLabel(input.type)} contribution added`, input.description, now);
    return { id: row.id, projectId: row.projectId, contributorId: row.contributorId, contributorName, type: row.type as ProjectContributionType, description: row.description, evidenceUrl: row.evidenceUrl, createdAt: iso(row.createdAt) };
  }

  public async addMilestone(userId: string, projectId: string, title: string): Promise<ProjectMilestone | null> {
    const project = await this.findOwnedProject(userId, projectId);
    if (!project) return null;
    const now = new Date();
    const [row] = await this.database.insert(projectMilestones).values({ projectId, title, status: "planned", createdAt: now }).returning();
    if (!row) throw new Error("TOP could not add this milestone.");
    await this.touchProject(projectId, now);
    await this.recordActivity(projectId, "milestone-added", "Milestone added", title, now);
    return toMilestone(row);
  }

  public async setMilestoneStatus(userId: string, projectId: string, milestoneId: string, status: ProjectMilestoneStatus): Promise<ProjectMilestone | null> {
    const project = await this.findOwnedProject(userId, projectId);
    if (!project) return null;
    const now = new Date();
    const [row] = await this.database.update(projectMilestones).set({ status, completedAt: status === "completed" ? now : null }).where(and(eq(projectMilestones.id, milestoneId), eq(projectMilestones.projectId, projectId))).returning();
    if (!row) return null;
    await this.touchProject(projectId, now);
    await this.recordActivity(projectId, status === "completed" ? "milestone-completed" : "milestone-reopened", status === "completed" ? "Milestone completed" : "Milestone reopened", row.title, now);
    return toMilestone(row);
  }

  public async addArtifact(userId: string, projectId: string, input: { title: string; kind: ProjectArtifactKind; note?: string }): Promise<ProjectArtifact | null> {
    const project = await this.findProject(userId, projectId);
    if (!project) return null;
    const now = new Date();
    const [row] = await this.database.insert(projectArtifacts).values({ projectId, contributorId: userId, title: input.title, kind: input.kind, note: input.note || null, createdAt: now }).returning();
    if (!row) throw new Error("TOP could not record this evidence.");
    await this.touchProject(projectId, now);
    await this.recordActivity(projectId, "artifact-recorded", "Evidence recorded", input.title, now);
    return toArtifact(row);
  }

  public async addReview(userId: string, projectId: string, input: { proudOf: string; learned?: string; nextFocus?: string }): Promise<ProjectReview | null> {
    const project = await this.findProject(userId, projectId);
    if (!project) return null;
    const now = new Date();
    const [row] = await this.database.insert(reflections).values({
      userId,
      projectId,
      periodStart: now,
      periodEnd: now,
      proudOf: input.proudOf,
      learned: input.learned || null,
      nextFocus: input.nextFocus || null,
      createdAt: now
    }).returning();
    if (!row) throw new Error("TOP could not keep this project review.");
    await this.database.update(projects).set({ updatedAt: now }).where(eq(projects.id, projectId));
    await this.recordActivity(projectId, "review-recorded", "Project review kept", input.proudOf, now);
    return toReview(row);
  }

  public async saveReflection(userId: string, answer: string): Promise<{ id: string; answer: string; createdAt: string }> {
    const now = new Date();
    const [row] = await this.database.insert(reflections).values({ userId, periodStart: now, periodEnd: now, proudOf: answer, createdAt: now }).returning();
    if (!row) throw new Error("TOP could not save this reflection.");
    return { id: row.id, answer, createdAt: iso(row.createdAt) };
  }

  public async getFocus(userId: string, projectId?: string): Promise<ReturnType<typeof getFocus>> {
    const rows = await this.listProjects(userId);
    const mapped = rows.map((row) => toProject(row).project);
    const project = projectId ? mapped.find((candidate) => candidate.id === projectId) : mapped.find((candidate) => candidate.status !== "completed") ?? mapped[0];
    if (!project) return null;
    return { projectId: project.id, title: project.title, action: project.nextAction || "Name one small next action that you can complete this week.", reason: project.nextAction ? "This is the action you chose. Protect enough time to finish it before adding more to the field." : "A project becomes real when its next action is specific enough to do." };
  }

  private async listProjects(userId: string) {
    const rows = await this.database
      .select({ project: projects })
      .from(projects)
      .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId)));
    return rows.map(({ project }) => project);
  }

  private async findProject(userId: string, projectId: string) {
    const [ownedProject] = await this.database.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)));
    if (ownedProject) return ownedProject;
    const [membership] = await this.database.select({ projectId: projectMembers.projectId }).from(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
    if (!membership) return null;
    const [project] = await this.database.select().from(projects).where(eq(projects.id, projectId));
    return project ?? null;
  }

  private async findOwnedProject(userId: string, projectId: string) {
    const [project] = await this.database.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)));
    return project ?? null;
  }

  private async getProjectAccess(userId: string, project: typeof projects.$inferSelect) {
    if (project.ownerId === userId) return { role: "owner" as const, canManage: true };
    const [membership] = await this.database.select({ role: projectMembers.role }).from(projectMembers).where(and(eq(projectMembers.projectId, project.id), eq(projectMembers.userId, userId)));
    if (!membership) return null;
    return { role: membership.role === "mentor" ? "mentor" as const : "contributor" as const, canManage: false };
  }

  private async listCollaborators(project: typeof projects.$inferSelect): Promise<ProjectCollaborator[]> {
    const [owner] = await this.database
      .select({ userId: users.id, displayName: profiles.displayName })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, project.ownerId));
    const memberRows = await this.database
      .select({ userId: users.id, displayName: profiles.displayName, role: projectMembers.role, joinedAt: projectMembers.joinedAt })
      .from(projectMembers)
      .innerJoin(users, eq(users.id, projectMembers.userId))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(projectMembers.projectId, project.id));
    const ownerName = owner?.displayName ?? "Project owner";
    return [
      { userId: project.ownerId, displayName: ownerName, role: "owner", joinedAt: iso(project.createdAt) },
      ...memberRows.map((member) => ({ userId: member.userId, displayName: member.displayName ?? "TOP member", role: member.role === "mentor" ? "mentor" as const : "contributor" as const, joinedAt: iso(member.joinedAt) }))
    ];
  }

  private async listContributions(projectId: string): Promise<ProjectContribution[]> {
    const rows = await this.database
      .select({ contribution: contributions, displayName: profiles.displayName, email: users.email })
      .from(contributions)
      .innerJoin(users, eq(users.id, contributions.contributorId))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(contributions.projectId, projectId));
    return rows
      .map(({ contribution, displayName, email }) => ({ id: contribution.id, projectId: contribution.projectId, contributorId: contribution.contributorId, contributorName: displayName ?? email.split("@")[0] ?? "TOP member", type: contribution.type as ProjectContributionType, description: contribution.description, evidenceUrl: contribution.evidenceUrl, createdAt: iso(contribution.createdAt) }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  private async listArtifacts(projectId: string): Promise<ProjectArtifact[]> {
    const rows = await this.database
      .select({ artifact: projectArtifacts, displayName: profiles.displayName, email: users.email })
      .from(projectArtifacts)
      .leftJoin(users, eq(users.id, projectArtifacts.contributorId))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(projectArtifacts.projectId, projectId));
    return rows
      .map(({ artifact, displayName, email }) => ({ ...toArtifact(artifact), contributorName: displayName ?? email?.split("@")[0] ?? null }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  private async touchProject(projectId: string, updatedAt: Date): Promise<void> {
    const milestones = await this.database.select({ status: projectMilestones.status }).from(projectMilestones).where(eq(projectMilestones.projectId, projectId));
    const completed = milestones.filter((milestone) => milestone.status === "completed").length;
    const progress = milestones.length === 0 ? 0 : Math.round((completed / milestones.length) * 100);
    await this.database.update(projects).set({ status: "active", progress, updatedAt }).where(eq(projects.id, projectId));
  }

  private async recordActivity(projectId: string, type: ProjectActivityType, title: string, detail: string | null, createdAt: Date): Promise<void> {
    await this.database.insert(projectActivity).values({ projectId, type, title, detail, createdAt });
  }
}

function toProject(row: typeof projects.$inferSelect): { project: WorkspaceProject; node: WorkspaceNodeRecord } {
  const status = row.status === "archived" ? "completed" : row.status;
  const project: WorkspaceProject = {
    id: row.id,
    title: row.title,
    description: row.purpose,
    purpose: row.purpose,
    direction: row.direction as ProjectDirection,
    nextAction: row.nextAction,
    kind: "project",
    status,
    progress: row.progress,
    color: row.color,
    x: row.fieldX,
    y: row.fieldY,
    width: row.fieldWidth,
    height: row.fieldHeight,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt)
  };
  const { direction: _direction, purpose: _purpose, nextAction: _nextAction, createdAt: _createdAt, updatedAt: _updatedAt, ...node } = project;
  return { project, node };
}

function toMilestone(row: typeof projectMilestones.$inferSelect): ProjectMilestone {
  return { id: row.id, projectId: row.projectId, title: row.title, status: row.status as ProjectMilestoneStatus, createdAt: iso(row.createdAt), completedAt: row.completedAt ? iso(row.completedAt) : null };
}

function toArtifact(row: typeof projectArtifacts.$inferSelect): ProjectArtifact {
  return { id: row.id, projectId: row.projectId, contributorId: row.contributorId, contributorName: null, title: row.title, kind: row.kind as ProjectArtifactKind, note: row.note, createdAt: iso(row.createdAt) };
}

function toReview(row: typeof reflections.$inferSelect): ProjectReview {
  if (!row.projectId || !row.proudOf) throw new Error("TOP encountered an incomplete project review.");
  return { id: row.id, projectId: row.projectId, proudOf: row.proudOf, learned: row.learned, nextFocus: row.nextFocus, createdAt: iso(row.createdAt) };
}

function toActivity(row: typeof projectActivity.$inferSelect): ProjectActivity {
  return { id: row.id, projectId: row.projectId, type: row.type as ProjectActivityType, title: row.title, detail: row.detail, createdAt: iso(row.createdAt) };
}

function projectStateActivityTitle(status: WorkspaceProject["status"]): string {
  return { planning: "Project returned to beginning", active: "Project returned to practice", paused: "Project paused", completed: "Project completed" }[status];
}

function contributionTypeLabel(type: ProjectContributionType): string {
  return { idea: "Idea", research: "Research", design: "Design", code: "Code", funding: "Funding", mentorship: "Mentorship", operations: "Operations", other: "Work" }[type];
}

function iso(value: Date): string { return value.toISOString(); }
