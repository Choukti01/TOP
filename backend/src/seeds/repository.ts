import { and, eq } from "drizzle-orm";

import type { AppConfig } from "../config/env.js";
import { createDatabase } from "../db/client.js";
import { projects, seedNotes, seeds } from "../db/schema.js";

export type SeedStatus = "draft" | "planted" | "growing" | "archived";

export interface SeedRecord {
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

export interface SeedDetail extends SeedRecord {
  entries: SeedEntry[];
}

export interface SeedRepository {
  list(userId: string): Promise<SeedRecord[]>;
  get(userId: string, seedId: string): Promise<SeedDetail | null>;
  create(userId: string, input: SeedInput): Promise<SeedRecord>;
  addEntry(userId: string, seedId: string, body: string): Promise<SeedEntry | null>;
  setStatus(userId: string, seedId: string, status: SeedStatus): Promise<SeedRecord | null>;
  linkProject(userId: string, seedId: string, projectId: string): Promise<SeedRecord | null>;
}

export interface SeedInput {
  title: string;
  problem: string;
  desiredOutcome: string;
}

interface MemorySeed extends SeedRecord {
  entries: SeedEntry[];
}

const memoryGardens = new Map<string, MemorySeed[]>();

export function createSeedRepository(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): SeedRepository {
  return config.databaseUrl && config.databaseEnabled ? new PostgreSqlSeedRepository(config) : new MemorySeedRepository();
}

class MemorySeedRepository implements SeedRepository {
  public async list(userId: string): Promise<SeedRecord[]> { return this.garden(userId).map((seed) => toRecord(seed, seed.entryCount, seed.projectId)); }

  public async get(userId: string, seedId: string): Promise<SeedDetail | null> {
    const seed = this.garden(userId).find((candidate) => candidate.id === seedId);
    return seed ? { ...toRecord(seed, seed.entryCount, seed.projectId), entries: seed.entries.map((entry) => ({ ...entry })) } : null;
  }

  public async create(userId: string, input: SeedInput): Promise<SeedRecord> {
    const now = new Date().toISOString();
    const seed: MemorySeed = { id: crypto.randomUUID(), sourcePublicPostId: null, ...input, status: "planted", createdAt: now, updatedAt: now, entryCount: 0, projectId: null, entries: [] };
    this.garden(userId).unshift(seed);
    return toRecord(seed, seed.entryCount, seed.projectId);
  }

  public async addEntry(userId: string, seedId: string, body: string): Promise<SeedEntry | null> {
    const seed = this.garden(userId).find((candidate) => candidate.id === seedId);
    if (!seed || seed.status === "archived") return null;
    const entry = { id: crypto.randomUUID(), seedId, body, createdAt: new Date().toISOString() };
    seed.entries.unshift(entry);
    seed.entryCount = seed.entries.length;
    seed.status = "growing";
    seed.updatedAt = entry.createdAt;
    return { ...entry };
  }

  public async setStatus(userId: string, seedId: string, status: SeedStatus): Promise<SeedRecord | null> {
    const seed = this.garden(userId).find((candidate) => candidate.id === seedId);
    if (!seed) return null;
    seed.status = status;
    seed.updatedAt = new Date().toISOString();
    return toRecord(seed, seed.entryCount, seed.projectId);
  }

  public async linkProject(userId: string, seedId: string, projectId: string): Promise<SeedRecord | null> {
    const seed = this.garden(userId).find((candidate) => candidate.id === seedId);
    if (!seed) return null;
    seed.projectId = projectId;
    return toRecord(seed, seed.entryCount, seed.projectId);
  }

  private garden(userId: string): MemorySeed[] {
    const existing = memoryGardens.get(userId);
    if (existing) return existing;
    const garden: MemorySeed[] = [];
    memoryGardens.set(userId, garden);
    return garden;
  }
}

class PostgreSqlSeedRepository implements SeedRepository {
  private readonly database: ReturnType<typeof createDatabase>["db"];

  public constructor(config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">) {
    this.database = createDatabase(config).db;
  }

