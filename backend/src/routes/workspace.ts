import { Router } from "express";
import { z } from "zod";

import type { AppConfig } from "../config/env.js";
import { createSeedSchema, seedStatusSchema } from "../modules/seeds/contracts.js";
import { createSeedRepository } from "../seeds/repository.js";
import { createWorkspaceRepository } from "../workspace/repository.js";
import { AuthService } from "../auth/service.js";
import { currentUser, requireAuthenticatedUser } from "./auth.js";

export function createWorkspaceRouter(auth: AuthService, config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): Router {
const workspaceRouter = Router();
const workspace = createWorkspaceRepository(config);
const seedGarden = createSeedRepository(config);
workspaceRouter.use(requireAuthenticatedUser(auth));

const directionValues = ["personal", "creative", "learning", "community", "venture", "other"] as const;
const contributionValues = ["idea", "research", "design", "code", "funding", "mentorship", "operations", "other"] as const;

const projectInput = z.object({
  title: z.string().trim().min(3).max(80),
  purpose: z.string().trim().min(12).max(280),
  direction: z.enum(directionValues),
  nextAction: z.string().trim().min(3).max(180)
}).strict();

const projectUpdateInput = z.object({
  nextAction: z.string().trim().min(3).max(180).optional(),
  status: z.enum(["planning", "active", "paused", "completed"]).optional()
}).strict().refine((input) => Object.keys(input).length > 0, "Choose what you want to update.");

const projectPositionInput = z.object({
  x: z.number().int().min(-4000).max(4000),
  y: z.number().int().min(-4000).max(4000)
}).strict();

const milestoneInput = z.object({
  title: z.string().trim().min(3).max(140)
}).strict();

const milestoneStatusInput = z.object({
  status: z.enum(["planned", "completed"])
}).strict();

const artifactInput = z.object({
  title: z.string().trim().min(3).max(140),
  kind: z.enum(["atelier", "canvas", "blueprint", "note", "link", "other"]),
  note: z.string().trim().max(500).optional()
}).strict();

const collaboratorInput = z.object({
  email: z.string().trim().email().max(254),
  role: z.enum(["contributor", "mentor"])
}).strict();

const collaboratorRoleInput = z.object({
  role: z.enum(["contributor", "mentor"])
}).strict();

const invitationResponseInput = z.object({
  response: z.enum(["accepted", "declined"])
}).strict();

const projectMessageInput = z.object({
  body: z.string().trim().min(1).max(2_000)
}).strict();

const contributionInput = z.object({
  type: z.enum(contributionValues),
  description: z.string().trim().min(3).max(1_000),
  evidenceUrl: z.string().trim().url().max(500).refine((value) => /^https?:\/\//i.test(value), "Evidence must be an HTTP(S) link.").optional()
}).strict();

const projectReviewInput = z.object({
  proudOf: z.string().trim().min(3).max(800),
  learned: z.string().trim().max(500).optional(),
  nextFocus: z.string().trim().max(180).optional()
}).strict();

const reflectionInput = z.object({
  answer: z.string().trim().min(3).max(800)
}).strict();

const focusInput = z.object({
  projectId: z.string().trim().min(1).max(80).optional()
}).strict();

const seedEntryInput = z.object({
  body: z.string().trim().min(3).max(1_000)
}).strict();

const seedConversionInput = z.object({
  direction: z.enum(directionValues),
  nextAction: z.string().trim().min(3).max(180)
}).strict();

workspaceRouter.get("/overview", async (_request, response) => {
  response.status(200).json({
    world: {
      id: "top",
      name: "TOP",
      subtitle: "A field for flourishing"
    },
    nodes: await workspace.listNodes(currentUser(response).id),
    updatedAt: new Date().toISOString()
  });
});

workspaceRouter.get("/dashboard", async (_request, response) => {
  response.status(200).json(await workspace.getDashboard(currentUser(response).id));
});

workspaceRouter.get("/profile-dashboard", async (_request, response) => {
  response.status(200).json(await workspace.getPersonalDashboard(currentUser(response).id));
});

workspaceRouter.get("/invitations", async (_request, response) => {
  response.status(200).json({ invitations: await workspace.getInvitations(currentUser(response).id) });
});

workspaceRouter.post("/invitations/:invitationId/respond", async (request, response) => {
  const parsed = invitationResponseInput.safeParse(request.body);
  if (!parsed.success) return response.status(422).json({ error: "Choose whether to accept or decline this invitation." });
  const project = await workspace.respondToInvitation(currentUser(response).id, request.params.invitationId, parsed.data.response);
  if (!project) return response.status(404).json({ error: "That invitation is no longer available." });
  return response.status(200).json({ project, message: parsed.data.response === "accepted" ? "You are now part of this project circle." : "Invitation declined. Your field remains yours." });
});

workspaceRouter.get("/notifications", async (_request, response) => {
  response.status(200).json({ notifications: await workspace.getNotifications(currentUser(response).id) });
});

workspaceRouter.patch("/notifications/:notificationId/read", async (request, response) => {
  const marked = await workspace.markNotificationRead(currentUser(response).id, request.params.notificationId);
  if (!marked) return response.status(404).json({ error: "That notification is no longer available." });
  return response.status(204).end();
});

workspaceRouter.get("/seeds", async (_request, response) => {
  response.status(200).json({ seeds: await seedGarden.list(currentUser(response).id) });
});

workspaceRouter.post("/seeds", async (request, response) => {
  const parsed = createSeedSchema.strict().safeParse(request.body);
  if (!parsed.success) return response.status(422).json({ error: "A seed needs a clear name, tension, and hoped-for change." });
  return response.status(201).json({ seed: await seedGarden.create(currentUser(response).id, parsed.data) });
});

workspaceRouter.get("/seeds/:seedId", async (request, response) => {
  const seed = await seedGarden.get(currentUser(response).id, request.params.seedId);
  if (!seed) return response.status(404).json({ error: "That seed is no longer in your garden." });
  return response.status(200).json(seed);
});

workspaceRouter.post("/seeds/:seedId/entries", async (request, response) => {
  const parsed = seedEntryInput.safeParse(request.body);
  if (!parsed.success) return response.status(422).json({ error: "Write a few honest words before tending this seed." });
  const entry = await seedGarden.addEntry(currentUser(response).id, request.params.seedId, parsed.data.body);
  if (!entry) return response.status(404).json({ error: "That seed cannot be tended right now." });
  return response.status(201).json({ entry });
});

workspaceRouter.patch("/seeds/:seedId/status", async (request, response) => {
  const parsed = z.object({ status: seedStatusSchema }).strict().safeParse(request.body);
  if (!parsed.success) return response.status(422).json({ error: "Choose a truthful state for this seed." });
  const seed = await seedGarden.setStatus(currentUser(response).id, request.params.seedId, parsed.data.status);
  if (!seed) return response.status(404).json({ error: "That seed is no longer in your garden." });
  return response.status(200).json({ seed });
});

workspaceRouter.post("/seeds/:seedId/turn-into-project", async (request, response) => {
  const parsed = seedConversionInput.safeParse(request.body);
  if (!parsed.success) return response.status(422).json({ error: "Choose a direction and one next action before beginning this project." });
  const userId = currentUser(response).id;
  const seed = await seedGarden.get(userId, request.params.seedId);
  if (!seed) return response.status(404).json({ error: "That seed is no longer in your garden." });
  if (seed.projectId) return response.status(409).json({ error: "This seed already has a project in your field." });
  if (seed.status === "archived") return response.status(409).json({ error: "Restore this seed before turning it into a project." });

  const project = await workspace.createProject(userId, {
    seedId: seed.id,
    title: seed.title.slice(0, 80),
    purpose: seed.desiredOutcome.slice(0, 280),
    direction: parsed.data.direction,
    nextAction: parsed.data.nextAction
  });
  await seedGarden.setStatus(userId, seed.id, "archived");
  const archivedSeed = await seedGarden.linkProject(userId, seed.id, project.id);
  return response.status(201).json({ project, seed: archivedSeed });
});

workspaceRouter.post("/projects", async (request, response) => {
  const parsed = projectInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "A project needs a clear name, purpose, direction, and first next action." });
  }

  return response.status(201).json({ project: await workspace.createProject(currentUser(response).id, parsed.data) });
});

