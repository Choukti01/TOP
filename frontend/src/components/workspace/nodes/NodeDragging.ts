import type { WorkspaceNode } from "./Node";

export class NodeDragging {

    private active: WorkspaceNode | null = null;

    private offsetX = 0;

    private offsetY = 0;

    public begin(

        node: WorkspaceNode,

        mouseX: number,

        mouseY: number

    ){

        this.active = node;

        this.offsetX = mouseX - node.x;

        this.offsetY = mouseY - node.y;

    }

    public move(

        mouseX:number,

        mouseY:number

    ){

        if(!this.active)return;

        this.active.x = mouseX - this.offsetX;

        this.active.y = mouseY - this.offsetY;

    }

    public end(){

        this.active = null;

    }

}
