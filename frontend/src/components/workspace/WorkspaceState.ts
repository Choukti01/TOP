import { reactive } from "vue";

import { NodeManager } from "./nodes/NodeManager";
import type { ProjectDirection, WorkspaceDashboard, WorkspaceProjectDetail } from "../../lib/api";

export type WorkspaceSection =
    | "Overview"
    | "Projects"
    | "Project"
    | "Atelier"
    | "Studio"
    | "Blueprint"
    | "AI"
    | "Reflection";

export const WorkspaceState=reactive({

    x:0,

    y:0,

    zoom:1,

    selectedNodeId:null as string | null,

    worldName:"TOP",

    lastSyncedAt:null as string | null,

    syncStatus:"loading" as "loading" | "synced" | "offline",

    searchTerm:"",

    activeSection:"Overview" as WorkspaceSection,

    returnSection:null as WorkspaceSection | null,

    activeProjectId:null as string | null,

    dashboard:null as WorkspaceDashboard | null,

    dashboardStatus:"loading" as "loading" | "ready" | "offline",

    projectDetails:{} as Record<string, WorkspaceProjectDetail>,

    projectRoomStatus:"idle" as "idle" | "loading" | "ready" | "error",

    projectComposerOpen:false,

    projectDraft:null as null | {
        title:string,
        purpose:string,
        direction:ProjectDirection,
        nextAction:string
    },

    motionToken:0,

    motionKind:"idle" as "idle" | "arrival" | "navigation" | "action",

    toast:"" as string,

    nodes:new NodeManager()

});