workspaceRouter.patch("/projects/:projectId", async (request, response) => {
  const parsed = projectUpdateInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Choose a clear next action or an honest project state before saving." });
  }

  const project = await workspace.updateProject(currentUser(response).id, request.params.projectId, parsed.data);

  if (!project) return response.status(404).json({ error: "That project no longer exists in this field." });

  return response.status(200).json({ project });
});

workspaceRouter.patch("/projects/:projectId/field-position", async (request, response) => {
  const parsed = projectPositionInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "That position is outside the bounds of your field." });
  }

  const project = await workspace.updateProjectPosition(currentUser(response).id, request.params.projectId, parsed.data);

  if (!project) return response.status(404).json({ error: "That project no longer exists in this field." });

  return response.status(200).json({ project });
});

workspaceRouter.get("/projects/:projectId", async (request, response) => {
  const detail = await workspace.getProjectDetail(currentUser(response).id, request.params.projectId);

  if (!detail) return response.status(404).json({ error: "That project no longer exists in this field." });

  return response.status(200).json(detail);
});

workspaceRouter.post("/projects/:projectId/milestones", async (request, response) => {
  const parsed = milestoneInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "A milestone needs a clear, specific name." });
  }

  const milestone = await workspace.addMilestone(currentUser(response).id, request.params.projectId, parsed.data.title);

  if (!milestone) return response.status(404).json({ error: "That project no longer exists in this field." });

  return response.status(201).json({ milestone });
});

