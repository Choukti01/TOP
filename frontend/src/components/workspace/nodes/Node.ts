export type WorkspaceNodeKind = "project" | "seed";

export type WorkspaceNodeStatus = "planning" | "active" | "paused" | "completed";

export interface WorkspaceNode {

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

    selected: boolean;

}

export type WorkspaceNodeDetails = Pick<
    WorkspaceNode,
    "description" | "kind" | "status" | "progress" | "color"
>;
