import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const seedStatus = pgEnum("seed_status", [
  "draft",
  "planted",
  "growing",
  "archived"
]);

export const projectStatus = pgEnum("project_status", [
  "planning",
  "active",
  "paused",
  "completed",
  "archived"
]);

export const projectDirection = pgEnum("project_direction", [
  "personal",
  "creative",
  "learning",
  "community",
  "venture",
  "other"
]);

export const milestoneStatus = pgEnum("milestone_status", ["planned", "completed"]);

export const projectArtifactKind = pgEnum("project_artifact_kind", [
  "atelier",
  "canvas",
  "blueprint",
  "note",
  "link",
  "other"
]);

export const contributionType = pgEnum("contribution_type", [
  "idea",
  "research",
  "design",
  "code",
  "funding",
  "mentorship",
  "operations",
  "other"
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  biography: text("biography"),
  location: text("location"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const skills = pgTable(
  "skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [uniqueIndex("skills_name_unique").on(table.name)]
);

export const profileSkills = pgTable(
  "profile_skills",
  {
    profileUserId: uuid("profile_user_id")
      .notNull()
      .references(() => profiles.userId, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    evidenceUrl: text("evidence_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [primaryKey({ columns: [table.profileUserId, table.skillId] })]
);

export const seeds = pgTable("seeds", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: uuid("creator_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  problem: text("problem").notNull(),
  desiredOutcome: text("desired_outcome").notNull(),
  status: seedStatus("status").default("draft").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const seedNotes = pgTable("seed_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  seedId: uuid("seed_id")
    .notNull()
    .references(() => seeds.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  seedId: uuid("seed_id").references(() => seeds.id, { onDelete: "set null" }),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  direction: projectDirection("direction").notNull(),
  nextAction: text("next_action").notNull(),
  status: projectStatus("status").default("planning").notNull(),
  progress: integer("progress").default(0).notNull(),
  color: text("color").default("#dfae63").notNull(),
  fieldX: integer("field_x").default(0).notNull(),
  fieldY: integer("field_y").default(0).notNull(),
  fieldWidth: integer("field_width").default(270).notNull(),
  fieldHeight: integer("field_height").default(168).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const projectMilestones = pgTable("project_milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: milestoneStatus("status").default("planned").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true })
});

export const projectArtifacts = pgTable("project_artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  contributorId: uuid("contributor_id").references(() => users.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  kind: projectArtifactKind("kind").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const projectActivity = pgTable("project_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("contributor"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [primaryKey({ columns: [table.projectId, table.userId] })]
);

export const contributions = pgTable("contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  contributorId: uuid("contributor_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: contributionType("type").notNull(),
  description: text("description").notNull(),
  evidenceUrl: text("evidence_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const circles = pgTable("circles", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  purpose: text("purpose").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const circleMembers = pgTable(
  "circle_members",
  {
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [primaryKey({ columns: [table.circleId, table.userId] })]
);

export const mentorships = pgTable(
  "mentorships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    mentorId: uuid("mentor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    apprenticeId: uuid("apprentice_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id").references(() => skills.id, { onDelete: "set null" }),
    objective: text("objective").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
  },
  (table) => [
    uniqueIndex("mentorships_active_unique").on(
      table.mentorId,
      table.apprenticeId,
      table.skillId
    )
  ]
);

export const reflections = pgTable("reflections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  proudOf: text("proud_of"),
  learned: text("learned"),
  challenge: text("challenge"),
  nextFocus: text("next_focus"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
