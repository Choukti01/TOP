import type { WorkspaceNode } from "./Node";

export class NodeDragging {

    private active: WorkspaceNode | null = null;

    private offsetX = 0;

    private offsetY = 0;

    private startX = 0;

    private startY = 0;

    private moved = false;

    public begin(

        node: WorkspaceNode,

        mouseX: number,

        mouseY: number

    ){

        this.active = node;

        this.startX = mouseX;

        this.startY = mouseY;

        this.moved = false;

        this.offsetX = mouseX - node.x;

        this.offsetY = mouseY - node.y;

    }

    public move(

        mouseX:number,

        mouseY:number

    ){

        if(!this.active)return;

        if(Math.hypot(mouseX - this.startX, mouseY - this.startY) > 5) this.moved = true;

        this.active.x = mouseX - this.offsetX;

        this.active.y = mouseY - this.offsetY;

    }

    public end(): { didMove: boolean; wasActive: boolean; node: WorkspaceNode | null } {

        const didMove = this.moved;

        const node = this.active;

        const wasActive = node !== null;

        this.active = null;

        this.moved = false;

        return { didMove, wasActive, node };

    }

}
