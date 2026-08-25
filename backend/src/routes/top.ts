import { Router } from "express";
import { z } from "zod";

import type { AppConfig } from "../config/env.js";
import { createPublicRepository } from "../public/repository.js";
import { AuthService } from "../auth/service.js";
import { currentUser, requireAuthenticatedUser } from "./auth.js";
import { notificationHub } from "../realtime/notificationHub.js";

const postInput = z.object({
  kind: z.enum(["idea", "signal", "offer", "question", "negotiation", "request", "resource", "milestone", "event", "collaboration"]),
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(3).max(2_000)
}).strict();

const reactionInput = z.object({ reaction: z.enum(["spark", "build", "help", "question", "respect"]) }).strict();
const commentInput = z.object({ body: z.string().trim().min(1).max(1_000) }).strict();
const responseInput = z.object({ response: z.enum(["accepted", "declined"]) }).strict();
const searchInput = z.string().trim().min(2).max(80);
const directMessageInput = z.object({ body: z.string().trim().min(1).max(2_000) }).strict();

export function createTopRouter(auth: AuthService, config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): Router {
  const router = Router();
  const publicTop = createPublicRepository(config);
  router.use(requireAuthenticatedUser(auth));

  router.get("/events", (request, response) => {
    response.status(200);
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();
    const unsubscribe = notificationHub.subscribe(currentUser(response).id, response);
    const heartbeat = setInterval(() => response.write(": keepalive\n\n"), 25_000);
    request.on("close", () => { clearInterval(heartbeat); unsubscribe(); });
  });

  router.get("/feed", async (_request, response) => {
    response.status(200).json({ posts: await publicTop.getFeed(currentUser(response).id) });
  });

  router.get("/search", async (request, response) => {
    const parsed = searchInput.safeParse(request.query.q);
    if (!parsed.success) return response.status(422).json({ error: "Search with at least two clear characters." });
    return response.status(200).json(await publicTop.search(currentUser(response).id, parsed.data));
  });

  router.post("/posts", async (request, response) => {
    const parsed = postInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Share a clear kind of signal, a title, and a thoughtful body." });
    return response.status(201).json({ post: await publicTop.createPost(currentUser(response).id, parsed.data) });
  });

  router.post("/posts/:postId/reactions", async (request, response) => {
    const parsed = reactionInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose a meaningful response to this signal." });
    const post = await publicTop.reactToPost(currentUser(response).id, request.params.postId, parsed.data.reaction);
    if (!post) return response.status(404).json({ error: "That shared signal is no longer available." });
    return response.status(200).json({ post });
  });

  router.post("/posts/:postId/comments", async (request, response) => {
    const parsed = commentInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Write a real response before adding it." });
    const comment = await publicTop.addComment(currentUser(response).id, request.params.postId, parsed.data.body);
    if (!comment) return response.status(404).json({ error: "That shared signal is no longer available." });
    return response.status(201).json({ comment });
  });

  router.get("/people/:personId", async (request, response) => {
    const profile = await publicTop.getProfile(currentUser(response).id, request.params.personId);
    if (!profile) return response.status(404).json({ error: "That public TOP profile could not be found." });
    return response.status(200).json({ profile });
  });

  router.post("/people/:personId/connect", async (request, response) => {
    const sent = await publicTop.createConnectionRequest(currentUser(response).id, request.params.personId);
    if (!sent) return response.status(409).json({ error: "A connection already exists, is waiting, or cannot be created for this profile." });
    return response.status(201).json({ message: "Connection invitation sent to their private Signals panel." });
  });

  router.get("/connection-requests", async (_request, response) => {
    response.status(200).json({ requests: await publicTop.getIncomingConnectionRequests(currentUser(response).id) });
  });

  router.post("/connection-requests/:requestId/respond", async (request, response) => {
    const parsed = responseInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose whether to accept or decline this connection." });
    const changed = await publicTop.respondToConnectionRequest(currentUser(response).id, request.params.requestId, parsed.data.response);
    if (!changed) return response.status(404).json({ error: "That connection invitation is no longer available." });
    return response.status(200).json({ message: parsed.data.response === "accepted" ? "Connection accepted. Keep it human." : "Connection declined. Your field remains yours." });
  });

  router.get("/messages", async (_request, response) => {
    response.status(200).json({ conversations: await publicTop.listDirectConversations(currentUser(response).id) });
  });

  router.get("/messages/:personId", async (request, response) => {
    const messages = await publicTop.getDirectMessages(currentUser(response).id, request.params.personId);
    if (!messages) return response.status(403).json({ error: "Direct messages are available only after both people accept a connection." });
    return response.status(200).json({ messages });
  });

  router.post("/messages/:personId", async (request, response) => {
    const parsed = directMessageInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Write a real message before sending it." });
    const message = await publicTop.sendDirectMessage(currentUser(response).id, request.params.personId, parsed.data.body);
    if (!message) return response.status(403).json({ error: "Direct messages are available only after both people accept a connection." });
    return response.status(201).json({ message });
  });

  return router;
}
