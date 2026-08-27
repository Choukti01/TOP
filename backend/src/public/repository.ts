import { and, asc, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";

import type { AppConfig } from "../config/env.js";
import { createDatabase } from "../db/client.js";
import { connectionRequests, directMessages, notifications, postComments, postReactions, profiles, projectActivity, projectArtifacts, projectMembers, projectMilestones, projects, publicPostOffers, publicPosts, seedNotes, seeds, users } from "../db/schema.js";
import { notificationHub } from "../realtime/notificationHub.js";

export type PublicPostKind = "idea" | "signal" | "offer" | "question" | "negotiation" | "request" | "resource" | "milestone" | "event" | "collaboration";
export type PublicReaction = "spark" | "build" | "help" | "question" | "respect";
export type SignalOfferKind = "help" | "skill" | "collaboration";
export type SignalOfferStatus = "pending" | "accepted" | "declined";

export interface PublicPersonSummary { id: string; displayName: string; fieldName: string | null; location: string | null; avatarDataUrl: string | null; memberSince: string; }
export interface PublicComment { id: string; postId: string; parentCommentId: string | null; body: string; createdAt: string; updatedAt: string; author: PublicPersonSummary; }
export interface PublicReactionPerson { reaction: PublicReaction; person: PublicPersonSummary; }
export interface PublicPostBridge { seedId: string | null; projectId: string | null; circleOpen: boolean; offerStatus: SignalOfferStatus | null; offerKind: SignalOfferKind | null; pendingOfferCount: number; }
export interface PublicPost { id: string; kind: PublicPostKind; title: string; body: string; createdAt: string; updatedAt: string; author: PublicPersonSummary; reactions: Record<PublicReaction, number>; reactionPeople: PublicReactionPerson[]; viewerReaction: PublicReaction | null; comments: PublicComment[]; commentCount: number; bridge: PublicPostBridge; }
export interface PublicProfile extends PublicPersonSummary { biography: string | null; stats: { projectCount: number; completedMilestoneCount: number; evidenceCount: number; connectionCount: number }; connectionStatus: "self" | "none" | "pending-sent" | "pending-received" | "connected"; sharedPosts: PublicPost[]; }
export interface ConnectionRequest { id: string; createdAt: string; sender: PublicPersonSummary; }
export interface DirectMessage { id: string; senderId: string; recipientId: string; body: string; createdAt: string; sender: PublicPersonSummary; }
export interface DirectConversation { person: PublicPersonSummary; lastMessage: string; lastMessageAt: string; unreadCount: number; }
export interface SignalOffer { id: string; postId: string; postTitle: string; projectId: string | null; kind: SignalOfferKind; note: string; createdAt: string; sender: PublicPersonSummary; }
export interface PublicSearchPerson extends PublicPersonSummary { connectionStatus: PublicProfile["connectionStatus"]; }
export interface PublicSearchResults { people: PublicSearchPerson[]; posts: PublicPost[]; }

export interface PublicRepository {
  getFeed(viewerId: string): Promise<PublicPost[]>;
  getPost(viewerId: string, postId: string): Promise<PublicPost | null>;
  search(viewerId: string, query: string): Promise<PublicSearchResults>;
  createPost(userId: string, input: { kind: PublicPostKind; title: string; body: string }): Promise<PublicPost>;
  updatePost(userId: string, postId: string, input: { kind: PublicPostKind; title: string; body: string }): Promise<PublicPost | null>;
  deletePost(userId: string, postId: string): Promise<boolean>;
  reactToPost(userId: string, postId: string, reaction: PublicReaction): Promise<PublicPost | null>;
  addComment(userId: string, postId: string, input: { body: string; parentCommentId: string | null }): Promise<PublicComment | null>;
  updateComment(userId: string, postId: string, commentId: string, body: string): Promise<PublicComment | null>;
  deleteComment(userId: string, postId: string, commentId: string): Promise<boolean>;
  getProfile(viewerId: string, personId: string): Promise<PublicProfile | null>;
  createConnectionRequest(senderId: string, recipientId: string): Promise<boolean>;
  getIncomingConnectionRequests(userId: string): Promise<ConnectionRequest[]>;
  respondToConnectionRequest(userId: string, requestId: string, response: "accepted" | "declined"): Promise<boolean>;
  listDirectConversations(userId: string): Promise<DirectConversation[]>;
  getDirectMessages(userId: string, personId: string): Promise<DirectMessage[] | null>;
  sendDirectMessage(userId: string, personId: string, body: string): Promise<DirectMessage | null>;
  createSeedFromPost(userId: string, postId: string): Promise<{ seedId: string; post: PublicPost } | null>;
  startProjectCircle(userId: string, postId: string, input: { direction: "personal" | "creative" | "learning" | "community" | "venture" | "other"; nextAction: string; firstMilestone: string }): Promise<{ projectId: string; post: PublicPost } | null>;
  createSignalOffer(userId: string, postId: string, input: { kind: SignalOfferKind; note: string }): Promise<PublicPost | null>;
  getIncomingSignalOffers(userId: string): Promise<SignalOffer[]>;
  respondToSignalOffer(userId: string, offerId: string, response: "accepted" | "declined", role: "contributor" | "mentor"): Promise<{ projectId: string | null } | null>;
}

const reactions: PublicReaction[] = ["spark", "build", "help", "question", "respect"];
const projectColors = ["#dfae63", "#cc7b5b", "#9eb488", "#d4a46f", "#d78397", "#9db9b0"];

export function createPublicRepository(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): PublicRepository { return config.databaseEnabled && config.databaseUrl ? new PostgreSqlPublicRepository(config) : new MemoryPublicRepository(); }

class MemoryPublicRepository implements PublicRepository {
  public async getFeed(_viewerId: string) { return []; }
  public async getPost(_viewerId: string, _postId: string): Promise<PublicPost | null> { return null; }
  public async search(_viewerId: string, _query: string): Promise<PublicSearchResults> { return { people: [], posts: [] }; }
  public async createPost(_userId: string, _input: { kind: PublicPostKind; title: string; body: string }): Promise<PublicPost> { throw new Error("Public TOP sharing requires the connected database."); }
  public async updatePost(_userId: string, _postId: string, _input: { kind: PublicPostKind; title: string; body: string }) { return null; }
  public async deletePost(_userId: string, _postId: string) { return false; }
  public async reactToPost(_userId: string, _postId: string, _reaction: PublicReaction) { return null; }
  public async addComment(_userId: string, _postId: string, _input: { body: string; parentCommentId: string | null }) { return null; }
  public async updateComment(_userId: string, _postId: string, _commentId: string, _body: string) { return null; }
  public async deleteComment(_userId: string, _postId: string, _commentId: string) { return false; }
  public async getProfile(_viewerId: string, _personId: string) { return null; }
  public async createConnectionRequest(_senderId: string, _recipientId: string) { return false; }
  public async getIncomingConnectionRequests(_userId: string) { return []; }
  public async respondToConnectionRequest(_userId: string, _requestId: string, _response: "accepted" | "declined") { return false; }
  public async listDirectConversations(_userId: string): Promise<DirectConversation[]> { return []; }
  public async getDirectMessages(_userId: string, _personId: string): Promise<DirectMessage[] | null> { return null; }
  public async sendDirectMessage(_userId: string, _personId: string, _body: string): Promise<DirectMessage | null> { return null; }
  public async createSeedFromPost(_userId: string, _postId: string): Promise<{ seedId: string; post: PublicPost } | null> { return null; }
  public async startProjectCircle(_userId: string, _postId: string, _input: { direction: "personal" | "creative" | "learning" | "community" | "venture" | "other"; nextAction: string; firstMilestone: string }): Promise<{ projectId: string; post: PublicPost } | null> { return null; }
  public async createSignalOffer(_userId: string, _postId: string, _input: { kind: SignalOfferKind; note: string }): Promise<PublicPost | null> { return null; }
  public async getIncomingSignalOffers(_userId: string): Promise<SignalOffer[]> { return []; }
  public async respondToSignalOffer(_userId: string, _offerId: string, _response: "accepted" | "declined", _role: "contributor" | "mentor"): Promise<{ projectId: string | null } | null> { return null; }
}

class PostgreSqlPublicRepository implements PublicRepository {
  private readonly database: ReturnType<typeof createDatabase>["db"];
  public constructor(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">) { this.database = createDatabase(config).db; }

  public async getFeed(viewerId: string): Promise<PublicPost[]> {
    const rows = await this.database.select({ post: publicPosts, authorId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(publicPosts).innerJoin(users, eq(users.id, publicPosts.authorId)).leftJoin(profiles, eq(profiles.userId, users.id)).orderBy(desc(publicPosts.createdAt)).limit(40);
    return this.hydratePosts(viewerId, rows);
  }

  public async search(viewerId: string, query: string): Promise<PublicSearchResults> {
    const term = `%${query.trim()}%`;
    const [peopleRows, postRows] = await Promise.all([
      this.database.select({ id: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt })
        .from(users)
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(or(ilike(profiles.displayName, term), ilike(profiles.fieldName, term), ilike(profiles.location, term), ilike(profiles.biography, term)))
        .limit(12),
      this.database.select({ post: publicPosts, authorId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt })
        .from(publicPosts)
        .innerJoin(users, eq(users.id, publicPosts.authorId))
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(or(ilike(publicPosts.title, term), ilike(publicPosts.body, term), ilike(publicPosts.kind, term)))
        .orderBy(desc(publicPosts.createdAt))
        .limit(18)
    ]);
    const people = await this.withConnectionStatus(viewerId, peopleRows);
    return { people, posts: await this.hydratePosts(viewerId, postRows) };
  }

  public async createPost(userId: string, input: { kind: PublicPostKind; title: string; body: string }): Promise<PublicPost> {
    const now = new Date();
    const [post] = await this.database.insert(publicPosts).values({ authorId: userId, kind: input.kind, title: input.title, body: input.body, createdAt: now, updatedAt: now }).returning();
    if (!post) throw new Error("TOP could not share that signal.");
    const result = await this.getPost(userId, post.id);
    if (!result) throw new Error("TOP could not open the signal it just shared.");
    return result;
  }

  public async updatePost(userId: string, postId: string, input: { kind: PublicPostKind; title: string; body: string }): Promise<PublicPost | null> {
    const [updated] = await this.database.update(publicPosts)
      .set({ kind: input.kind, title: input.title, body: input.body, updatedAt: new Date() })
      .where(and(eq(publicPosts.id, postId), eq(publicPosts.authorId, userId)))
      .returning({ id: publicPosts.id });
    return updated ? this.getPost(userId, updated.id) : null;
  }

  public async deletePost(userId: string, postId: string): Promise<boolean> {
    const deleted = await this.database.delete(publicPosts)
      .where(and(eq(publicPosts.id, postId), eq(publicPosts.authorId, userId)))
      .returning({ id: publicPosts.id });
    return deleted.length > 0;
  }

  public async createSeedFromPost(userId: string, postId: string): Promise<{ seedId: string; post: PublicPost } | null> {
    const [post] = await this.database.select({ id: publicPosts.id, title: publicPosts.title, body: publicPosts.body }).from(publicPosts).where(eq(publicPosts.id, postId));
    if (!post) return null;
    const [existing] = await this.database.select({ id: seeds.id }).from(seeds).where(and(eq(seeds.creatorId, userId), eq(seeds.sourcePublicPostId, postId)));
    const now = new Date();
    const seedId = existing?.id ?? (await this.database.insert(seeds).values({
      creatorId: userId,
      sourcePublicPostId: postId,
      title: post.title.slice(0, 120),
      problem: post.body,
      desiredOutcome: `Move “${post.title.slice(0, 110)}” into one concrete next action in my private Field.`,
      status: "planted",
      createdAt: now,
      updatedAt: now
    }).returning({ id: seeds.id }))[0]?.id;
    if (!seedId) throw new Error("TOP could not bring this signal into your Field.");
    if (!existing) await this.database.insert(seedNotes).values({ seedId, body: `Origin: brought from the public TOP signal “${post.title}”.`, createdAt: now });
    const hydrated = await this.getPost(userId, postId);
    return hydrated ? { seedId, post: hydrated } : null;
  }

  public async startProjectCircle(userId: string, postId: string, input: { direction: "personal" | "creative" | "learning" | "community" | "venture" | "other"; nextAction: string; firstMilestone: string }): Promise<{ projectId: string; post: PublicPost } | null> {
    const [post] = await this.database.select().from(publicPosts).where(and(eq(publicPosts.id, postId), eq(publicPosts.authorId, userId)));
    if (!post) return null;
    if (post.projectId) {
      const hydrated = await this.getPost(userId, postId);
      return hydrated ? { projectId: post.projectId, post: hydrated } : null;
    }
    const currentProjects = await this.database.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, userId));
    const index = currentProjects.length;
    const now = new Date();
    const angle = index * 2.399963229728653;
    const radius = 120 + Math.floor(index / 4) * 110;
    const [project] = await this.database.insert(projects).values({
      ownerId: userId,
      sourcePublicPostId: postId,
      seedId: null,
      title: post.title.slice(0, 80),
      purpose: post.body.slice(0, 280),
      direction: input.direction,
      nextAction: input.nextAction,
      status: "planning",
      progress: 0,
      color: projectColors[index % projectColors.length]!,
      fieldX: Math.round(Math.cos(angle) * radius),
      fieldY: Math.round(Math.sin(angle) * radius),
      fieldWidth: 270,
      fieldHeight: 168,
      createdAt: now,
      updatedAt: now
    }).returning();
    if (!project) throw new Error("TOP could not begin this project circle.");
    await Promise.all([
      this.database.update(publicPosts).set({ projectId: project.id, updatedAt: now }).where(eq(publicPosts.id, postId)),
      this.database.insert(projectMilestones).values({ projectId: project.id, title: input.firstMilestone, status: "planned", createdAt: now, completedAt: null }),
      this.database.insert(projectActivity).values([
        { projectId: project.id, type: "project-started", title: "Project circle started", detail: "This commitment grew from a public TOP signal and now has a protected private Field.", createdAt: now },
        { projectId: project.id, type: "milestone-added", title: "First milestone set", detail: input.firstMilestone, createdAt: now }
      ])
    ]);
    const hydrated = await this.getPost(userId, postId);
    return hydrated ? { projectId: project.id, post: hydrated } : null;
  }

  public async createSignalOffer(userId: string, postId: string, input: { kind: SignalOfferKind; note: string }): Promise<PublicPost | null> {
    const [post] = await this.database.select({ id: publicPosts.id, authorId: publicPosts.authorId, title: publicPosts.title }).from(publicPosts).where(eq(publicPosts.id, postId));
    if (!post || post.authorId === userId) return null;
    const now = new Date();
    await this.database.insert(publicPostOffers).values({ postId, userId, kind: input.kind, note: input.note, status: "pending", createdAt: now, updatedAt: now }).onConflictDoUpdate({ target: [publicPostOffers.postId, publicPostOffers.userId], set: { kind: input.kind, note: input.note, status: "pending", updatedAt: now } });
    const person = await this.personSummary(userId);
    if (person) await this.createNotification(post.authorId, postId, "signal-offer", `${person.displayName} offered to help with ${post.title}`, "Review their offer in Profile → Signals. You decide whether it belongs in a project circle.", "/profile?panel=signals", now);
    return this.getPost(userId, postId);
  }

  public async getIncomingSignalOffers(userId: string): Promise<SignalOffer[]> {
    const rows = await this.database.select({ offer: publicPostOffers, postTitle: publicPosts.title, projectId: publicPosts.projectId, senderId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(publicPostOffers).innerJoin(publicPosts, eq(publicPosts.id, publicPostOffers.postId)).innerJoin(users, eq(users.id, publicPostOffers.userId)).leftJoin(profiles, eq(profiles.userId, users.id)).where(and(eq(publicPosts.authorId, userId), eq(publicPostOffers.status, "pending"))).orderBy(desc(publicPostOffers.createdAt));
    return rows.map(({ offer, postTitle, projectId, senderId, displayName, fieldName, location, avatarDataUrl, memberSince }) => ({ id: offer.id, postId: offer.postId, postTitle, projectId, kind: offer.kind as SignalOfferKind, note: offer.note, createdAt: iso(offer.createdAt), sender: { id: senderId, displayName: displayName ?? "TOP member", fieldName, location, avatarDataUrl, memberSince: iso(memberSince) } }));
  }

  public async respondToSignalOffer(userId: string, offerId: string, response: "accepted" | "declined", role: "contributor" | "mentor"): Promise<{ projectId: string | null } | null> {
    const [record] = await this.database.select({ offer: publicPostOffers, post: publicPosts }).from(publicPostOffers).innerJoin(publicPosts, eq(publicPosts.id, publicPostOffers.postId)).where(and(eq(publicPostOffers.id, offerId), eq(publicPosts.authorId, userId), eq(publicPostOffers.status, "pending")));
    if (!record) return null;
    if (response === "accepted" && !record.post.projectId) return { projectId: null };
    const now = new Date();
    await this.database.update(publicPostOffers).set({ status: response, updatedAt: now }).where(eq(publicPostOffers.id, offerId));
    const owner = await this.personSummary(userId);
    if (response === "accepted" && record.post.projectId) {
      await Promise.all([
        this.database.insert(projectMembers).values({ projectId: record.post.projectId, userId: record.offer.userId, role, joinedAt: now }).onConflictDoUpdate({ target: [projectMembers.projectId, projectMembers.userId], set: { role } }),
        this.database.insert(projectActivity).values({ projectId: record.post.projectId, type: "circle-updated", title: "Offer welcomed into the circle", detail: `${(await this.personSummary(record.offer.userId))?.displayName ?? "A TOP member"} joined as a ${role}.`, createdAt: now }),
        this.createNotification(record.offer.userId, record.offer.id, "signal-offer-accepted", `${owner?.displayName ?? "The project owner"} welcomed your offer`, `You joined ${record.post.title} as a ${role}.`, `/field?project=${record.post.projectId}`, now)
      ]);
      return { projectId: record.post.projectId };
    }
    await this.createNotification(record.offer.userId, record.offer.id, "signal-offer-declined", `${owner?.displayName ?? "The signal author"} closed your offer`, `The public signal “${record.post.title}” remains separate from your private Field.`, "/top", now);
    return { projectId: null };
  }

  public async reactToPost(userId: string, postId: string, reaction: PublicReaction): Promise<PublicPost | null> {
    const [post] = await this.database.select({ id: publicPosts.id, authorId: publicPosts.authorId, title: publicPosts.title }).from(publicPosts).where(eq(publicPosts.id, postId));
    if (!post) return null;
    const [previous] = await this.database.select({ reaction: postReactions.reaction }).from(postReactions).where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId)));
    await this.database.insert(postReactions).values({ postId, userId, reaction, createdAt: new Date() }).onConflictDoUpdate({ target: [postReactions.postId, postReactions.userId], set: { reaction } });
    if (post.authorId !== userId && previous?.reaction !== reaction) {
      const person = await this.personSummary(userId);
      if (person) await this.createNotification(post.authorId, post.id, "top-reaction", `${person.displayName} marked your signal with ${reaction}`, post.title, `/top?signal=${post.id}&reaction=${userId}`, new Date());
    }
    return this.getPost(userId, postId);
  }

  public async addComment(userId: string, postId: string, input: { body: string; parentCommentId: string | null }): Promise<PublicComment | null> {
    const [post] = await this.database.select({ id: publicPosts.id, authorId: publicPosts.authorId, title: publicPosts.title }).from(publicPosts).where(eq(publicPosts.id, postId));
    if (!post) return null;
    let parent: { id: string; authorId: string } | undefined;
    if (input.parentCommentId) {
      [parent] = await this.database.select({ id: postComments.id, authorId: postComments.authorId })
        .from(postComments)
        .where(and(eq(postComments.id, input.parentCommentId), eq(postComments.postId, postId)));
      if (!parent) return null;
    }
    const now = new Date();
    const [comment] = await this.database.insert(postComments).values({ postId, authorId: userId, parentCommentId: parent?.id ?? null, body: input.body, createdAt: now, updatedAt: now }).returning();
    if (!comment) throw new Error("TOP could not add that response.");
    const author = await this.personSummary(userId);
    if (!author) throw new Error("TOP could not identify the person responding.");
    const recipientId = parent?.authorId ?? post.authorId;
    if (recipientId !== userId) await this.createNotification(recipientId, comment.id, parent ? "top-reply" : "top-response", parent ? `${author.displayName} replied to your response` : `${author.displayName} responded to ${post.title}`, parent ? "A person continued the conversation you started." : "A person added a constructive response to your shared signal.", `/top?signal=${post.id}&comment=${comment.id}`, now);
    return { id: comment.id, postId: comment.postId, parentCommentId: comment.parentCommentId, body: comment.body, createdAt: iso(comment.createdAt), updatedAt: iso(comment.updatedAt), author };
  }

  public async updateComment(userId: string, postId: string, commentId: string, body: string): Promise<PublicComment | null> {
    const [comment] = await this.database.update(postComments)
      .set({ body, updatedAt: new Date() })
      .where(and(eq(postComments.id, commentId), eq(postComments.postId, postId), eq(postComments.authorId, userId)))
      .returning();
    if (!comment) return null;
    const author = await this.personSummary(userId);
    if (!author) throw new Error("TOP could not identify the person editing this response.");
    return { id: comment.id, postId: comment.postId, parentCommentId: comment.parentCommentId, body: comment.body, createdAt: iso(comment.createdAt), updatedAt: iso(comment.updatedAt), author };
  }

  public async deleteComment(userId: string, postId: string, commentId: string): Promise<boolean> {
    const deleted = await this.database.delete(postComments)
      .where(and(eq(postComments.id, commentId), eq(postComments.postId, postId), eq(postComments.authorId, userId)))
      .returning({ id: postComments.id });
    return deleted.length > 0;
  }

  public async getProfile(viewerId: string, personId: string): Promise<PublicProfile | null> {
    const person = await this.personSummary(personId, true);
    if (!person) return null;
    const [profile] = await this.database.select({ biography: profiles.biography }).from(profiles).where(eq(profiles.userId, personId));
    const ownedProjects = await this.database.select({ id: projects.id }).from(projects).where(eq(projects.ownerId, personId));
    const ids = ownedProjects.map((project) => project.id);
    const [milestones, artifacts, connections] = await Promise.all([
      ids.length ? this.database.select({ status: projectMilestones.status }).from(projectMilestones).where(inArray(projectMilestones.projectId, ids)) : Promise.resolve([]),
      ids.length ? this.database.select({ id: projectArtifacts.id }).from(projectArtifacts).where(inArray(projectArtifacts.projectId, ids)) : Promise.resolve([]),
      this.database.select({ id: connectionRequests.id }).from(connectionRequests).where(and(eq(connectionRequests.status, "accepted"), or(eq(connectionRequests.senderId, personId), eq(connectionRequests.recipientId, personId))))
    ]);
    let connectionStatus: PublicProfile["connectionStatus"] = viewerId === personId ? "self" : "none";
    if (viewerId !== personId) {
      const [request] = await this.database.select().from(connectionRequests).where(or(and(eq(connectionRequests.senderId, viewerId), eq(connectionRequests.recipientId, personId)), and(eq(connectionRequests.senderId, personId), eq(connectionRequests.recipientId, viewerId))));
      if (request?.status === "accepted") connectionStatus = "connected";
      else if (request?.status === "pending") connectionStatus = request.senderId === viewerId ? "pending-sent" : "pending-received";
    }
    const sharedRows = await this.database.select({ post: publicPosts, authorId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(publicPosts).innerJoin(users, eq(users.id, publicPosts.authorId)).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(publicPosts.authorId, personId)).orderBy(desc(publicPosts.createdAt)).limit(20);
    return { ...person, biography: profile?.biography ?? null, stats: { projectCount: ids.length, completedMilestoneCount: milestones.filter((milestone) => milestone.status === "completed").length, evidenceCount: artifacts.length, connectionCount: connections.length }, connectionStatus, sharedPosts: await this.hydratePosts(viewerId, sharedRows) };
  }

  public async createConnectionRequest(senderId: string, recipientId: string): Promise<boolean> {
    if (senderId === recipientId || !(await this.personSummary(recipientId))) return false;
    const [existing] = await this.database.select({ id: connectionRequests.id }).from(connectionRequests).where(or(and(eq(connectionRequests.senderId, senderId), eq(connectionRequests.recipientId, recipientId)), and(eq(connectionRequests.senderId, recipientId), eq(connectionRequests.recipientId, senderId))));
    if (existing) return false;
    const now = new Date();
    const [request] = await this.database.insert(connectionRequests).values({ senderId, recipientId, status: "pending", createdAt: now, updatedAt: now }).returning();
    if (!request) throw new Error("TOP could not send that connection invitation.");
    const sender = await this.personSummary(senderId);
    await this.createNotification(recipientId, request.id, "connection-request", `${sender?.displayName ?? "A TOP member"} wants to connect`, "Review this request from your Profile → Signals panel.", `/profile?panel=signals&connection=${request.id}`, now);
    return true;
  }

  public async getIncomingConnectionRequests(userId: string): Promise<ConnectionRequest[]> {
    const rows = await this.database.select({ request: connectionRequests, senderId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(connectionRequests).innerJoin(users, eq(users.id, connectionRequests.senderId)).leftJoin(profiles, eq(profiles.userId, users.id)).where(and(eq(connectionRequests.recipientId, userId), eq(connectionRequests.status, "pending"))).orderBy(desc(connectionRequests.createdAt));
    return rows.map(({ request, senderId, displayName, fieldName, location, avatarDataUrl, memberSince }) => ({ id: request.id, createdAt: iso(request.createdAt), sender: { id: senderId, displayName: displayName ?? "TOP member", fieldName, location, avatarDataUrl, memberSince: iso(memberSince) } }));
  }

  public async respondToConnectionRequest(userId: string, requestId: string, response: "accepted" | "declined"): Promise<boolean> {
    const [request] = await this.database.update(connectionRequests).set({ status: response, updatedAt: new Date() }).where(and(eq(connectionRequests.id, requestId), eq(connectionRequests.recipientId, userId), eq(connectionRequests.status, "pending"))).returning();
    if (!request) return false;
    const person = await this.personSummary(userId);
    const now = new Date();
    await this.createNotification(request.senderId, request.id, response === "accepted" ? "connection-accepted" : "connection-declined", response === "accepted" ? `${person?.displayName ?? "A TOP member"} accepted your connection request` : `${person?.displayName ?? "A TOP member"} declined your connection request`, response === "accepted" ? "You can now find each other through TOP's shared field." : "Their field remains private.", `/people/${userId}`, now);
    return true;
  }

  public async listDirectConversations(userId: string): Promise<DirectConversation[]> {
    const rows = await this.database.select().from(directMessages).where(or(eq(directMessages.senderId, userId), eq(directMessages.recipientId, userId))).orderBy(desc(directMessages.createdAt)).limit(200);
    const latestByPerson = new Map<string, typeof directMessages.$inferSelect>();
    const unreadByPerson = new Map<string, number>();
    for (const message of rows) {
      const personId = message.senderId === userId ? message.recipientId : message.senderId;
      if (!latestByPerson.has(personId)) latestByPerson.set(personId, message);
      if (message.recipientId === userId && !message.readAt) unreadByPerson.set(personId, (unreadByPerson.get(personId) ?? 0) + 1);
    }
    const connections = await this.database.select({ senderId: connectionRequests.senderId, recipientId: connectionRequests.recipientId, updatedAt: connectionRequests.updatedAt }).from(connectionRequests).where(and(eq(connectionRequests.status, "accepted"), or(eq(connectionRequests.senderId, userId), eq(connectionRequests.recipientId, userId))));
    const connectedAt = new Map<string, Date>();
    for (const connection of connections) connectedAt.set(connection.senderId === userId ? connection.recipientId : connection.senderId, connection.updatedAt);
    const personIds = new Set([...connectedAt.keys(), ...latestByPerson.keys()]);
    const conversations = (await Promise.all([...personIds].map(async (personId) => {
      const message = latestByPerson.get(personId);
      const person = await this.personSummary(personId);
      return person ? { person, lastMessage: message?.body ?? "Connected in TOP. Begin a private conversation.", lastMessageAt: iso(message?.createdAt ?? connectedAt.get(personId) ?? new Date()), unreadCount: unreadByPerson.get(personId) ?? 0 } : null;
    }))).filter((conversation): conversation is DirectConversation => conversation !== null);
    return conversations.sort((left, right) => Date.parse(right.lastMessageAt) - Date.parse(left.lastMessageAt));
  }

  public async getDirectMessages(userId: string, personId: string): Promise<DirectMessage[] | null> {
    if (!(await this.areConnected(userId, personId))) return null;
    await this.database.update(directMessages).set({ readAt: new Date() }).where(and(eq(directMessages.senderId, personId), eq(directMessages.recipientId, userId), isNull(directMessages.readAt)));
    const rows = await this.database.select().from(directMessages).where(or(and(eq(directMessages.senderId, userId), eq(directMessages.recipientId, personId)), and(eq(directMessages.senderId, personId), eq(directMessages.recipientId, userId)))).orderBy(asc(directMessages.createdAt)).limit(250);
    const people = new Map<string, PublicPersonSummary | null>();
    for (const id of [userId, personId]) people.set(id, await this.personSummary(id));
    return rows.flatMap((message) => {
      const sender = people.get(message.senderId);
      return sender ? [{ id: message.id, senderId: message.senderId, recipientId: message.recipientId, body: message.body, createdAt: iso(message.createdAt), sender }] : [];
    });
  }

  public async sendDirectMessage(userId: string, personId: string, body: string): Promise<DirectMessage | null> {
    if (!(await this.areConnected(userId, personId))) return null;
    const now = new Date();
    const [message] = await this.database.insert(directMessages).values({ senderId: userId, recipientId: personId, body, readAt: null, createdAt: now }).returning();
    const sender = await this.personSummary(userId);
    if (!message || !sender) return null;
    await this.createNotification(personId, message.id, "direct-message", `${sender.displayName} sent you a message`, "Open your private Messages space to reply.", `/profile?panel=messages&with=${userId}`, now);
    return { id: message.id, senderId: message.senderId, recipientId: message.recipientId, body: message.body, createdAt: iso(message.createdAt), sender };
  }

  public async getPost(viewerId: string, postId: string): Promise<PublicPost | null> {
    const rows = await this.database.select({ post: publicPosts, authorId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(publicPosts).innerJoin(users, eq(users.id, publicPosts.authorId)).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(publicPosts.id, postId));
    return (await this.hydratePosts(viewerId, rows, true))[0] ?? null;
  }

  private async withConnectionStatus(viewerId: string, people: Array<{ id: string; displayName: string | null; fieldName: string | null; location: string | null; avatarDataUrl: string | null; memberSince: Date }>): Promise<PublicSearchPerson[]> {
    const personIds = people.map((person) => person.id);
    const relationships = personIds.length ? await this.database.select().from(connectionRequests).where(or(and(eq(connectionRequests.senderId, viewerId), inArray(connectionRequests.recipientId, personIds)), and(eq(connectionRequests.recipientId, viewerId), inArray(connectionRequests.senderId, personIds)))) : [];
    return people.map((person) => {
      const relationship = relationships.find((item) => item.senderId === person.id || item.recipientId === person.id);
      let connectionStatus: PublicProfile["connectionStatus"] = person.id === viewerId ? "self" : "none";
      if (relationship?.status === "accepted") connectionStatus = "connected";
      else if (relationship?.status === "pending") connectionStatus = relationship.senderId === viewerId ? "pending-sent" : "pending-received";
      return { id: person.id, displayName: person.displayName ?? "TOP member", fieldName: person.fieldName, location: person.location, avatarDataUrl: person.avatarDataUrl, memberSince: iso(person.memberSince), connectionStatus };
    });
  }

  private async hydratePosts(viewerId: string, rows: Array<{ post: typeof publicPosts.$inferSelect; authorId: string; displayName: string | null; fieldName: string | null; location: string | null; avatarDataUrl: string | null; memberSince: Date }>, includeAllComments = false): Promise<PublicPost[]> {
    const ids = rows.map((row) => row.post.id);
    if (!ids.length) return [];
    const [reactionRows, commentRows, seedRows, offerRows] = await Promise.all([
      this.database.select({ postId: postReactions.postId, reaction: postReactions.reaction, userId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(postReactions).innerJoin(users, eq(users.id, postReactions.userId)).leftJoin(profiles, eq(profiles.userId, users.id)).where(inArray(postReactions.postId, ids)),
      this.database.select({ comment: postComments, authorId: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(postComments).innerJoin(users, eq(users.id, postComments.authorId)).leftJoin(profiles, eq(profiles.userId, users.id)).where(inArray(postComments.postId, ids)).orderBy(desc(postComments.createdAt)),
      this.database.select({ id: seeds.id, sourcePublicPostId: seeds.sourcePublicPostId }).from(seeds).where(and(eq(seeds.creatorId, viewerId), inArray(seeds.sourcePublicPostId, ids))),
      this.database.select().from(publicPostOffers).where(inArray(publicPostOffers.postId, ids))
    ]);
    const seedByPostId = new Map(seedRows.flatMap((seed) => seed.sourcePublicPostId ? [[seed.sourcePublicPostId, seed.id] as const] : []));
    const viewerOfferByPostId = new Map(offerRows.filter((offer) => offer.userId === viewerId).map((offer) => [offer.postId, offer]));
    const pendingOfferCountByPostId = new Map<string, number>();
    for (const offer of offerRows) if (offer.status === "pending") pendingOfferCountByPostId.set(offer.postId, (pendingOfferCountByPostId.get(offer.postId) ?? 0) + 1);
    return rows.map(({ post, authorId, displayName, fieldName, location, avatarDataUrl, memberSince }) => {
      const postReactionsForPost = reactionRows.filter((reaction) => reaction.postId === post.id);
      const postCommentsForPost = commentRows.filter(({ comment }) => comment.postId === post.id);
      const reactionCount = Object.fromEntries(reactions.map((reaction) => [reaction, postReactionsForPost.filter((entry) => entry.reaction === reaction).length])) as Record<PublicReaction, number>;
      const viewerReaction = postReactionsForPost.find((reaction) => reaction.userId === viewerId)?.reaction as PublicReaction | undefined;
      const viewerOffer = viewerOfferByPostId.get(post.id);
      const visibleComments = includeAllComments ? postCommentsForPost : postCommentsForPost.slice(0, 3);
      return { id: post.id, kind: post.kind as PublicPostKind, title: post.title, body: post.body, createdAt: iso(post.createdAt), updatedAt: iso(post.updatedAt), author: { id: authorId, displayName: displayName ?? "TOP member", fieldName, location, avatarDataUrl, memberSince: iso(memberSince) }, reactions: reactionCount, reactionPeople: postReactionsForPost.map((reaction) => ({ reaction: reaction.reaction as PublicReaction, person: { id: reaction.userId, displayName: reaction.displayName ?? "TOP member", fieldName: reaction.fieldName, location: reaction.location, avatarDataUrl: reaction.avatarDataUrl, memberSince: iso(reaction.memberSince) } })), viewerReaction: viewerReaction ?? null, comments: visibleComments.map(({ comment, authorId: commentAuthorId, displayName: commentName, fieldName: commentFieldName, location: commentLocation, avatarDataUrl: commentAvatarDataUrl, memberSince: commentMemberSince }) => ({ id: comment.id, postId: comment.postId, parentCommentId: comment.parentCommentId, body: comment.body, createdAt: iso(comment.createdAt), updatedAt: iso(comment.updatedAt), author: { id: commentAuthorId, displayName: commentName ?? "TOP member", fieldName: commentFieldName, location: commentLocation, avatarDataUrl: commentAvatarDataUrl, memberSince: iso(commentMemberSince) } })), commentCount: postCommentsForPost.length, bridge: { seedId: seedByPostId.get(post.id) ?? null, projectId: authorId === viewerId ? post.projectId : null, circleOpen: Boolean(post.projectId), offerStatus: viewerOffer ? viewerOffer.status as SignalOfferStatus : null, offerKind: viewerOffer ? viewerOffer.kind as SignalOfferKind : null, pendingOfferCount: authorId === viewerId ? pendingOfferCountByPostId.get(post.id) ?? 0 : 0 } };
    });
  }

  private async personSummary(userId: string, includeMissingProfile = false): Promise<PublicPersonSummary | null> {
    const [person] = await this.database.select({ id: users.id, displayName: profiles.displayName, fieldName: profiles.fieldName, location: profiles.location, avatarDataUrl: profiles.avatarDataUrl, memberSince: users.createdAt }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(eq(users.id, userId));
    if (!person || (!includeMissingProfile && !person.displayName)) return null;
    return { id: person.id, displayName: person.displayName ?? "TOP member", fieldName: person.fieldName, location: person.location, avatarDataUrl: person.avatarDataUrl, memberSince: iso(person.memberSince) };
  }

  private async areConnected(leftId: string, rightId: string): Promise<boolean> {
    if (leftId === rightId) return false;
    const [relationship] = await this.database.select({ id: connectionRequests.id }).from(connectionRequests).where(and(eq(connectionRequests.status, "accepted"), or(and(eq(connectionRequests.senderId, leftId), eq(connectionRequests.recipientId, rightId)), and(eq(connectionRequests.senderId, rightId), eq(connectionRequests.recipientId, leftId)))));
    return Boolean(relationship);
  }

  private async createNotification(userId: string, entityId: string, type: string, title: string, detail: string, href: string, createdAt: Date): Promise<void> { await this.database.insert(notifications).values({ userId, entityId, type, title, detail, href, createdAt }); notificationHub.publish(userId); }
}

function iso(value: Date): string { return value.toISOString(); }
