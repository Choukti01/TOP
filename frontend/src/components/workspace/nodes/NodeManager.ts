import type { WorkspaceNode, WorkspaceNodeDetails } from "./Node";

export class NodeManager {

    public nodes: WorkspaceNode[] = [];

    constructor() {

        this.createDefaults();

    }

    private createDefaults(): void {

        this.add("TOP",-25,-35,{
            description:"The creator universe where your ideas become real-world projects.",
            kind:"world",
            status:"active",
            progress:82,
            color:"#70b8ff"
        });

        this.add("rifKANDO",180,125,{
            description:"A multi-service platform connecting people to local opportunity.",
            kind:"venture",
            status:"growing",
            progress:64,
            color:"#a68cff"
        });

        this.add("BlueRif",-180,-155,{
            description:"A creative identity exploring culture, stories, and visual direction.",
            kind:"studio",
            status:"active",
            progress:46,
            color:"#4dd4c6"
        });

        this.add("Deutschio",-165,180,{
            description:"A language-learning world built around meaningful daily practice.",
            kind:"learning",
            status:"planning",
            progress:28,
            color:"#f3b35b"
        });

    }

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
