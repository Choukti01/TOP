import { Router } from "express";
import { z } from "zod";

import { AuthService } from "../auth/service.js";
import type { AppConfig } from "../config/env.js";
import { createRateLimit } from "../security/rateLimit.js";
import { topEyeArtifactKinds, topEyeModes } from "../topeye/contracts.js";
import { TopEyeProvider, TopEyeProviderError } from "../topeye/provider.js";
import { createTopEyeRepository } from "../topeye/repository.js";
import { currentUser, requireVerifiedUser } from "./auth.js";

const threadInput = z.object({
  title: z.string().trim().min(2).max(140),
  mode: z.enum(topEyeModes),
  projectId: z.string().uuid().nullable().optional()
}).strict();

const messageInput = z.object({ content: z.string().trim().min(1).max(12_000) }).strict();
const threadProjectInput = z.object({ projectId: z.string().uuid().nullable() }).strict();
const artifactInput = z.object({
  threadId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  kind: z.enum(topEyeArtifactKinds),
  title: z.string().trim().min(2).max(140),
  content: z.string().trim().min(1).max(30_000)
}).strict();

export function createTopEyeRouter(auth: AuthService, config: Pick<AppConfig, "databaseUrl" | "databaseEnabled" | "environment" | "topEyeEngine" | "ollamaBaseUrl" | "topEyeModel">): Router {
  const router = Router();
  const repository = createTopEyeRepository(config);
  const provider = new TopEyeProvider(config);
  const generationLimit = createRateLimit({ scope: "topeye-generation", limit: 40, windowMs: 60 * 60 * 1000 });
  const writingLimit = createRateLimit({ scope: "topeye-writing", limit: 100, windowMs: 60 * 60 * 1000 });

  router.use(requireVerifiedUser(auth));

  router.get("/status", async (_request, response) => {
    const runtime = await provider.status();
    response.status(200).json({
      configured: runtime.configured,
      model: runtime.model,
      runtime,
      capabilities: { conversation: runtime.configured, artifacts: true, projectContext: true, uploads: false, tools: false }
    });
  });

  router.get("/threads", async (_request, response) => {
    response.status(200).json({ threads: await repository.listThreads(currentUser(response).id) });
  });

  router.post("/threads", writingLimit, async (request, response) => {
    const parsed = threadInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Give this T0PEYE space a clear name and mode." });
    const thread = await repository.createThread(currentUser(response).id, parsed.data);
    if (!thread) return response.status(404).json({ error: "That project is not available for this private T0PEYE space." });
    return response.status(201).json({ thread });
  });

  router.get("/threads/:threadId", async (request, response) => {
    const thread = await repository.getThread(currentUser(response).id, routeParam(request.params.threadId));
    if (!thread) return response.status(404).json({ error: "That T0PEYE conversation is not available." });
    return response.status(200).json({ thread });
  });

  router.patch("/threads/:threadId", writingLimit, async (request, response) => {
    const parsed = threadProjectInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose a project or keep this T0PEYE space private." });
    const thread = await repository.updateThreadProject(currentUser(response).id, routeParam(request.params.threadId), parsed.data.projectId);
    if (!thread) return response.status(409).json({ error: "Project context can only be chosen before the first message, and only from a project you can access." });
    return response.status(200).json({ thread });
  });

  router.delete("/threads/:threadId", async (request, response) => {
    const deleted = await repository.deleteThread(currentUser(response).id, routeParam(request.params.threadId));
    if (!deleted) return response.status(404).json({ error: "That T0PEYE conversation is not available." });
    return response.status(204).end();
  });

  router.post("/threads/:threadId/messages", generationLimit, async (request, response) => {
    const parsed = messageInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Write a clear thought for T0PEYE to work with." });
    const thread = await repository.getThread(currentUser(response).id, routeParam(request.params.threadId));
    if (!thread) return response.status(404).json({ error: "That T0PEYE conversation is not available." });
    try {
      const projectContext = thread.projectId ? await repository.getProjectContext(currentUser(response).id, thread.projectId) : null;
      const completion = await provider.respond({
        mode: thread.mode,
        messages: [...thread.messages, { id: "pending", threadId: thread.id, role: "user", content: parsed.data.content, model: null, createdAt: new Date().toISOString() }],
        projectContext
      });
      const userMessage = await repository.appendMessage(currentUser(response).id, thread.id, { role: "user", content: parsed.data.content });
      const assistantMessage = await repository.appendMessage(currentUser(response).id, thread.id, { role: "assistant", content: completion.content, model: completion.model });
      if (!userMessage || !assistantMessage) return response.status(404).json({ error: "That T0PEYE conversation is no longer available." });
      return response.status(201).json({ userMessage, assistantMessage });
    } catch (error) {
      if (error instanceof TopEyeProviderError) return response.status(error.code === "upstream" ? 502 : 503).json({ error: error.message });
      throw error;
    }
  });

  router.get("/artifacts", async (_request, response) => {
    response.status(200).json({ artifacts: await repository.listArtifacts(currentUser(response).id) });
  });

  router.post("/artifacts", writingLimit, async (request, response) => {
    const parsed = artifactInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Give this T0PEYE artifact a title, kind, and meaningful content." });
    const artifact = await repository.createArtifact(currentUser(response).id, parsed.data);
    if (!artifact) return response.status(404).json({ error: "That conversation or project is not available for this private artifact." });
    return response.status(201).json({ artifact });
  });

  return router;
}

function routeParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
