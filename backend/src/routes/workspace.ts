import { Router } from "express";
import { z } from "zod";

import type { AppConfig } from "../config/env.js";
import { createWorkspaceRepository } from "../workspace/repository.js";
import { AuthService } from "../auth/service.js";
import { currentUser, requireAuthenticatedUser } from "./auth.js";

export function createWorkspaceRouter(auth: AuthService, config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): Router {
const workspaceRouter = Router();
const workspace = createWorkspaceRepository(config);
workspaceRouter.use(requireAuthenticatedUser(auth));

const directionValues = ["personal", "creative", "learning", "community", "venture", "other"] as const;

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

const reflectionInput = z.object({
  answer: z.string().trim().min(3).max(800)
}).strict();

const focusInput = z.object({
  projectId: z.string().trim().min(1).max(80).optional()
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
