import { describe, expect, it, vi } from "vitest";

import { TopEyeProvider } from "./provider.js";

const localConfig = {
  environment: "development" as const,
  topEyeEngine: "ollama" as const,
  ollamaBaseUrl: "http://127.0.0.1:11434",
  topEyeModel: "topeye-core"
};

describe("TopEyeProvider", () => {
  it("finds the local profile and sends replies only to the loopback Ollama API", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ name: "topeye-core:latest", size: 1024 }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ name: "topeye-core:latest", size: 1024 }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ model: "topeye-core:latest", message: { content: "Start with the first honest action." } }), { status: 200 }));
    const provider = new TopEyeProvider(localConfig, fetcher);

    await expect(provider.status()).resolves.toMatchObject({ configured: true, engine: "ollama", model: "topeye-core:latest" });
    await expect(provider.respond({
      mode: "plan",
      messages: [{ id: "message-1", threadId: "thread-1", role: "user", content: "Help me begin TOP.", model: null, createdAt: "2026-01-01T00:00:00.000Z" }]
    })).resolves.toEqual({ content: "Start with the first honest action.", model: "topeye-core:latest" });

    expect(fetcher).toHaveBeenLastCalledWith("http://127.0.0.1:11434/api/chat", expect.objectContaining({ method: "POST" }));
  });

  it("never enables the local runtime in production", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const provider = new TopEyeProvider({ ...localConfig, environment: "production" }, fetcher);

    await expect(provider.status()).resolves.toMatchObject({ configured: false, engine: "disabled", location: "local" });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
