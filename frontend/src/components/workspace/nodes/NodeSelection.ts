import type { WorkspaceNode } from "./Node";

export class NodeSelection{

    public select(

        nodes:WorkspaceNode[],

        id:string

    ){

        for(const node of nodes){

            node.selected=

            node.id===id;

        }

    }

}