workspaceRouter.patch("/projects/:projectId/milestones/:milestoneId", async (request, response) => {
  const parsed = milestoneStatusInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Choose whether this milestone is planned or complete." });
  }

  const milestone = await workspace.setMilestoneStatus(currentUser(response).id, request.params.projectId, request.params.milestoneId, parsed.data.status);

  if (!milestone) return response.status(404).json({ error: "That milestone no longer exists in this project." });

  return response.status(200).json({ milestone });
});

workspaceRouter.post("/projects/:projectId/artifacts", async (request, response) => {
  const parsed = artifactInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Give the evidence a clear name before recording it." });
  }

  const artifact = await workspace.addArtifact(currentUser(response).id, request.params.projectId, parsed.data);

  if (!artifact) return response.status(404).json({ error: "That project no longer exists in this field." });

  return response.status(201).json({ artifact });
});

workspaceRouter.post("/projects/:projectId/collaborators", async (request, response) => {
  const parsed = collaboratorInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Enter the email of a registered TOP member and choose their role." });
  }

  const invitation = await workspace.createInvitation(currentUser(response).id, request.params.projectId, parsed.data);
  if (!invitation) return response.status(404).json({ error: "That person cannot be invited. They may not be registered, may already belong to this project, or you do not manage it." });

  return response.status(201).json({ invitation, message: `${invitation.displayName} received a private invitation to this project circle.` });
});

workspaceRouter.patch("/projects/:projectId/collaborators/:memberId", async (request, response) => {
  const parsed = collaboratorRoleInput.safeParse(request.body);
  if (!parsed.success) return response.status(422).json({ error: "Choose a contributor or mentor role." });
  const collaborator = await workspace.updateCollaboratorRole(currentUser(response).id, request.params.projectId, request.params.memberId, parsed.data.role);
  if (!collaborator) return response.status(404).json({ error: "That member cannot be changed, or this project is not yours to manage." });
  return response.status(200).json({ collaborator, message: `${collaborator.displayName}'s role is now ${collaborator.role}.` });
});

workspaceRouter.delete("/projects/:projectId/collaborators/:memberId", async (request, response) => {
  const removed = await workspace.removeCollaborator(currentUser(response).id, request.params.projectId, request.params.memberId);
  if (!removed) return response.status(404).json({ error: "That member cannot be removed, or this project is not yours to manage." });
  return response.status(204).end();
});

workspaceRouter.post("/projects/:projectId/messages", async (request, response) => {
  const parsed = projectMessageInput.safeParse(request.body);
  if (!parsed.success) return response.status(422).json({ error: "Write a clear message for the project circle." });
  const message = await workspace.addMessage(currentUser(response).id, request.params.projectId, parsed.data.body);
  if (!message) return response.status(404).json({ error: "You do not have access to speak in this project circle." });
  return response.status(201).json({ message });
});

workspaceRouter.post("/projects/:projectId/contributions", async (request, response) => {
  const parsed = contributionInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "A contribution needs a clear type, description, and a valid HTTP(S) evidence link when you include one." });
  }

  const contribution = await workspace.addContribution(currentUser(response).id, request.params.projectId, parsed.data);
  if (!contribution) return response.status(404).json({ error: "You do not have access to contribute to this project." });

  return response.status(201).json({ contribution, message: "Contribution recorded in the project trail." });
});

workspaceRouter.post("/projects/:projectId/reviews", async (request, response) => {
  const parsed = projectReviewInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Name one thing that moved forward before keeping this review." });
  }

  const review = await workspace.addReview(currentUser(response).id, request.params.projectId, parsed.data);
  if (!review) return response.status(404).json({ error: "That project no longer exists in this field." });

  return response.status(201).json({ review, message: "Project review kept. Let the learning guide your next return." });
});

workspaceRouter.post("/reflections", async (request, response) => {
  const parsed = reflectionInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Write at least a few words before saving your reflection." });
  }

  const reflection = await workspace.saveReflection(currentUser(response).id, parsed.data.answer);
  return response.status(201).json({
    reflection,
    message: "Reflection saved. Carry one thing you are proud of into tomorrow."
  });
});

workspaceRouter.post("/focus", async (request, response) => {
  const parsed = focusInput.safeParse(request.body ?? {});

  if (!parsed.success) {
    return response.status(422).json({ error: "Choose a valid project before asking for focus." });
  }

  const focus = await workspace.getFocus(currentUser(response).id, parsed.data.projectId);

  if (!focus) return response.status(404).json({ error: "Begin a project before asking TOP to help you focus." });

  return response.status(200).json(focus);
});

return workspaceRouter;
}
