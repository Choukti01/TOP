import type { WorkspaceNode, WorkspaceNodeDetails } from "./Node";

export class NodeManager {

    public nodes: WorkspaceNode[] = [];

    public add(

        title:string,

        x:number,

        y:number,

        details:WorkspaceNodeDetails

    ):WorkspaceNode{

        const node:WorkspaceNode = {

            id:crypto.randomUUID(),

            title,

            ...details,

            x,

            y,

            width:250,

            height:120,

            selected:false

        };

        this.nodes.push(node);

        return node;

    }

}
