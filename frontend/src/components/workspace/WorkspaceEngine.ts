import {
  createProjectArtifact,
  createProjectContribution,
  createProjectMessage,
  createProjectMilestone,
  createProjectReview,
  createWorkspaceProject,
  getWorkspaceProject,
  getWorkspaceDashboard,
  getWorkspaceOverview,
  inviteProjectCollaborator,
  removeProjectCollaborator,
  updateProjectCollaboratorRole,
  updateProjectMilestone,
  updateWorkspaceProject,
  updateWorkspaceProjectPosition,
  type ProjectArtifactKind,
  type ProjectContributionType,
  type ProjectDirection,
  type ProjectMessageKind,
  type WorkspaceProjectDetail,
  type WorkspaceProject
} from "../../lib/api";
import { WorkspaceState } from "./WorkspaceState";
import { NodeDragging } from "./nodes/NodeDragging";
import type { WorkspaceNode } from "./nodes/Node";
import { NodeSelection } from "./nodes/NodeSelection";
import type { WorkspaceSection } from "./WorkspaceState";

class WorkspaceEngine {
  private selection = new NodeSelection();
  private dragging = new NodeDragging();
  private suppressNextProjectOpen = false;

  public select(id: string): void {
    this.selection.select(WorkspaceState.nodes.nodes, id);
    WorkspaceState.selectedNodeId = id;
    this.save();
  }

  public clearSelection(): void {
    for (const node of WorkspaceState.nodes.nodes) node.selected = false;
    WorkspaceState.selectedNodeId = null;
  }

  public async openProject(id: string): Promise<void> {
    WorkspaceState.activeProjectId = id;
    WorkspaceState.activeSection = "Project";
    this.clearSelection();
    this.triggerMotion("action");
    this.scrollToSurface();
    await this.loadProjectRoom(id);
  }

  public openSection(section: WorkspaceSection, returnTo?: WorkspaceSection): void {
    WorkspaceState.activeSection = section;
    if (section !== "Project") WorkspaceState.activeProjectId = null;
    WorkspaceState.returnSection = returnTo ?? null;
    this.triggerMotion("navigation");
    this.scrollToSurface();
  }

  public beginWithPack(draft: {
    title: string;
    purpose: string;
    direction: ProjectDirection;
    nextAction: string;
  }): void {
    WorkspaceState.projectDraft = { ...draft };
    WorkspaceState.projectComposerOpen = true;
    this.triggerMotion("action");
  }

  public triggerMotion(kind: "arrival" | "navigation" | "action"): void {
    WorkspaceState.motionKind = kind;
    WorkspaceState.motionToken += 1;
  }

  public dragStart(node: WorkspaceNode, x: number, y: number): void {
    this.dragging.begin(node, x, y);
  }

  public drag(x: number, y: number): void {
    this.dragging.move(x, y);
  }

  public dragEnd(): void {
    const result = this.dragging.end();
    if (!result.wasActive) return;

    this.suppressNextProjectOpen = result.didMove;
    if (result.didMove) {
      window.setTimeout(() => { this.suppressNextProjectOpen = false; }, 0);
      if (result.node?.kind === "project") void this.persistProjectPosition(result.node);
    }
    this.save();
  }

  public canOpenDraggedProject(): boolean {
    if (!this.suppressNextProjectOpen) return true;
    this.suppressNextProjectOpen = false;
    return false;
  }

  public async createProject(input: {
    title: string;
    purpose: string;
    direction: ProjectDirection;
    nextAction: string;
  }): Promise<void> {
    const { project } = await createWorkspaceProject(input);
    const node = this.toNode(project);

    WorkspaceState.nodes.nodes = [...WorkspaceState.nodes.nodes.filter((item) => item.id !== node.id), node];
    if (WorkspaceState.dashboard) WorkspaceState.dashboard.projects.push(project);

    WorkspaceState.projectComposerOpen = false;
    WorkspaceState.projectDraft = null;
    WorkspaceState.activeProjectId = project.id;
    WorkspaceState.activeSection = "Project";
    void this.loadProjectRoom(project.id);
    this.save();
    this.notify("Your project has a place in the field.");
    this.triggerMotion("action");
  }

  public async saveProjectNextAction(projectId: string, nextAction: string): Promise<void> {
    const { project } = await updateWorkspaceProject(projectId, { nextAction });
    this.applyProject(project);
    this.notify("Next move saved. Keep the work small enough to begin.");
    await this.loadProjectRoom(projectId, false);
  }

