import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";

const app = buildApp({
  environment: "test",
  host: "127.0.0.1",
  port: 3000,
  webOrigin: "http://127.0.0.1:5188"
});

let createdProjectId = "";

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
    const response = await request(app).get("/api/v1/workspace/overview");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      world: { name: "TOP" }
    });
    expect(response.body.nodes).toHaveLength(0);
  });

  it("allows the Vue development server to request workspace data", async () => {
    const response = await request(app)
      .get("/api/v1/workspace/overview")
      .set("Origin", "http://localhost:5188");

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5188");
  });

  it("provides workspace sections for the product navigation", async () => {
    const response = await request(app).get("/api/v1/workspace/dashboard");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ dailyFocus: null, projects: [], knowledge: [] });
  });

  it("validates and creates a real project", async () => {
    const invalidResponse = await request(app)
      .post("/api/v1/workspace/projects")
      .send({ title: "No", purpose: "Too short", direction: "personal", nextAction: "No" });

    expect(invalidResponse.status).toBe(422);

    const response = await request(app)
      .post("/api/v1/workspace/projects")
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

  it("saves reflections and returns a focus suggestion", async () => {
    const reflection = await request(app)
      .post("/api/v1/workspace/reflections")
      .send({ answer: "I moved the first project brief from an idea into a real conversation." });

    expect(reflection.status).toBe(201);
    expect(reflection.body.message).toContain("Reflection saved");

    const focus = await request(app).post("/api/v1/workspace/focus").send({ projectId: createdProjectId });

    expect(focus.status).toBe(200);
    expect(focus.body).toMatchObject({ projectId: createdProjectId });
  });
});
