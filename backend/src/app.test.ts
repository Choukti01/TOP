import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "./app.js";

const app = buildApp({
  environment: "test",
  host: "127.0.0.1",
  port: 3000,
  webOrigin: "http://127.0.0.1:5188"
});

let createdProjectId = "";
let sessionCookie = "";

beforeAll(async () => {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({ email: "abdel@example.com", displayName: "Abdelouahed", password: "a-long-test-password" });

  expect(response.status).toBe(201);
  sessionCookie = response.headers["set-cookie"]?.[0]?.split(";")[0] ?? "";
});

describe("TOP API", () => {
  it("reports that the service is healthy", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: "ok",
      service: "top-api"
    });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
  });

  it("introduces the v1 API", async () => {
    const response = await request(app).get("/api/v1");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: "TOP API",
      version: "v1"
    });
  });

  it("provides the creator workspace overview", async () => {
    const response = await request(app).get("/api/v1/workspace/overview").set("Cookie", sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      world: { name: "TOP" }
    });
    expect(response.body.nodes).toHaveLength(0);
  });

  it("allows the Vue development server to request workspace data", async () => {
    const response = await request(app)
      .get("/api/v1/workspace/overview")
      .set("Cookie", sessionCookie)
      .set("Origin", "http://localhost:5188");

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5188");
  });

  it("provides workspace sections for the product navigation", async () => {
    const response = await request(app).get("/api/v1/workspace/dashboard").set("Cookie", sessionCookie);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ dailyFocus: null, projects: [], knowledge: [] });
  });

  it("validates and creates a real project", async () => {
    const invalidResponse = await request(app)
      .post("/api/v1/workspace/projects")
      .set("Cookie", sessionCookie)
      .send({ title: "No", purpose: "Too short", direction: "personal", nextAction: "No" });

    expect(invalidResponse.status).toBe(422);

    const response = await request(app)
      .post("/api/v1/workspace/projects")
      .set("Cookie", sessionCookie)
      .send({
        title: "Repair circle",
        purpose: "Bring neighbours together to repair useful things before replacing them.",
        direction: "community",
        nextAction: "Invite two neighbours to a short planning conversation."
      });

    expect(response.status).toBe(201);
    expect(response.body.project).toMatchObject({
      title: "Repair circle",
      kind: "project",
      direction: "community"
    });
    createdProjectId = response.body.project.id;
  });

  it("keeps the field arrangement and project state intentional", async () => {
    const position = await request(app)
      .patch(`/api/v1/workspace/projects/${createdProjectId}/field-position`)
      .set("Cookie", sessionCookie)
      .send({ x: 248, y: -136 });

    expect(position.status).toBe(200);
    expect(position.body.project).toMatchObject({ x: 248, y: -136 });

    const paused = await request(app)
      .patch(`/api/v1/workspace/projects/${createdProjectId}`)
      .set("Cookie", sessionCookie)
      .send({ status: "paused" });

    expect(paused.status).toBe(200);
    expect(paused.body.project.status).toBe("paused");
  });

  it("saves reflections and returns a focus suggestion", async () => {
    const reflection = await request(app)
      .post("/api/v1/workspace/reflections")
      .set("Cookie", sessionCookie)
      .send({ answer: "I moved the first project brief from an idea into a real conversation." });

    expect(reflection.status).toBe(201);
    expect(reflection.body.message).toContain("Reflection saved");

    const focus = await request(app).post("/api/v1/workspace/focus").set("Cookie", sessionCookie).send({ projectId: createdProjectId });

    expect(focus.status).toBe(200);
    expect(focus.body).toMatchObject({ projectId: createdProjectId });
  });

  it("keeps a project trail of milestones and evidence", async () => {
    const milestone = await request(app)
      .post(`/api/v1/workspace/projects/${createdProjectId}/milestones`)
      .set("Cookie", sessionCookie)
      .send({ title: "Hold the first repair circle" });

    expect(milestone.status).toBe(201);
    expect(milestone.body.milestone).toMatchObject({ status: "planned" });

    const completedMilestone = await request(app)
      .patch(`/api/v1/workspace/projects/${createdProjectId}/milestones/${milestone.body.milestone.id}`)
      .set("Cookie", sessionCookie)
      .send({ status: "completed" });

    expect(completedMilestone.status).toBe(200);
    expect(completedMilestone.body.milestone.status).toBe("completed");

    const artifact = await request(app)
      .post(`/api/v1/workspace/projects/${createdProjectId}/artifacts`)
      .set("Cookie", sessionCookie)
      .send({ title: "Repair circle invitation", kind: "note", note: "Shared with two neighbours." });

    expect(artifact.status).toBe(201);

    const detail = await request(app).get(`/api/v1/workspace/projects/${createdProjectId}`).set("Cookie", sessionCookie);

    expect(detail.status).toBe(200);
    expect(detail.body.project.progress).toBe(100);
    expect(detail.body.milestones).toHaveLength(1);
    expect(detail.body.artifacts).toHaveLength(1);
    expect(detail.body.activity.map((activity: { type: string }) => activity.type)).toEqual(expect.arrayContaining([
      "project-started",
      "milestone-added",
      "milestone-completed",
      "artifact-recorded"
    ]));
  });

  it("protects every field and keeps it personal", async () => {
    const anonymous = await request(app).get("/api/v1/workspace/dashboard");
    expect(anonymous.status).toBe(401);

    const secondPerson = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "another@example.com", displayName: "Another person", password: "another-long-password" });
    const secondCookie = secondPerson.headers["set-cookie"]?.[0]?.split(";")[0] ?? "";
    const isolatedDashboard = await request(app).get("/api/v1/workspace/dashboard").set("Cookie", secondCookie);

    expect(isolatedDashboard.status).toBe(200);
    expect(isolatedDashboard.body.projects).toEqual([]);
  });

  it("keeps sessions private and allows a profile to be refined", async () => {
    const session = await request(app).get("/api/v1/auth/session").set("Cookie", sessionCookie);
    expect(session.status).toBe(200);
    expect(session.body.user).toMatchObject({ email: "abdel@example.com", displayName: "Abdelouahed" });

    const profile = await request(app)
      .patch("/api/v1/auth/profile")
      .set("Cookie", sessionCookie)
      .send({ biography: "Building useful things with care.", location: "TOP field" });
    expect(profile.status).toBe(200);
    expect(profile.body.user.biography).toBe("Building useful things with care.");
  });

  it("gives each person a truthful dashboard of their own work", async () => {
    const dashboard = await request(app).get("/api/v1/workspace/profile-dashboard").set("Cookie", sessionCookie);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.summary).toMatchObject({ projectCount: 1, completedMilestoneCount: 1, evidenceCount: 1 });
    expect(dashboard.body.openActions).toHaveLength(1);
    expect(dashboard.body.recentActivity).toHaveLength(4);
  });
});