  public async list(userId: string): Promise<SeedRecord[]> {
    const [seedRows, noteRows, projectRows] = await Promise.all([
      this.database.select().from(seeds).where(eq(seeds.creatorId, userId)),
      this.database.select({ seedId: seedNotes.seedId }).from(seedNotes).innerJoin(seeds, eq(seedNotes.seedId, seeds.id)).where(eq(seeds.creatorId, userId)),
      this.database.select({ id: projects.id, seedId: projects.seedId }).from(projects).where(eq(projects.ownerId, userId))
    ]);
    const noteCounts = new Map<string, number>();
    for (const note of noteRows) noteCounts.set(note.seedId, (noteCounts.get(note.seedId) ?? 0) + 1);
    const projectIds = new Map(projectRows.filter((project) => project.seedId).map((project) => [project.seedId!, project.id]));
    return seedRows
      .map((seed) => toRecord(seed, noteCounts.get(seed.id) ?? 0, projectIds.get(seed.id) ?? null))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public async get(userId: string, seedId: string): Promise<SeedDetail | null> {
    const [seed] = await this.database.select().from(seeds).where(and(eq(seeds.id, seedId), eq(seeds.creatorId, userId)));
    if (!seed) return null;
    const [entryRows, projectRows] = await Promise.all([
      this.database.select().from(seedNotes).where(eq(seedNotes.seedId, seedId)),
      this.database.select({ id: projects.id }).from(projects).where(and(eq(projects.ownerId, userId), eq(projects.seedId, seedId)))
    ]);
    const entries = entryRows.map(toEntry).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return { ...toRecord(seed, entries.length, projectRows[0]?.id ?? null), entries };
  }

  public async create(userId: string, input: SeedInput): Promise<SeedRecord> {
    const now = new Date();
    const [seed] = await this.database.insert(seeds).values({ creatorId: userId, ...input, status: "planted", createdAt: now, updatedAt: now }).returning();
    if (!seed) throw new Error("TOP could not plant this seed.");
    return toRecord(seed, 0, null);
  }

  public async addEntry(userId: string, seedId: string, body: string): Promise<SeedEntry | null> {
    const [seed] = await this.database.select({ id: seeds.id, status: seeds.status }).from(seeds).where(and(eq(seeds.id, seedId), eq(seeds.creatorId, userId)));
    if (!seed || seed.status === "archived") return null;
    const now = new Date();
    const [entry] = await this.database.insert(seedNotes).values({ seedId, body, createdAt: now }).returning();
    await this.database.update(seeds).set({ status: "growing", updatedAt: now }).where(eq(seeds.id, seedId));
    return entry ? toEntry(entry) : null;
  }

  public async setStatus(userId: string, seedId: string, status: SeedStatus): Promise<SeedRecord | null> {
    const [seed] = await this.database.update(seeds).set({ status, updatedAt: new Date() }).where(and(eq(seeds.id, seedId), eq(seeds.creatorId, userId))).returning();
    if (!seed) return null;
    const notes = await this.database.select({ id: seedNotes.id }).from(seedNotes).where(eq(seedNotes.seedId, seedId));
    const [project] = await this.database.select({ id: projects.id }).from(projects).where(and(eq(projects.ownerId, userId), eq(projects.seedId, seedId)));
    return toRecord(seed, notes.length, project?.id ?? null);
  }

  public async linkProject(userId: string, seedId: string, projectId: string): Promise<SeedRecord | null> {
    const detail = await this.get(userId, seedId);
    if (!detail || detail.projectId !== projectId) return null;
    const { entries: _entries, ...seed } = detail;
    return seed;
  }
}

function toRecord(seed: { id: string; sourcePublicPostId?: string | null; title: string; problem: string; desiredOutcome: string; status: string; createdAt: Date | string; updatedAt: Date | string }, entryCount = 0, projectId: string | null = null): SeedRecord {
  return { id: seed.id, sourcePublicPostId: seed.sourcePublicPostId ?? null, title: seed.title, problem: seed.problem, desiredOutcome: seed.desiredOutcome, status: seed.status as SeedStatus, createdAt: iso(seed.createdAt), updatedAt: iso(seed.updatedAt), entryCount, projectId };
}

function toEntry(entry: { id: string; seedId: string; body: string; createdAt: Date | string }): SeedEntry {
  return { id: entry.id, seedId: entry.seedId, body: entry.body, createdAt: iso(entry.createdAt) };
}

function iso(value: Date | string): string { return typeof value === "string" ? value : value.toISOString(); }
