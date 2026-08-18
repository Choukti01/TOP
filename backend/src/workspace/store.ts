export type WorkspaceNodeKind = "world" | "venture" | "studio" | "learning" | "seed";
export type WorkspaceNodeStatus = "active" | "growing" | "planning";

export interface WorkspaceNodeRecord {
  id: string;
  title: string;
  description: string;
  kind: WorkspaceNodeKind;
  status: WorkspaceNodeStatus;
  progress: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProjectBrief {
  id: string;
  title: string;
  category: string;
  nextMove: string;
  signal: string;
  momentum: number;
}

const coreNodes: WorkspaceNodeRecord[] = [
  {
    id: "top",
    title: "TOP",
    description: "The creator universe where your ideas become real-world projects.",
    kind: "world",
    status: "active",
    progress: 82,
    color: "#70b8ff",
    x: -25,
    y: -35,
    width: 250,
    height: 120
  },
  {
    id: "rifkando",
    title: "rifKANDO",
    description: "A multi-service platform connecting people to local opportunity.",
    kind: "venture",
    status: "growing",
    progress: 64,
    color: "#a68cff",
    x: 180,
    y: 125,
    width: 250,
    height: 120
  },
  {
    id: "bluerif",
    title: "BlueRif",
    description: "A creative identity exploring culture, stories, and visual direction.",
    kind: "studio",
    status: "active",
    progress: 46,
    color: "#4dd4c6",
    x: -180,
    y: -155,
    width: 250,
    height: 120
  },
  {
    id: "deutschio",
    title: "Deutschio",
    description: "A language-learning world built around meaningful daily practice.",
    kind: "learning",
    status: "planning",
    progress: 28,
    color: "#f3b35b",
    x: -165,
    y: 180,
    width: 250,
    height: 120
  }
];

const projectBriefs: ProjectBrief[] = [
  {
    id: "rifkando",
    title: "rifKANDO",
    category: "Venture",
    nextMove: "Define the first local partner journey.",
    signal: "2 collaborators are ready to review it.",
    momentum: 64
  },
  {
    id: "bluerif",
    title: "BlueRif",
    category: "Studio",
    nextMove: "Shape the visual story into three strong directions.",
    signal: "Your visual language is ready for a first public artifact.",
    momentum: 46
  },
  {
    id: "deutschio",
    title: "Deutschio",
    category: "Learning world",
    nextMove: "Design one daily practice people can finish in ten minutes.",
    signal: "Start with the smallest useful learning ritual.",
    momentum: 28
  }
];

const seeds: WorkspaceNodeRecord[] = [];
const reflections: Array<{ id: string; answer: string; createdAt: string }> = [];

export function listWorkspaceNodes(): WorkspaceNodeRecord[] {
  return [...coreNodes, ...seeds].map((node) => ({ ...node }));
}

export function getWorkspaceDashboard() {
  return {
    dailyFocus: {
      title: "Move one meaningful project forward.",
      detail: "TOP is designed for progress you can carry into real life—not more time spent online."
    },
    projects: projectBriefs.map((project) => ({ ...project })),
    knowledge: [
      { id: "k1", title: "The craftsmanship principle", detail: "Quality compounds when you make time for revision.", format: "Field note" },
      { id: "k2", title: "Designing a daily learning ritual", detail: "Make the first action small enough to repeat tomorrow.", format: "Practice" },
      { id: "k3", title: "How good circles work", detail: "Small groups grow when contribution is visible and specific.", format: "Guide" }
    ],
    research: [
      { id: "r1", title: "Where does local opportunity break down?", detail: "Map the gap between a person needing help and a person able to offer it." },
      { id: "r2", title: "What makes language practice feel alive?", detail: "Collect moments where a learner used a new phrase in the real world." },
      { id: "r3", title: "Which stories deserve a visual identity?", detail: "Look for cultural details that are precise, human, and ownable." }
    ],
    assets: [
      { id: "a1", title: "TOP Manifesto", type: "Principle", detail: "The compass for every product decision." },
      { id: "a2", title: "Project brief", type: "Template", detail: "Turn an intention into an accountable next move." },
      { id: "a3", title: "Circle check-in", type: "Ritual", detail: "A short format for honest weekly support." }
    ],
    worlds: coreNodes.filter((node) => node.id !== "top").map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      color: node.color
    })),
    reflectionCount: reflections.length
  };
}

export function createSeed(input: { title: string; description: string }): WorkspaceNodeRecord {
  const index = seeds.length;
  const node: WorkspaceNodeRecord = {
    id: crypto.randomUUID(),
    title: input.title,
    description: input.description,
    kind: "seed",
    status: "planning",
    progress: 5,
    color: "#ef76ab",
    x: 45 + (index % 3) * 68,
    y: -145 + (index % 2) * 82,
    width: 250,
    height: 120
  };

  seeds.push(node);
  return { ...node };
}

export function saveReflection(answer: string) {
  const reflection = {
    id: crypto.randomUUID(),
    answer,
    createdAt: new Date().toISOString()
  };

  reflections.push(reflection);
  return reflection;
}

export function getFocus(projectId?: string) {
  const project = projectId
    ? projectBriefs.find((candidate) => candidate.id === projectId)
    : [...projectBriefs].sort((a, b) => a.momentum - b.momentum)[0];

  const focus = project ?? projectBriefs[0]!;

  return {
    projectId: focus.id,
    title: `A focused next move for ${focus.title}`,
    action: focus.nextMove,
    reason: `${focus.signal} Give it one deliberate block of attention before starting something new.`
  };
}
