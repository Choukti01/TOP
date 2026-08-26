// Local development uses the API on this computer. A deployed TOP site must
// receive an explicit HTTPS API URL at build time; a visitor's localhost is
// never a public backend.
const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? (import.meta.env.DEV ? "http://localhost:3000" : "");

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
  fieldName: string | null;
  avatarDataUrl: string | null;
  createdAt: string;
}

export type PublicPostKind = "idea" | "signal" | "offer" | "question" | "negotiation" | "request" | "resource" | "milestone" | "event" | "collaboration";
export type PublicReaction = "spark" | "build" | "help" | "question" | "respect";
export type SignalOfferKind = "help" | "skill" | "collaboration";
export type SignalOfferStatus = "pending" | "accepted" | "declined";

export interface PublicPersonSummary {
  id: string;
  displayName: string;
  fieldName: string | null;
  location: string | null;
  avatarDataUrl: string | null;
  memberSince: string;
}

export interface PublicComment {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
  author: PublicPersonSummary;
}

export interface PublicReactionPerson {
  reaction: PublicReaction;
  person: PublicPersonSummary;
}

export interface PublicPost {
  id: string;
  kind: PublicPostKind;
  title: string;
  body: string;
  createdAt: string;
  author: PublicPersonSummary;
  reactions: Record<PublicReaction, number>;
  reactionPeople: PublicReactionPerson[];
  viewerReaction: PublicReaction | null;
  comments: PublicComment[];
  commentCount: number;
  bridge: { seedId: string | null; projectId: string | null; circleOpen: boolean; offerStatus: SignalOfferStatus | null; offerKind: SignalOfferKind | null; pendingOfferCount: number; };
}

export interface PublicProfile extends PublicPersonSummary {
  biography: string | null;
  stats: { projectCount: number; completedMilestoneCount: number; evidenceCount: number; connectionCount: number };
  connectionStatus: "self" | "none" | "pending-sent" | "pending-received" | "connected";
  sharedPosts: PublicPost[];
}

export interface PublicSearchPerson extends PublicPersonSummary {
  connectionStatus: PublicProfile["connectionStatus"];
}

export interface PublicSearchResults {
  people: PublicSearchPerson[];
  posts: PublicPost[];
}

export interface ConnectionRequest {
  id: string;
  createdAt: string;
  sender: PublicPersonSummary;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  sender: PublicPersonSummary;
}

export interface DirectConversation {
  person: PublicPersonSummary;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface SignalOffer {
  id: string;
  postId: string;
  postTitle: string;
  projectId: string | null;
  kind: SignalOfferKind;
  note: string;
  createdAt: string;
  sender: PublicPersonSummary;
}

export type ProjectDirection = "personal" | "creative" | "learning" | "community" | "venture" | "other";
export type ProjectStatus = "planning" | "active" | "paused" | "completed";
export type SeedStatus = "draft" | "planted" | "growing" | "archived";
export type ProjectMilestoneStatus = "planned" | "completed";
export type ProjectArtifactKind = "atelier" | "canvas" | "blueprint" | "note" | "link" | "other";
export type ProjectMemberRole = "owner" | "contributor" | "mentor";
export type ProjectContributionType = "idea" | "research" | "design" | "code" | "funding" | "mentorship" | "operations" | "other";
export type ProjectActivityType = "project-started" | "project-state-updated" | "next-action-updated" | "milestone-added" | "milestone-completed" | "milestone-reopened" | "artifact-recorded" | "circle-updated" | "circle-message-sent" | "invitation-sent" | "invitation-accepted" | "member-role-updated" | "member-removed" | "contribution-recorded" | "review-recorded";

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
  contributorId: string | null;
  contributorName: string | null;
  title: string;
  kind: ProjectArtifactKind;
  note: string | null;
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
  role: "contributor" | "mentor";
  createdAt: string;
}

export interface CollaborationInvitation {
  id: string;
  projectId: string;
  projectTitle: string;
  inviterName: string;
  role: "contributor" | "mentor";
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
  reviews: ProjectReview[];
  collaborators: ProjectCollaborator[];
  contributions: ProjectContribution[];
  messages: ProjectMessage[];
  access: ProjectAccess;
  pendingInvitations: ProjectPendingInvitation[];
  activity: ProjectActivity[];
}

export interface TopSeed {
  id: string;
  sourcePublicPostId: string | null;
  title: string;
  problem: string;
  desiredOutcome: string;
  status: SeedStatus;
  createdAt: string;
  updatedAt: string;
  entryCount: number;
  projectId: string | null;
}

export interface SeedEntry {
  id: string;
  seedId: string;
  body: string;
  createdAt: string;
}