  public async setProjectStatus(projectId: string, status: WorkspaceProject["status"]): Promise<void> {
    const { project } = await updateWorkspaceProject(projectId, { status });
    this.applyProject(project);
    this.notify({ planning: "Project returned to a beginning.", active: "Project is back in practice.", paused: "Project paused. Its place in your field is kept.", completed: "Project marked complete. Its trail stays with you." }[status]);
    await this.loadProjectRoom(projectId, false);
  }

  public async addProjectMilestone(projectId: string, title: string): Promise<void> {
    await createProjectMilestone(projectId, { title });
    await this.loadProjectRoom(projectId, false);
    this.notify("Milestone added. Give it a real moment in your life.");
  }

  public async setProjectMilestone(projectId: string, milestoneId: string, completed: boolean): Promise<void> {
    await updateProjectMilestone(projectId, milestoneId, { status: completed ? "completed" : "planned" });
    await this.loadProjectRoom(projectId, false);
    this.notify(completed ? "Milestone marked complete. The work has evidence now." : "Milestone reopened. Keep moving with honesty.");
  }

  public async recordProjectArtifact(projectId: string, input: { title: string; kind: ProjectArtifactKind; note?: string }) {
    const { artifact } = await createProjectArtifact(projectId, input);
    await this.loadProjectRoom(projectId, false);
    this.notify("Evidence recorded in your project trail.");
    return artifact;
  }

  public async recordProjectReview(projectId: string, input: { proudOf: string; learned?: string; nextFocus?: string }): Promise<string> {
    const { message } = await createProjectReview(projectId, input);
    await this.loadProjectRoom(projectId, false);
    this.notify("Project review kept. Let it shape the next return.");
    return message;
  }

  public async inviteCollaborator(projectId: string, input: { email: string; role: "contributor" | "mentor" }): Promise<string> {
    const { message } = await inviteProjectCollaborator(projectId, input);
    await this.loadProjectRoom(projectId, false);
    this.notify("Private invitation sent.");
    return message;
  }

  public async updateCollaboratorRole(projectId: string, memberId: string, role: "contributor" | "mentor"): Promise<void> {
    await updateProjectCollaboratorRole(projectId, memberId, { role });
    await this.loadProjectRoom(projectId, false);
    this.notify("Project role updated.");
  }

  public async removeCollaborator(projectId: string, memberId: string): Promise<void> {
    await removeProjectCollaborator(projectId, memberId);
    await this.loadProjectRoom(projectId, false);
    this.notify("Member removed from this project circle.");
  }

  public async sendProjectMessage(projectId: string, body: string, kind: ProjectMessageKind = "update"): Promise<void> {
    await createProjectMessage(projectId, { body, kind });
    await this.loadProjectRoom(projectId, false);
    this.notify("Message sent to the project circle.");
  }

  public async refreshProjectDetail(projectId: string): Promise<void> {
    await this.loadProjectRoom(projectId, false);
  }

  public async recordProjectContribution(projectId: string, input: { type: ProjectContributionType; description: string; evidenceUrl?: string }): Promise<string> {
    const { message } = await createProjectContribution(projectId, input);
    await this.loadProjectRoom(projectId, false);
    this.notify("Contribution recorded in the project trail.");
    return message;
  }

  public save(): boolean {
    try {
      localStorage.setItem("top-workspace", JSON.stringify(WorkspaceState.nodes.nodes));
      return true;
    } catch {
      this.notify("Your device could not hold this change locally.");
      return false;
    }
  }

  public notify(message: string): void {
    WorkspaceState.toast = message;
    window.setTimeout(() => {
      if (WorkspaceState.toast === message) WorkspaceState.toast = "";
    }, 3_400);
  }

  public async load(): Promise<void> {
    WorkspaceState.syncStatus = "loading";
    let localWorldName: string | undefined;
    try {
      localWorldName = localStorage.getItem("top-world-name")?.trim() || undefined;
    } catch {
      this.notify("TOP cannot read local workspace settings in this browser.");
    }
    if (localWorldName) WorkspaceState.worldName = localWorldName;

    const savedNodes = this.readSavedNodes();

    try {
      const [overview, dashboard] = await Promise.all([getWorkspaceOverview(), getWorkspaceDashboard()]);

      WorkspaceState.worldName = localWorldName || overview.world.name;
      WorkspaceState.lastSyncedAt = overview.updatedAt;
      WorkspaceState.syncStatus = "synced";
      WorkspaceState.dashboard = dashboard;
      WorkspaceState.dashboardStatus = "ready";
      WorkspaceState.projectDetails = {};
      WorkspaceState.projectRoomStatus = "idle";
      WorkspaceState.nodes.nodes = overview.nodes.map((node) => ({ ...node, selected: false }));

      if (WorkspaceState.activeProjectId && !dashboard.projects.some((project) => project.id === WorkspaceState.activeProjectId)) {
        WorkspaceState.activeProjectId = null;
        WorkspaceState.activeSection = "Overview";
      }

      this.save();
    } catch {
      WorkspaceState.syncStatus = "offline";
      WorkspaceState.dashboardStatus = "offline";
      WorkspaceState.projectRoomStatus = "error";
      WorkspaceState.nodes.nodes = savedNodes;
    }
  }

