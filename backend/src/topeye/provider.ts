import type { AppConfig } from "../config/env.js";
import type { TopEyeMessage, TopEyeMode } from "./contracts.js";

export class TopEyeProviderError extends Error {
  public constructor(public readonly code: "not-configured" | "upstream") {
    super(code === "not-configured" ? "T0PEYE is not connected to a model provider yet." : "T0PEYE could not complete that response right now.");
  }
}

export class TopEyeProvider {
  public constructor(private readonly config: Pick<AppConfig, "openAiApiKey" | "topEyeModel">) {}

  public get enabled(): boolean {
    return Boolean(this.config.openAiApiKey);
  }

  public get model(): string | null {
    return this.enabled ? (this.config.topEyeModel?.trim() || "gpt-5-mini") : null;
  }

  public async respond(input: { mode: TopEyeMode; messages: TopEyeMessage[]; projectContext?: string | null }): Promise<{ content: string; model: string }> {
    if (!this.config.openAiApiKey || !this.model) throw new TopEyeProviderError("not-configured");

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.openAiApiKey}`,
          "Content-Type": "application/json"
        },
        // Store conversation history in TOP, not implicitly with the provider.
        body: JSON.stringify({
          model: this.model,
          store: false,
          instructions: topEyeInstructions(input.mode, input.projectContext),
          input: input.messages.slice(-20).map((message) => ({ role: message.role, content: message.content }))
        }),
        signal: AbortSignal.timeout(60_000)
      });
    } catch {
      throw new TopEyeProviderError("upstream");
    }

    if (!response.ok) throw new TopEyeProviderError("upstream");

    const payload = await response.json() as { output_text?: unknown; output?: Array<{ content?: Array<{ type?: unknown; text?: unknown }> }> };
    const content = responseText(payload);
    if (!content) throw new TopEyeProviderError("upstream");
    return { content, model: this.model };
  }
}

function responseText(payload: { output_text?: unknown; output?: Array<{ content?: Array<{ type?: unknown; text?: unknown }> }> }): string | null {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text.trim();
  const parts = payload.output
    ?.flatMap((output) => output.content ?? [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text as string) ?? [];
  const text = parts.join("\n").trim();
  return text || null;
}

function topEyeInstructions(mode: TopEyeMode, projectContext?: string | null): string {
  const modeInstruction: Record<TopEyeMode, string> = {
    chat: "Help the person think clearly, explain honestly, and leave them with a useful next move.",
    plan: "Turn ambiguity into an ordered plan with a clear outcome, constraints, milestones, risks, and a first action.",
    code: "Help design, explain, and write safe, maintainable code. State assumptions and give precise setup or test steps.",
    research: "Distinguish known facts from inference. Ask for sources or recommend verification when you cannot verify a claim.",
    create: "Help make a concrete draft, concept, document, or creative direction that the person can revise and own."
  };

  return [
    "You are T0PEYE, the creative intelligence inside TOP.",
    "TOP exists to help people turn intention into real-world work, not to maximize time on a screen.",
    modeInstruction[mode],
    "Never claim that you published, invited, contacted, deleted, purchased, deployed, or changed anything outside this conversation.",
    "Do not invent research sources, project facts, or private information. Be direct about uncertainty.",
    "Offer structured artifacts when helpful, but keep the person in control of every consequential action.",
    projectContext ? `The person explicitly chose to share this private project context for this conversation:\n${projectContext}` : "No project context has been shared."
  ].join("\n\n");
}