export interface SeedDetail extends TopSeed {
  entries: SeedEntry[];
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
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("TOP accounts are not live yet. The public experience is online, but its secure workspace service is still being connected.");
  }

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

export function updateTopProfile(input: { displayName?: string; biography?: string | null; location?: string | null; fieldName?: string | null; avatarDataUrl?: string | null }): Promise<{ user: AuthUser }> {
  return request<{ user: AuthUser }>("/api/v1/auth/profile", { method: "PATCH", body: input });
}

export function getApiHealth(): Promise<ApiHealth> {
  return request<ApiHealth>("/health");
}

export function getTopFeed(): Promise<{ posts: PublicPost[] }> {
  return request<{ posts: PublicPost[] }>("/api/v1/top/feed");
}

export function searchTop(query: string): Promise<PublicSearchResults> {
  return request<PublicSearchResults>(`/api/v1/top/search?q=${encodeURIComponent(query)}`);
}

export function createPublicPost(input: { kind: PublicPostKind; title: string; body: string }): Promise<{ post: PublicPost }> {
  return request<{ post: PublicPost }>("/api/v1/top/posts", { method: "POST", body: input });
}

export function getPublicPost(postId: string): Promise<{ post: PublicPost }> {
  return request<{ post: PublicPost }>(`/api/v1/top/posts/${encodeURIComponent(postId)}`);
}

export function reactToPublicPost(postId: string, reaction: PublicReaction): Promise<{ post: PublicPost }> {
  return request<{ post: PublicPost }>(`/api/v1/top/posts/${encodeURIComponent(postId)}/reactions`, { method: "POST", body: { reaction } });
}

export function addPublicComment(postId: string, body: string): Promise<{ comment: PublicComment }> {
  return request<{ comment: PublicComment }>(`/api/v1/top/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", body: { body } });
}

export function bringSignalIntoField(postId: string): Promise<{ seedId: string; post: PublicPost }> {
  return request<{ seedId: string; post: PublicPost }>(`/api/v1/top/posts/${encodeURIComponent(postId)}/seed`, { method: "POST" });
}

export function startSignalProjectCircle(postId: string, input: { direction: ProjectDirection; nextAction: string; firstMilestone: string }): Promise<{ projectId: string; post: PublicPost }> {
  return request<{ projectId: string; post: PublicPost }>(`/api/v1/top/posts/${encodeURIComponent(postId)}/project-circle`, { method: "POST", body: input });
}

export function offerToSignal(postId: string, input: { kind: SignalOfferKind; note: string }): Promise<{ post: PublicPost }> {
  return request<{ post: PublicPost }>(`/api/v1/top/posts/${encodeURIComponent(postId)}/offers`, { method: "POST", body: input });
}

export function getIncomingSignalOffers(): Promise<{ offers: SignalOffer[] }> {
  return request<{ offers: SignalOffer[] }>("/api/v1/top/signal-offers");
}

export function respondToSignalOffer(offerId: string, input: { response: "accepted" | "declined"; role?: "contributor" | "mentor" }): Promise<{ message: string; projectId: string | null }> {
  return request<{ message: string; projectId: string | null }>(`/api/v1/top/signal-offers/${encodeURIComponent(offerId)}/respond`, { method: "POST", body: input });
}

export function getPublicProfile(personId: string): Promise<{ profile: PublicProfile }> {
  return request<{ profile: PublicProfile }>(`/api/v1/top/people/${encodeURIComponent(personId)}`);
}

export function sendConnectionRequest(personId: string): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/v1/top/people/${encodeURIComponent(personId)}/connect`, { method: "POST" });
}

export function getIncomingConnectionRequests(): Promise<{ requests: ConnectionRequest[] }> {
  return request<{ requests: ConnectionRequest[] }>("/api/v1/top/connection-requests");
}

export function respondToConnectionRequest(requestId: string, response: "accepted" | "declined"): Promise<{ message: string }> {
  return request<{ message: string }>(`/api/v1/top/connection-requests/${encodeURIComponent(requestId)}/respond`, { method: "POST", body: { response } });
}

export function getDirectConversations(): Promise<{ conversations: DirectConversation[] }> {
  return request<{ conversations: DirectConversation[] }>("/api/v1/top/messages");
}

export function getDirectMessages(personId: string): Promise<{ messages: DirectMessage[] }> {
  return request<{ messages: DirectMessage[] }>(`/api/v1/top/messages/${encodeURIComponent(personId)}`);
}

export function sendDirectMessage(personId: string, body: string): Promise<{ message: DirectMessage }> {
  return request<{ message: DirectMessage }>(`/api/v1/top/messages/${encodeURIComponent(personId)}`, { method: "POST", body: { body } });
}

