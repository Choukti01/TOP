import { Router } from "express";
import { z } from "zod";

import type { AppConfig } from "../config/env.js";
import { createPublicRepository } from "../public/repository.js";
import { AuthService } from "../auth/service.js";
import { currentUser, requireVerifiedUser } from "./auth.js";
import { notificationHub } from "../realtime/notificationHub.js";
import { createRateLimit } from "../security/rateLimit.js";

const postInput = z.object({
  kind: z.enum(["idea", "signal", "offer", "question", "negotiation", "request", "resource", "milestone", "event", "collaboration"]),
  title: z.string().trim().min(3).max(140),
  body: z.string().trim().min(3).max(2_000)
}).strict();

const reactionInput = z.object({ reaction: z.enum(["spark", "build", "help", "question", "respect"]) }).strict();
const commentInput = z.object({ body: z.string().trim().min(1).max(1_000), parentCommentId: z.string().uuid().nullable().optional() }).strict();
const commentUpdateInput = z.object({ body: z.string().trim().min(1).max(1_000) }).strict();
const responseInput = z.object({ response: z.enum(["accepted", "declined"]) }).strict();
const searchInput = z.string().trim().min(2).max(80);
const directMessageInput = z.object({ body: z.string().trim().min(1).max(2_000) }).strict();
const projectDirection = z.enum(["personal", "creative", "learning", "community", "venture", "other"]);
const projectCircleInput = z.object({ direction: projectDirection, nextAction: z.string().trim().min(3).max(180), firstMilestone: z.string().trim().min(3).max(160) }).strict();
const signalOfferInput = z.object({ kind: z.enum(["help", "skill", "collaboration"]), note: z.string().trim().min(3).max(600) }).strict();
const signalOfferResponseInput = z.object({ response: z.enum(["accepted", "declined"]), role: z.enum(["contributor", "mentor"]).default("contributor") }).strict();
const safetyReportInput = z.object({
  targetType: z.enum(["person", "post", "comment", "message"]),
  targetId: z.string().uuid(),
  reason: z.enum(["spam", "harassment", "hate", "sexual-content", "privacy", "self-harm", "other"]),
  note: z.string().trim().max(800).nullable().optional()
}).strict();