  private async loadProjectRoom(projectId: string, announceError = true): Promise<void> {
    WorkspaceState.projectRoomStatus = "loading";
    try {
      const detail = await getWorkspaceProject(projectId);
      this.applyProjectDetail(detail);
      WorkspaceState.projectRoomStatus = "ready";
    } catch (error) {
      WorkspaceState.projectRoomStatus = "error";
      if (announceError) this.notify(error instanceof Error ? error.message : "TOP could not open this project record.");
    }
  }

  private applyProjectDetail(detail: WorkspaceProjectDetail): void {
    const { project } = detail;
    WorkspaceState.projectDetails[project.id] = detail;

    this.applyProject(project, false);
  }

  private applyProject(project: WorkspaceProject, save = true): void {
    const projectIndex = WorkspaceState.dashboard?.projects.findIndex((item) => item.id === project.id) ?? -1;
    if (WorkspaceState.dashboard && projectIndex >= 0) WorkspaceState.dashboard.projects[projectIndex] = project;

    const nodeIndex = WorkspaceState.nodes.nodes.findIndex((item) => item.id === project.id);
    if (nodeIndex >= 0) WorkspaceState.nodes.nodes[nodeIndex] = this.toNode(project);
    const detail = WorkspaceState.projectDetails[project.id];
    if (detail) WorkspaceState.projectDetails[project.id] = { ...detail, project };
    if (save) this.save();
  }

  private async persistProjectPosition(node: WorkspaceNode): Promise<void> {
    try {
      const { project } = await updateWorkspaceProjectPosition(node.id, { x: Math.round(node.x), y: Math.round(node.y) });
      this.applyProject(project);
      this.notify("Project position saved to your field.");
    } catch {
      this.notify("This position is held on this device until TOP reconnects.");
    }
  }

  private readSavedNodes(): WorkspaceNode[] {
    try {
      const saved = localStorage.getItem("top-workspace");
      if (!saved) return [];
      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      const nodes = parsed
        .filter((node): node is Partial<WorkspaceNode> => typeof node === "object" && node !== null)
        .filter((node) => !this.isLegacyDemoNode(node))
        .map((node) => this.normalizeNode(node));

      if (nodes.length !== parsed.length) localStorage.setItem("top-workspace", JSON.stringify(nodes));
      return nodes;
    } catch {
      try { localStorage.removeItem("top-workspace"); } catch { /* Storage is unavailable. */ }
      return [];
    }
  }

  private normalizeNode(node: Partial<WorkspaceNode>): WorkspaceNode {
    return {
      id: node.id ?? crypto.randomUUID(),
      title: node.title ?? "Untitled project",
      description: node.description ?? "A project waiting for a clear next action.",
      kind: node.kind === "project" ? "project" : "seed",
      status: node.status === "active" || node.status === "paused" || node.status === "completed" ? node.status : "planning",
      progress: typeof node.progress === "number" ? node.progress : 0,
      color: node.color ?? "#dfae63",
      x: typeof node.x === "number" ? node.x : 0,
      y: typeof node.y === "number" ? node.y : 0,
      width: typeof node.width === "number" ? node.width : 270,
      height: typeof node.height === "number" ? node.height : 168,
      selected: false
    };
  }

  private isLegacyDemoNode(node: Partial<WorkspaceNode>): boolean {
    return ["TOP", "rifKANDO", "BlueRif", "Deutschio"].includes(node.title ?? "");
  }

  private toNode(project: WorkspaceProject): WorkspaceNode {
    return {
      id: project.id,
      title: project.title,
      description: project.purpose,
      kind: project.kind,
      status: project.status,
      progress: project.progress,
      color: project.color,
      x: project.x,
      y: project.y,
      width: project.width,
      height: project.height,
      selected: false
    };
  }

  private scrollToSurface(): void {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }
}

export const workspaceEngine = new WorkspaceEngine();