export function getWorkspaceOverview(): Promise<WorkspaceOverview> {
  return request<WorkspaceOverview>("/api/v1/workspace/overview");
}

export function getWorkspaceDashboard(): Promise<WorkspaceDashboard> {
  return request<WorkspaceDashboard>("/api/v1/workspace/dashboard");
}

export function getSeeds(): Promise<{ seeds: TopSeed[] }> {
  return request<{ seeds: TopSeed[] }>("/api/v1/workspace/seeds");
}

export function getSeed(seedId: string): Promise<SeedDetail> {
  return request<SeedDetail>(`/api/v1/workspace/seeds/${encodeURIComponent(seedId)}`);
}

export function createSeed(input: { title: string; problem: string; desiredOutcome: string }): Promise<{ seed: TopSeed }> {
  return request<{ seed: TopSeed }>("/api/v1/workspace/seeds", { method: "POST", body: input });
}

export function createSeedEntry(seedId: string, input: { body: string }): Promise<{ entry: SeedEntry }> {
  return request<{ entry: SeedEntry }>(`/api/v1/workspace/seeds/${encodeURIComponent(seedId)}/entries`, { method: "POST", body: input });
}

export function updateSeedStatus(seedId: string, input: { status: SeedStatus }): Promise<{ seed: TopSeed }> {
  return request<{ seed: TopSeed }>(`/api/v1/workspace/seeds/${encodeURIComponent(seedId)}/status`, { method: "PATCH", body: input });
}

export function turnSeedIntoProject(seedId: string, input: { direction: ProjectDirection; nextAction: string }): Promise<{ project: WorkspaceProject; seed: TopSeed | null }> {
  return request<{ project: WorkspaceProject; seed: TopSeed | null }>(`/api/v1/workspace/seeds/${encodeURIComponent(seedId)}/turn-into-project`, { method: "POST", body: input });
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

export function inviteProjectCollaborator(projectId: string, input: { email: string; role: "contributor" | "mentor" }): Promise<{ invitation: ProjectPendingInvitation; message: string }> {
  return request<{ invitation: ProjectPendingInvitation; message: string }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/collaborators`, {
    method: "POST",
    body: input
  });
}

export function updateProjectCollaboratorRole(projectId: string, memberId: string, input: { role: "contributor" | "mentor" }): Promise<{ collaborator: ProjectCollaborator; message: string }> {
  return request<{ collaborator: ProjectCollaborator; message: string }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(memberId)}`, { method: "PATCH", body: input });
}

export function removeProjectCollaborator(projectId: string, memberId: string): Promise<void> {
  return request<void>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/collaborators/${encodeURIComponent(memberId)}`, { method: "DELETE" });
}

export function createProjectMessage(projectId: string, input: { body: string }): Promise<{ message: ProjectMessage }> {
  return request<{ message: ProjectMessage }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/messages`, { method: "POST", body: input });
}

export function getCollaborationInvitations(): Promise<{ invitations: CollaborationInvitation[] }> {
  return request<{ invitations: CollaborationInvitation[] }>("/api/v1/workspace/invitations");
}

export function respondToCollaborationInvitation(invitationId: string, response: "accepted" | "declined"): Promise<{ project: WorkspaceProject; message: string }> {
  return request<{ project: WorkspaceProject; message: string }>(`/api/v1/workspace/invitations/${encodeURIComponent(invitationId)}/respond`, { method: "POST", body: { response } });
}

export function getTopNotifications(): Promise<{ notifications: TopNotification[] }> {
  return request<{ notifications: TopNotification[] }>("/api/v1/workspace/notifications");
}

export function subscribeToTopSignals(onSignal: () => void): () => void {
  if (!apiBaseUrl || typeof EventSource === "undefined") return () => undefined;
  const source = new EventSource(`${apiBaseUrl}/api/v1/top/events`, { withCredentials: true });
  source.addEventListener("signal", onSignal);
  return () => source.close();
}

export function markTopNotificationRead(notificationId: string): Promise<void> {
  return request<void>(`/api/v1/workspace/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH" });
}

export function createProjectContribution(projectId: string, input: { type: ProjectContributionType; description: string; evidenceUrl?: string }): Promise<{ contribution: ProjectContribution; message: string }> {
  return request<{ contribution: ProjectContribution; message: string }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/contributions`, {
    method: "POST",
    body: input
  });
}

export function createProjectReview(projectId: string, input: { proudOf: string; learned?: string; nextFocus?: string }): Promise<{ review: ProjectReview; message: string }> {
  return request<{ review: ProjectReview; message: string }>(`/api/v1/workspace/projects/${encodeURIComponent(projectId)}/reviews`, {
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
