export const topEyeModes = ["chat", "plan", "code", "research", "create"] as const;
export type TopEyeMode = typeof topEyeModes[number];

export const topEyeArtifactKinds = ["note", "plan", "code", "research", "document", "design"] as const;
export type TopEyeArtifactKind = typeof topEyeArtifactKinds[number];

export type TopEyeMessageRole = "user" | "assistant";

export interface TopEyeThread {
  id: string;
  title: string;
  mode: TopEyeMode;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopEyeMessage {
  id: string;
  threadId: string;
  role: TopEyeMessageRole;
  content: string;
  model: string | null;
  createdAt: string;
}

export interface TopEyeThreadDetail extends TopEyeThread {
  messages: TopEyeMessage[];
}

export interface TopEyeArtifact {
  id: string;
  threadId: string | null;
  projectId: string | null;
  kind: TopEyeArtifactKind;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
