import request from "supertest";
import { describe, expect, it } from "vitest";

import { buildApp } from "./app.js";

const app = buildApp({
  environment: "test",
  host: "127.0.0.1",
  port: 3000,
  webOrigin: "http://127.0.0.1:5188"
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
    const response = await request(app).get("/api/v1/workspace/overview");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      world: { name: "TOP" }
    });
    expect(response.body.nodes).toHaveLength(4);
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
    expect(response.body).toMatchObject({
      dailyFocus: { title: expect.any(String) },
      projects: expect.any(Array),
      knowledge: expect.any(Array)
    });
  });

  it("validates and plants a Seed", async () => {
    const invalidResponse = await request(app)
      .post("/api/v1/workspace/seeds")
      .send({ title: "No", description: "Too short" });

    expect(invalidResponse.status).toBe(422);

    const response = await request(app)
      .post("/api/v1/workspace/seeds")
      .send({
        title: "Repair circle",
        description: "Bring neighbours together to repair useful things before replacing them."
      });

    expect(response.status).toBe(201);
    expect(response.body.seed).toMatchObject({
      title: "Repair circle",
      kind: "seed"
    });
  });

  it("saves reflections and returns a focus suggestion", async () => {
    const reflection = await request(app)
      .post("/api/v1/workspace/reflections")
      .send({ answer: "I moved the first project brief from an idea into a real conversation." });

    expect(reflection.status).toBe(201);
    expect(reflection.body.message).toContain("Reflection saved");

    const focus = await request(app).post("/api/v1/workspace/focus").send({ projectId: "deutschio" });

    expect(focus.status).toBe(200);
    expect(focus.body).toMatchObject({ projectId: "deutschio" });
  });
});
