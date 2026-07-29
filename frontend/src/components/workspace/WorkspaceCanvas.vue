<template>

<div

class="canvas"

ref="canvas"

>

<WorkspaceToolbar/>

<div

class="world"

:style="{

transform:

`translate(${WorkspaceState.x}px,${WorkspaceState.y}px)

scale(${WorkspaceState.zoom})`

}"

>

<WorkspaceGrid/>

<WorkspaceNode

v-for="node in WorkspaceState.nodes.nodes"

:key="node.id"

:node="node"

/>

</div>

</div>

</template>

<script setup lang="ts">

import {

ref,

onMounted,

onUnmounted

} from "vue";

import WorkspaceToolbar from "./WorkspaceToolbar.vue";
import WorkspaceGrid from "./WorkspaceGrid.vue";
import WorkspaceNode from "./WorkspaceNode.vue";

import {

WorkspaceState

} from "../../engine/workspace/WorkspaceState";

import {

workspaceEngine

} from "../../engine/workspace/WorkspaceEngine";

import {

WorkspaceCamera

} from "./engine/WorkspaceCamera";

const canvas=

ref<HTMLElement>();

function mouseMove(

e:MouseEvent

){

workspaceEngine.drag(

e.clientX,

e.clientY

);

}

function mouseUp(){

workspaceEngine.dragEnd();

}

onMounted(()=>{

workspaceEngine.load();

window.addEventListener(

"mousemove",

mouseMove

);

window.addEventListener(

"mouseup",

mouseUp

);

if(canvas.value){

new WorkspaceCamera(

canvas.value

);

}

});

onUnmounted(()=>{

window.removeEventListener(

"mousemove",

mouseMove

);

window.removeEventListener(

"mouseup",

mouseUp

);

});

</script>

<style scoped>

.canvas{

position:relative;

overflow:hidden;

width:100%;

height:100%;

background:#040812;

}

.world{

position:absolute;

left:50%;

top:50%;

width:6000px;

height:6000px;

transform-origin:center;

transition:

transform

.05s linear;

}

</style>
