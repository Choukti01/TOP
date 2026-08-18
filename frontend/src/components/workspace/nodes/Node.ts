export type WorkspaceNodeKind = "world" | "venture" | "studio" | "learning" | "seed";

export type WorkspaceNodeStatus = "active" | "growing" | "planning";

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
