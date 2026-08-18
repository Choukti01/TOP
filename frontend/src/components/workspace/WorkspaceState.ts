import { reactive } from "vue";

import { NodeManager } from "./nodes/NodeManager";
import type { WorkspaceDashboard } from "../../lib/api";

export type WorkspaceSection =
    | "Overview"
    | "Projects"
    | "Knowledge"
    | "Research"
    | "AI"
    | "Assets"
    | "Worlds"
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

    dashboard:null as WorkspaceDashboard | null,

    dashboardStatus:"loading" as "loading" | "ready" | "offline",

    seedComposerOpen:false,

    toast:"" as string,

    nodes:new NodeManager()

});
