import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, or } from "drizzle-orm";

import type { AppConfig } from "../config/env.js";
import { createDatabase } from "../db/client.js";
import { projectMembers, projects, topEyeArtifacts, topEyeMessages, topEyeThreads } from "../db/schema.js";
import type { TopEyeArtifact, TopEyeArtifactKind, TopEyeMessage, TopEyeMessageRole, TopEyeMode, TopEyeThread, TopEyeThreadDetail } from "./contracts.js";

type CreateThreadInput = { title: string; mode: TopEyeMode; projectId?: string | null };
type CreateArtifactInput = { threadId?: string | null; projectId?: string | null; kind: TopEyeArtifactKind; title: string; content: string };

export interface TopEyeRepository {
  listThreads(userId: string): Promise<TopEyeThread[]>;
  getThread(userId: string, threadId: string): Promise<TopEyeThreadDetail | null>;
  createThread(userId: string, input: CreateThreadInput): Promise<TopEyeThread | null>;
  updateThreadProject(userId: string, threadId: string, projectId: string | null): Promise<TopEyeThread | null>;
  appendMessage(userId: string, threadId: string, input: { role: TopEyeMessageRole; content: string; model?: string | null }): Promise<TopEyeMessage | null>;
  deleteThread(userId: string, threadId: string): Promise<boolean>;
  getProjectContext(userId: string, projectId: string): Promise<string | null>;
  listArtifacts(userId: string): Promise<TopEyeArtifact[]>;
  createArtifact(userId: string, input: CreateArtifactInput): Promise<TopEyeArtifact | null>;
}

export function createTopEyeRepository(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): TopEyeRepository {
  return config.databaseUrl && config.databaseEnabled ? new PostgreSqlTopEyeRepository(config) : new MemoryTopEyeRepository();
}

class MemoryTopEyeRepository implements TopEyeRepository {
  private readonly threads = new Map<string, StoredThread>();
  private readonly messages = new Map<string, TopEyeMessage[]>();
  private readonly artifacts = new Map<string, StoredArtifact>();

  public async listThreads(userId: string): Promise<TopEyeThread[]> {
    return [...this.threads.values()].filter((thread) => thread.ownerId === userId).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map(toThread);
  }

  public async getThread(userId: string, threadId: string): Promise<TopEyeThreadDetail | null> {
    const thread = this.threads.get(threadId);
    if (!thread || thread.ownerId !== userId) return null;
    return { ...toThread(thread), messages: [...(this.messages.get(thread.id) ?? [])] };
  }

  public async createThread(userId: string, input: CreateThreadInput): Promise<TopEyeThread> {
    const now = new Date().toISOString();
    const thread: StoredThread = { id: randomUUID(), ownerId: userId, title: input.title, mode: input.mode, projectId: input.projectId ?? null, createdAt: now, updatedAt: now };
    this.threads.set(thread.id, thread);
    this.messages.set(thread.id, []);
    return toThread(thread);
  }

  public async updateThreadProject(userId: string, threadId: string, projectId: string | null): Promise<TopEyeThread | null> {
    const thread = this.threads.get(threadId);
    if (!thread || thread.ownerId !== userId) return null;
    thread.projectId = projectId;
    thread.updatedAt = new Date().toISOString();
    return toThread(thread);
  }

  public async appendMessage(userId: string, threadId: string, input: { role: TopEyeMessageRole; content: string; model?: string | null }): Promise<TopEyeMessage | null> {
    const thread = this.threads.get(threadId);
    if (!thread || thread.ownerId !== userId) return null;
    const message: TopEyeMessage = { id: randomUUID(), threadId, role: input.role, content: input.content, model: input.model ?? null, createdAt: new Date().toISOString() };
    this.messages.set(threadId, [...(this.messages.get(threadId) ?? []), message]);
    thread.updatedAt = message.createdAt;
    return message;
  }

  public async deleteThread(userId: string, threadId: string): Promise<boolean> {
    const thread = this.threads.get(threadId);
    if (!thread || thread.ownerId !== userId) return false;
    this.threads.delete(threadId);
    this.messages.delete(threadId);
    return true;
  }

  public async getProjectContext(_userId: string, _projectId: string): Promise<string | null> {
    // Local-memory development has no durable project relation to disclose.
    return null;
  }

  public async listArtifacts(userId: string): Promise<TopEyeArtifact[]> {
    return [...this.artifacts.values()].filter((artifact) => artifact.ownerId === userId).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).map(toArtifact);
  }

  public async createArtifact(userId: string, input: CreateArtifactInput): Promise<TopEyeArtifact | null> {
    if (input.threadId && !(await this.getThread(userId, input.threadId))) return null;
    const now = new Date().toISOString();
    const artifact: StoredArtifact = { id: randomUUID(), ownerId: userId, threadId: input.threadId ?? null, projectId: input.projectId ?? null, kind: input.kind, title: input.title, content: input.content, createdAt: now, updatedAt: now };
    this.artifacts.set(artifact.id, artifact);
    return toArtifact(artifact);
  }
}

class PostgreSqlTopEyeRepository implements TopEyeRepository {
  private readonly database: ReturnType<typeof createDatabase>["db"];

  public constructor(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">) {
    this.database = createDatabase(config).db;
  }

  public async listThreads(userId: string): Promise<TopEyeThread[]> {
    const rows = await this.database.select().from(topEyeThreads).where(eq(topEyeThreads.ownerId, userId)).orderBy(desc(topEyeThreads.updatedAt));
    return rows.map(toThread);
  }