export function createTopRouter(auth: AuthService, config: Pick<AppConfig, "databaseUrl" | "databaseEnabled">): Router {
  const router = Router();
  const publicTop = createPublicRepository(config);
  // These limits preserve room for deliberate human activity while making it
  // expensive to automate spam, harassment, or report flooding. They are
  // intentionally separate from the account limits in the auth router.
  const publishLimit = createRateLimit({ scope: "top-publish", limit: 20, windowMs: 60 * 60 * 1000 });
  const responseLimit = createRateLimit({ scope: "top-response", limit: 50, windowMs: 60 * 60 * 1000 });
  const contactLimit = createRateLimit({ scope: "top-contact", limit: 25, windowMs: 60 * 60 * 1000 });
  const messageLimit = createRateLimit({ scope: "top-message", limit: 60, windowMs: 60 * 60 * 1000 });
  const safetyLimit = createRateLimit({ scope: "top-safety", limit: 12, windowMs: 24 * 60 * 60 * 1000 });
  router.use(requireVerifiedUser(auth));

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

  router.post("/posts", publishLimit, async (request, response) => {
    const parsed = postInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Share a clear kind of signal, a title, and a thoughtful body." });
    return response.status(201).json({ post: await publicTop.createPost(currentUser(response).id, parsed.data) });
  });

  router.get("/posts/:postId", async (request, response) => {
    const post = await publicTop.getPost(currentUser(response).id, request.params.postId);
    if (!post) return response.status(404).json({ error: "That shared signal is no longer available." });
    return response.status(200).json({ post });
  });

  router.patch("/posts/:postId", async (request, response) => {
    const parsed = postInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Keep the signal clear: choose its kind, title, and useful details." });
    const post = await publicTop.updatePost(currentUser(response).id, request.params.postId, parsed.data);
    if (!post) return response.status(404).json({ error: "That signal cannot be changed. Only its author can edit it." });
    return response.status(200).json({ post });
  });

  router.delete("/posts/:postId", async (request, response) => {
    const deleted = await publicTop.deletePost(currentUser(response).id, request.params.postId);
    if (!deleted) return response.status(404).json({ error: "That signal cannot be removed. Only its author can delete it." });
    return response.status(204).send();
  });

  router.post("/posts/:postId/reactions", responseLimit, async (request, response) => {
    const parsed = reactionInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose a meaningful response to this signal." });
    const post = await publicTop.reactToPost(currentUser(response).id, routeParam(request.params.postId), parsed.data.reaction);
    if (!post) return response.status(404).json({ error: "That shared signal is no longer available." });
    return response.status(200).json({ post });
  });

  router.post("/posts/:postId/comments", responseLimit, async (request, response) => {
    const parsed = commentInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Write a real response before adding it." });
    const comment = await publicTop.addComment(currentUser(response).id, routeParam(request.params.postId), { body: parsed.data.body, parentCommentId: parsed.data.parentCommentId ?? null });
    if (!comment) return response.status(404).json({ error: "That shared signal or the response you chose is no longer available." });
    return response.status(201).json({ comment });
  });

  router.patch("/posts/:postId/comments/:commentId", async (request, response) => {
    const parsed = commentUpdateInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Write a real response before saving it." });
    const comment = await publicTop.updateComment(currentUser(response).id, request.params.postId, request.params.commentId, parsed.data.body);
    if (!comment) return response.status(404).json({ error: "That response cannot be changed. Only its author can edit it." });
    return response.status(200).json({ comment });
  });

  router.delete("/posts/:postId/comments/:commentId", async (request, response) => {
    const deleted = await publicTop.deleteComment(currentUser(response).id, request.params.postId, request.params.commentId);
    if (!deleted) return response.status(404).json({ error: "That response cannot be removed. Only its author can delete it." });
    return response.status(204).send();
  });

  router.post("/posts/:postId/seed", publishLimit, async (request, response) => {
    const result = await publicTop.createSeedFromPost(currentUser(response).id, routeParam(request.params.postId));
    if (!result) return response.status(404).json({ error: "That public signal is no longer available." });
    return response.status(201).json(result);
  });

  router.post("/posts/:postId/project-circle", publishLimit, async (request, response) => {
    const parsed = projectCircleInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Name one next action and one first milestone before opening a project circle." });
    const result = await publicTop.startProjectCircle(currentUser(response).id, routeParam(request.params.postId), parsed.data);
    if (!result) return response.status(403).json({ error: "Only the person who shared this signal can open its project circle." });
    return response.status(201).json(result);
  });

  router.post("/posts/:postId/offers", contactLimit, async (request, response) => {
    const parsed = signalOfferInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose how you can help and leave a useful note." });
    const post = await publicTop.createSignalOffer(currentUser(response).id, routeParam(request.params.postId), parsed.data);
    if (!post) return response.status(403).json({ error: "You can offer help to another person's signal, not your own." });
    return response.status(201).json({ post });
  });

  router.get("/people/:personId", async (request, response) => {
    const profile = await publicTop.getProfile(currentUser(response).id, request.params.personId);
    if (!profile) return response.status(404).json({ error: "That public TOP profile could not be found." });
    return response.status(200).json({ profile });
  });

  router.post("/people/:personId/connect", contactLimit, async (request, response) => {
    const sent = await publicTop.createConnectionRequest(currentUser(response).id, routeParam(request.params.personId));
    if (!sent) return response.status(409).json({ error: "A connection already exists, is waiting, or cannot be created for this profile." });
    return response.status(201).json({ message: "Connection invitation sent to their private Signals panel." });
  });

  router.post("/people/:personId/block", safetyLimit, async (request, response) => {
    const person = await publicTop.blockPerson(currentUser(response).id, routeParam(request.params.personId));
    if (!person) return response.status(422).json({ error: "You cannot block this profile." });
    return response.status(201).json({ person, message: "This person is now blocked. Their public signals and private contact are hidden." });
  });

  router.delete("/people/:personId/block", safetyLimit, async (request, response) => {
    const changed = await publicTop.unblockPerson(currentUser(response).id, routeParam(request.params.personId));
    if (!changed) return response.status(404).json({ error: "This person is not in your blocked list." });
    return response.status(204).send();
  });

  router.get("/blocked", async (_request, response) => {
    return response.status(200).json({ people: await publicTop.listBlockedPeople(currentUser(response).id) });
  });

  router.post("/reports", safetyLimit, async (request, response) => {
    const parsed = safetyReportInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose what happened and include only the details that help us review it." });
    const recorded = await publicTop.createSafetyReport(currentUser(response).id, { ...parsed.data, note: parsed.data.note ?? null });
    if (!recorded) return response.status(404).json({ error: "That item is no longer available to report." });
    return response.status(202).json({ message: "Your report was received. TOP will review it with care." });
  });

  router.get("/connection-requests", async (_request, response) => {
    response.status(200).json({ requests: await publicTop.getIncomingConnectionRequests(currentUser(response).id) });
  });

  router.post("/connection-requests/:requestId/respond", contactLimit, async (request, response) => {
    const parsed = responseInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose whether to accept or decline this connection." });
    const changed = await publicTop.respondToConnectionRequest(currentUser(response).id, routeParam(request.params.requestId), parsed.data.response);
    if (!changed) return response.status(404).json({ error: "That connection invitation is no longer available." });
    return response.status(200).json({ message: parsed.data.response === "accepted" ? "Connection accepted. Keep it human." : "Connection declined. Your field remains yours." });
  });

  router.get("/signal-offers", async (_request, response) => {
    response.status(200).json({ offers: await publicTop.getIncomingSignalOffers(currentUser(response).id) });
  });

  router.post("/signal-offers/:offerId/respond", contactLimit, async (request, response) => {
    const parsed = signalOfferResponseInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Choose whether this offer belongs in your project circle." });
    const result = await publicTop.respondToSignalOffer(currentUser(response).id, routeParam(request.params.offerId), parsed.data.response, parsed.data.role);
    if (!result) return response.status(404).json({ error: "That offer is no longer waiting for your decision." });
    if (parsed.data.response === "accepted" && !result.projectId) return response.status(409).json({ error: "Open a project circle for this signal before welcoming someone into it." });
    return response.status(200).json({ message: parsed.data.response === "accepted" ? "Offer welcomed into your project circle." : "Offer closed. Your Field remains intentional.", projectId: result.projectId });
  });

  router.get("/messages", async (_request, response) => {
    response.status(200).json({ conversations: await publicTop.listDirectConversations(currentUser(response).id) });
  });

  router.get("/messages/:personId", async (request, response) => {
    const messages = await publicTop.getDirectMessages(currentUser(response).id, request.params.personId);
    if (!messages) return response.status(403).json({ error: "Direct messages are available only after both people accept a connection." });
    return response.status(200).json({ messages });
  });

  router.post("/messages/:personId", messageLimit, async (request, response) => {
    const parsed = directMessageInput.safeParse(request.body);
    if (!parsed.success) return response.status(422).json({ error: "Write a real message before sending it." });
    const message = await publicTop.sendDirectMessage(currentUser(response).id, routeParam(request.params.personId), parsed.data.body);
    if (!message) return response.status(403).json({ error: "Direct messages are available only after both people accept a connection." });
    return response.status(201).json({ message });
  });

  return router;
}

function routeParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
