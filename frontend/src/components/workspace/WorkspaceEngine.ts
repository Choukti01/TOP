import { WorkspaceState } from "./WorkspaceState";

import {
    createWorkspaceSeed,
    getWorkspaceDashboard,
    getWorkspaceOverview
} from "../../lib/api";

import { NodeSelection } from "./nodes/NodeSelection";
import { NodeDragging } from "./nodes/NodeDragging";
import type { WorkspaceNode } from "./nodes/Node";

class WorkspaceEngine {

    private selection = new NodeSelection();

    private dragging = new NodeDragging();

    public select(id:string){

        this.selection.select(

            WorkspaceState.nodes.nodes,

            id

        );

        WorkspaceState.selectedNodeId = id;

        this.save();

    }

    public clearSelection(){

        for(const node of WorkspaceState.nodes.nodes){

            node.selected = false;

        }

        WorkspaceState.selectedNodeId = null;

    }

    public dragStart(

        node:WorkspaceNode,

        x:number,

        y:number

    ){

        this.dragging.begin(

            node,

            x,

            y

        );

    }

    public drag(

        x:number,

        y:number

    ){

        this.dragging.move(

            x,

            y

        );

    }

    public dragEnd(){

        this.dragging.end();

        this.save();

    }

    public async createSeed(title:string,description:string){

        const { seed } =

        await createWorkspaceSeed({ title, description });

        const node:WorkspaceNode = {

            ...seed,

            selected:false

        };

        WorkspaceState.nodes.nodes.push(node);

        WorkspaceState.seedComposerOpen = false;

        WorkspaceState.activeSection = "Overview";

        this.select(node.id);

        this.notify("Seed planted in your universe.");

    }

    public save(){

        localStorage.setItem(

            "top-workspace",

            JSON.stringify(

                WorkspaceState.nodes.nodes

            )

        );

    }

    public notify(message:string){

        WorkspaceState.toast = message;

        window.setTimeout(()=>{

            if(WorkspaceState.toast === message){

                WorkspaceState.toast = "";

            }

        },3_400);

    }

    public async load(){

        WorkspaceState.syncStatus =

        "loading";

        const saved =

        localStorage.getItem(

            "top-workspace"

        );

        let savedNodes:Partial<WorkspaceNode>[] = [];

        if(saved){

            try{

                const data:unknown =

                JSON.parse(saved);

                if(Array.isArray(data)){

                    savedNodes = data as Partial<WorkspaceNode>[];

                }

            }catch{

                localStorage.removeItem("top-workspace");

            }

        }

        try{

            const [overview,dashboard] =

            await Promise.all([

                getWorkspaceOverview(),

                getWorkspaceDashboard()

            ]);

            WorkspaceState.worldName =

            overview.world.name;

            WorkspaceState.lastSyncedAt =

            overview.updatedAt;

            WorkspaceState.syncStatus =

            "synced";

            WorkspaceState.dashboard = dashboard;

            WorkspaceState.dashboardStatus = "ready";

            const remoteNodes =

            overview.nodes.map((node)=>(

                {

                    ...node,

                    selected:false

                }

            ));

            if(savedNodes.length){

                const restoredNodes = savedNodes.map((node)=>{

                    const fallback =

                    remoteNodes.find((remote)=>(

                        remote.id === node.id ||
                        remote.title === node.title

                    ));

                    return this.normalizeNode(node,fallback);

                });

                for(const remoteNode of remoteNodes){

                    if(!restoredNodes.some((node)=>(

                        node.id === remoteNode.id ||
                        node.title === remoteNode.title

                    ))){

                        restoredNodes.push(remoteNode);

                    }

                }

                WorkspaceState.nodes.nodes = restoredNodes;

            }else{

                WorkspaceState.nodes.nodes = remoteNodes;

            }

        }catch{

            // The workspace remains available from local storage while the API is offline.

            WorkspaceState.syncStatus =

            "offline";

            WorkspaceState.dashboardStatus = "offline";

            if(savedNodes.length){

                WorkspaceState.nodes.nodes =

                savedNodes.map((node)=>(

                    this.normalizeNode(node)

                ));

            }

        }

    }

    private normalizeNode(

        node:Partial<WorkspaceNode>,

        fallback?:WorkspaceNode

    ):WorkspaceNode{

        const usesLegacyPosition =

        this.usesLegacyDefaultPosition(node);

        return {

            id:node.id ?? fallback?.id ?? crypto.randomUUID(),

            title:node.title ?? fallback?.title ?? "Untitled Seed",

            description:node.description ?? fallback?.description ??
            "A new idea ready to become a meaningful project.",

            kind:node.kind ?? fallback?.kind ?? "seed",

            status:node.status ?? fallback?.status ?? "planning",

            progress:node.progress ?? fallback?.progress ?? 5,

            color:node.color ?? fallback?.color ?? "#ef76ab",

            x:usesLegacyPosition ? fallback?.x ?? 0 : node.x ?? fallback?.x ?? 0,

            y:usesLegacyPosition ? fallback?.y ?? 0 : node.y ?? fallback?.y ?? 0,

            width:node.width ?? fallback?.width ?? 250,

            height:node.height ?? fallback?.height ?? 120,

            selected:false

        };

    }

    private usesLegacyDefaultPosition(node:Partial<WorkspaceNode>):boolean{

        const legacyPositions:Record<string,{ x:number; y:number }> = {

            TOP:{ x:0, y:0 },

            rifKANDO:{ x:520, y:160 },

            BlueRif:{ x:-420, y:-250 },

            Deutschio:{ x:-620, y:260 }

        };

        const legacyPosition =

        node.title ? legacyPositions[node.title] : undefined;

        return Boolean(

            legacyPosition &&

            node.x === legacyPosition.x &&

            node.y === legacyPosition.y

        );

    }

}

export const workspaceEngine =
new WorkspaceEngine();