  public async getThread(userId: string, threadId: string): Promise<TopEyeThreadDetail | null> {
    const [thread] = await this.database.select().from(topEyeThreads).where(and(eq(topEyeThreads.id, threadId), eq(topEyeThreads.ownerId, userId))).limit(1);
    if (!thread) return null;
    const messages = await this.database.select().from(topEyeMessages).where(eq(topEyeMessages.threadId, thread.id)).orderBy(asc(topEyeMessages.createdAt));
    return { ...toThread(thread), messages: messages.map(toMessage) };
  }

  public async createThread(userId: string, input: CreateThreadInput): Promise<TopEyeThread | null> {
    if (input.projectId && !(await this.hasProjectAccess(userId, input.projectId))) return null;
    const [thread] = await this.database.insert(topEyeThreads).values({ ownerId: userId, title: input.title, mode: input.mode, projectId: input.projectId ?? null }).returning();
    return thread ? toThread(thread) : null;
  }

  public async updateThreadProject(userId: string, threadId: string, projectId: string | null): Promise<TopEyeThread | null> {
    const existing = await this.getThread(userId, threadId);
    if (!existing || (projectId && !(await this.hasProjectAccess(userId, projectId))) || existing.messages.length > 0) return null;
    const [thread] = await this.database.update(topEyeThreads).set({ projectId, updatedAt: new Date() }).where(and(eq(topEyeThreads.id, threadId), eq(topEyeThreads.ownerId, userId))).returning();
    return thread ? toThread(thread) : null;
  }

  public async appendMessage(userId: string, threadId: string, input: { role: TopEyeMessageRole; content: string; model?: string | null }): Promise<TopEyeMessage | null> {
    const thread = await this.getThread(userId, threadId);
    if (!thread) return null;
    const [message] = await this.database.insert(topEyeMessages).values({ threadId, role: input.role, content: input.content, model: input.model ?? null }).returning();
    if (!message) return null;
    await this.database.update(topEyeThreads).set({ updatedAt: new Date() }).where(eq(topEyeThreads.id, threadId));
    return toMessage(message);
  }

  public async deleteThread(userId: string, threadId: string): Promise<boolean> {
    const deleted = await this.database.delete(topEyeThreads).where(and(eq(topEyeThreads.id, threadId), eq(topEyeThreads.ownerId, userId))).returning({ id: topEyeThreads.id });
    return deleted.length > 0;
  }

  public async getProjectContext(userId: string, projectId: string): Promise<string | null> {
    const [project] = await this.database
      .select({ title: projects.title, purpose: projects.purpose, direction: projects.direction, nextAction: projects.nextAction, status: projects.status })
      .from(projects)
      .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(and(eq(projects.id, projectId), or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId))))
      .limit(1);
    if (!project) return null;
    return [
      `Project: ${project.title}`,
      `Purpose: ${project.purpose}`,
      `Direction: ${project.direction}`,
      `Current status: ${project.status}`,
      `Next action: ${project.nextAction}`
    ].join("\n");
  }

  public async listArtifacts(userId: string): Promise<TopEyeArtifact[]> {
    const rows = await this.database.select().from(topEyeArtifacts).where(eq(topEyeArtifacts.ownerId, userId)).orderBy(desc(topEyeArtifacts.updatedAt));
    return rows.map(toArtifact);
  }

  public async createArtifact(userId: string, input: CreateArtifactInput): Promise<TopEyeArtifact | null> {
    if (input.threadId && !(await this.getThread(userId, input.threadId))) return null;
    if (input.projectId && !(await this.hasProjectAccess(userId, input.projectId))) return null;
    const [artifact] = await this.database.insert(topEyeArtifacts).values({ ownerId: userId, threadId: input.threadId ?? null, projectId: input.projectId ?? null, kind: input.kind, title: input.title, content: input.content }).returning();
    return artifact ? toArtifact(artifact) : null;
  }

  private async hasProjectAccess(userId: string, projectId: string): Promise<boolean> {
    const rows = await this.database
      .select({ id: projects.id })
      .from(projects)
      .leftJoin(projectMembers, eq(projectMembers.projectId, projects.id))
      .where(and(eq(projects.id, projectId), or(eq(projects.ownerId, userId), eq(projectMembers.userId, userId))))
      .limit(1);
    return rows.length > 0;
  }
}

type StoredThread = TopEyeThread & { ownerId: string };
type StoredArtifact = TopEyeArtifact & { ownerId: string };

function toThread(row: { id: string; title: string; mode: string; projectId: string | null; createdAt: Date; updatedAt: Date } | StoredThread): TopEyeThread {
  return { id: row.id, title: row.title, mode: row.mode as TopEyeMode, projectId: row.projectId, createdAt: toIso(row.createdAt), updatedAt: toIso(row.updatedAt) };
}

function toMessage(row: { id: string; threadId: string; role: string; content: string; model: string | null; createdAt: Date } | TopEyeMessage): TopEyeMessage {
  return { id: row.id, threadId: row.threadId, role: row.role as TopEyeMessageRole, content: row.content, model: row.model, createdAt: toIso(row.createdAt) };
}

function toArtifact(row: { id: string; threadId: string | null; projectId: string | null; kind: string; title: string; content: string; createdAt: Date; updatedAt: Date } | StoredArtifact): TopEyeArtifact {
  return { id: row.id, threadId: row.threadId, projectId: row.projectId, kind: row.kind as TopEyeArtifactKind, title: row.title, content: row.content, createdAt: toIso(row.createdAt), updatedAt: toIso(row.updatedAt) };
}

function toIso(value: Date | string): string {
  return typeof value === "string" ? value : value.toISOString();
}
