import { Router } from "express";
import { z } from "zod";

import {
  createSeed,
  getFocus,
  getWorkspaceDashboard,
  listWorkspaceNodes,
  saveReflection
} from "../workspace/store.js";

export const workspaceRouter = Router();

const seedInput = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().min(12).max(280)
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
      subtitle: "Creator OS"
    },
    nodes: listWorkspaceNodes(),
    updatedAt: new Date().toISOString()
  });
});

workspaceRouter.get("/dashboard", (_request, response) => {
  response.status(200).json(getWorkspaceDashboard());
});

workspaceRouter.post("/seeds", (request, response) => {
  const parsed = seedInput.safeParse(request.body);

  if (!parsed.success) {
    return response.status(422).json({ error: "A Seed needs a clear title and a short description." });
  }

  return response.status(201).json({ seed: createSeed(parsed.data) });
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

  return response.status(200).json(getFocus(parsed.data.projectId));
});
