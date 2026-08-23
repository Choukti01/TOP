import { Router } from "express";
import { z } from "zod";

import {
  createProject,
  getFocus,
  getWorkspaceDashboard,
  listWorkspaceNodes,
  saveReflection,
  updateProject
} from "../workspace/store.js";

export const workspaceRouter = Router();

const directionValues = ["personal", "creative", "learning", "community", "venture", "other"] as const;

const projectInput = z.object({
  title: z.string().trim().min(3).max(80),
  purpose: z.string().trim().min(12).max(280),
  direction: z.enum(directionValues),
  nextAction: z.string().trim().min(3).max(180)
}).strict();

const projectUpdateInput = z.object({
  nextAction: z.string().trim().min(3).max(180)
}).strict();

const reflectionInput = z.object({
  answer: z.string().trim().min(3).max(800)
}).strict();

const focusInput = z.object({
  projectId: z.string().trim().min(1).max(80).optional()
}).strict();

workspaceRouter.get("/overview", (_request, response) => {
  response.status(200).json({
    world: {
      id: "top",
      name: "TOP",
      subtitle: "A field for flourishing"
    },
    nodes: listWorkspaceNodes(),
    updatedAt: new Date().toISOString()
  });
});

workspaceRouter.get("/dashboard", (_request, response) => {
  response.status(200).json(getWorkspaceDashboard());
});

workspaceRouter.post("/projects", (request, response) => {
  const parsed = projectInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "A project needs a clear name, purpose, direction, and first next action." });
  }

  return response.status(201).json({ project: createProject(parsed.data) });
});

workspaceRouter.patch("/projects/:projectId", (request, response) => {
  const parsed = projectUpdateInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Write a specific next action before saving it." });
  }

  const project = updateProject(request.params.projectId, parsed.data);

  if (!project) return response.status(404).json({ error: "That project no longer exists in this field." });

  return response.status(200).json({ project });
});

workspaceRouter.post("/reflections", (request, response) => {
  const parsed = reflectionInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "Write at least a few words before saving your reflection." });
  }

  const reflection = saveReflection(parsed.data.answer);
  return response.status(201).json({
    reflection,
    message: "Reflection saved. Carry one thing you are proud of into tomorrow."
  });
});

workspaceRouter.post("/focus", (request, response) => {
  const parsed = focusInput.safeParse(request.body ?? {});

  if (!parsed.success) {
    return response.status(422).json({ error: "Choose a valid project before asking for focus." });
  }

  const focus = getFocus(parsed.data.projectId);

  if (!focus) return response.status(404).json({ error: "Begin a project before asking TOP to help you focus." });

  return response.status(200).json(focus);
});
