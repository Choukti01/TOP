import type { WorkspaceNode } from "./Node";

export class NodeManager {

    public nodes: WorkspaceNode[] = [];

    constructor() {

        this.createDefaults();

    }

    private createDefaults(): void {

        this.add("TOP",0,0);

        this.add("rifKANDO",520,160);

        this.add("BlueRif",-420,-250);

        this.add("Deutschio",-620,260);

    }

    public add(

        title:string,

        x:number,

        y:number

    ){

        this.nodes.push({

            id:crypto.randomUUID(),

            title,

            x,

            y,

            width:250,

            height:120,

            selected:false

        });

    }

}
