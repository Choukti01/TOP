import { reactive } from "vue";

import { NodeManager } from "./nodes/NodeManager";

export const WorkspaceState=reactive({

    x:0,

    y:0,

    zoom:1,

    nodes:new NodeManager()

});
