import { WorkspaceState } from "./WorkspaceState";

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

        this.save();

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

    public save(){

        localStorage.setItem(

            "top-workspace",

            JSON.stringify(

                WorkspaceState.nodes.nodes

            )

        );

    }

    public load(){

        const saved =

        localStorage.getItem(

            "top-workspace"

        );

        if(!saved)return;

        const data =

        JSON.parse(saved);

        WorkspaceState.nodes.nodes = data;

    }

}

export const workspaceEngine =
new WorkspaceEngine();
