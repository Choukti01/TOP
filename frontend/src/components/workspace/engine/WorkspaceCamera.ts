import { WorkspaceState } from "./WorkspaceState";

export class WorkspaceCamera {

    private dragging = false;

    private lastX = 0;

    private lastY = 0;

    constructor(
        private element: HTMLElement
    ){

        this.initialize();

    }

    private initialize(){

        this.element.addEventListener(

            "mousedown",

            this.mouseDown

        );

        window.addEventListener(

            "mousemove",

            this.mouseMove

        );

        window.addEventListener(

            "mouseup",

            this.mouseUp

        );

        this.element.addEventListener(

            "wheel",

            this.mouseWheel,

            {

                passive:false

            }

        );

    }

    private mouseDown=(e:MouseEvent)=>{

        this.dragging=true;

        this.lastX=e.clientX;

        this.lastY=e.clientY;

    }

    private mouseMove=(e:MouseEvent)=>{

        if(!this.dragging)return;

        WorkspaceState.x+=e.clientX-this.lastX;

        WorkspaceState.y+=e.clientY-this.lastY;

        this.lastX=e.clientX;

        this.lastY=e.clientY;

    }

    private mouseUp=()=>{

        this.dragging=false;

    }

    private mouseWheel=(e:WheelEvent)=>{

        e.preventDefault();

        WorkspaceState.zoom+=

        e.deltaY*-0.001;

        WorkspaceState.zoom=Math.max(

            .3,

            Math.min(

                3,

                WorkspaceState.zoom

            )

        );

    }

}
