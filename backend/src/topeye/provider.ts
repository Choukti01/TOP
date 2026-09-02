import type { AppConfig } from "../config/env.js";
import type { TopEyeMessage, TopEyeMode } from "./contracts.js";

export interface TopEyeRuntimeStatus {
  configured: boolean;
  engine: "ollama" | "disabled";
  location: "local";
  model: string | null;
  requestedModel: string | null;
  installedModels: Array<{ name: string; sizeBytes: number | null }>;
  message: string;
}

export class TopEyeProviderError extends Error {
  public constructor(public readonly code: "not-configured" | "unavailable" | "upstream") {
    super(messageFor(code));
  }
}

type Fetcher = typeof fetch;

interface OllamaTag {
  name?: unknown;
  model?: unknown;
  size?: unknown;
}

interface OllamaTagsResponse {
  models?: unknown;
}

interface OllamaChatResponse {
  model?: unknown;
  message?: { content?: unknown };
}

/**
 * T0PEYE intentionally speaks only to a loopback Ollama server. This keeps
 * local experimentation private and makes a remote deployment opt in rather
 * than accidentally sending a user's work to an arbitrary endpoint.
 */
export class TopEyeProvider {
  private readonly fetcher: Fetcher;

  public constructor(
    private readonly config: Pick<AppConfig, "environment" | "topEyeEngine" | "ollamaBaseUrl" | "topEyeModel">,
    fetcher: Fetcher = fetch
  ) {
    this.fetcher = fetcher;
  }

  public get requestedModel(): string | null {
    return this.engine === "ollama" ? (this.config.topEyeModel?.trim() || "topeye-core") : null;
  }

  public get engine(): "ollama" | "disabled" {
    if (this.config.environment === "production") return "disabled";
    return this.config.topEyeEngine === "ollama" ? "ollama" : "disabled";
  }

  public async status(): Promise<TopEyeRuntimeStatus> {
    if (this.engine !== "ollama" || !this.requestedModel) {
      return {
        configured: false,
        engine: "disabled",
        location: "local",
        model: null,
        requestedModel: null,
        installedModels: [],
        message: "T0PEYE’s local engine runs only from a development copy of TOP on your own machine."
      };
    }

    try {
      const response = await this.fetcher(`${this.ollamaBaseUrl}/api/tags`, { signal: AbortSignal.timeout(4_000) });
      if (!response.ok) throw new Error("Ollama did not accept the model check.");
      const payload = await response.json() as OllamaTagsResponse;
      const installedModels = readModels(payload);
      const activeModel = installedModels.find((entry) => matchesModel(entry.name, this.requestedModel!)) ?? null;

      return {
        configured: Boolean(activeModel),
        engine: "ollama",
        location: "local",
        model: activeModel?.name ?? null,
        requestedModel: this.requestedModel,
        installedModels,
        message: activeModel
          ? "T0PEYE Core is running privately on this machine."
          : installedModels.length > 0
            ? `T0PEYE Core is not assembled yet. Build the ${this.requestedModel} profile from a local model.`
            : "Ollama is running, but no local model is installed yet."
      };
    } catch {
      return {
        configured: false,
        engine: "ollama",
        location: "local",
        model: null,
        requestedModel: this.requestedModel,
        installedModels: [],
        message: "TOP could not reach the local Ollama engine. Keep Ollama running on this machine, then try again."
      };
    }
  }

  public async respond(input: { mode: TopEyeMode; messages: TopEyeMessage[]; projectContext?: string | null }): Promise<{ content: string; model: string }> {
    const runtime = await this.status();
    if (runtime.engine !== "ollama") throw new TopEyeProviderError("not-configured");
    if (!runtime.configured || !runtime.model) throw new TopEyeProviderError("unavailable");

    let response: Response;
    try {
      response = await this.fetcher(`${this.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: runtime.model,
          stream: false,
          messages: [
            { role: "system", content: topEyeInstructions(input.mode, input.projectContext) },
            ...input.messages.slice(-14).map((message) => ({ role: message.role, content: message.content }))
          ],
          options: { temperature: temperatureFor(input.mode), num_ctx: 4096, num_predict: 900 }
        }),
        signal: AbortSignal.timeout(90_000)
      });
    } catch {
      throw new TopEyeProviderError("upstream");
    }

    if (!response.ok) throw new TopEyeProviderError("upstream");
    const payload = await response.json() as OllamaChatResponse;
    const content = typeof payload.message?.content === "string" ? payload.message.content.trim() : "";
    if (!content) throw new TopEyeProviderError("upstream");
    return { content, model: typeof payload.model === "string" ? payload.model : runtime.model };
  }

  private get ollamaBaseUrl(): string {
    return (this.config.ollamaBaseUrl ?? "http://127.0.0.1:11434").replace(/\/$/, "");
  }
}

function readModels(payload: OllamaTagsResponse): Array<{ name: string; sizeBytes: number | null }> {
  if (!Array.isArray(payload.models)) return [];
  return payload.models.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const entry = candidate as OllamaTag;
    const name = typeof entry.name === "string" ? entry.name : typeof entry.model === "string" ? entry.model : null;
    if (!name) return [];
    return [{ name, sizeBytes: typeof entry.size === "number" && Number.isFinite(entry.size) ? entry.size : null }];
  });
}

function matchesModel(installedName: string, requestedName: string): boolean {
  return installedName === requestedName || installedName === `${requestedName}:latest` || installedName.startsWith(`${requestedName}:`);
}

function temperatureFor(mode: TopEyeMode): number {
  return ({ chat: 0.55, plan: 0.32, code: 0.16, research: 0.2, create: 0.72 } satisfies Record<TopEyeMode, number>)[mode];
}

function messageFor(code: "not-configured" | "unavailable" | "upstream"): string {
  if (code === "not-configured") return "T0PEYE’s local engine is available only from a local development copy of TOP.";
  if (code === "unavailable") return "T0PEYE Core is not ready yet. Start Ollama and assemble the local model profile first.";
  return "T0PEYE’s local engine could not complete that response. Keep the request shorter and try again.";
}

function topEyeInstructions(mode: TopEyeMode, projectContext?: string | null): string {
  const modeInstruction: Record<TopEyeMode, string> = {
    chat: "Help the person think clearly, explain honestly, and leave them with one useful next move.",
    plan: "Turn ambiguity into an ordered plan with an outcome, constraints, milestones, risks, and a first action.",
    code: "Help design, explain, and write safe, maintainable code. State assumptions and give precise setup or test steps.",
    research: "Distinguish known facts from inference. Never invent sources. Suggest what must be verified.",
    create: "Help make a concrete draft, concept, document, or creative direction that the person can revise and own."
  };

  return [
    "You are T0PEYE Core, the private local intelligence engine inside TOP.",
    "TOP turns intention into real-world work. Protect attention, value craftsmanship, and favour clear action over endless consumption.",
    modeInstruction[mode],
    "Never claim you published, invited, contacted, deleted, purchased, deployed, accessed files, or changed anything outside this conversation.",
    "Do not invent research sources, project facts, private information, or capabilities you do not have.",
    "Offer structured artifacts when useful, but the person decides what becomes real.",
    projectContext ? `The person explicitly chose to share this private project context for this conversation:\n${projectContext}` : "No project context has been shared."
  ].join("\n\n");
}
