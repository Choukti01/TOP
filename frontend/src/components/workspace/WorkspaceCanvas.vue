<template>

<div

class="canvas"

ref="canvas"

>

<WorkspaceToolbar/>

<div class="atmosphere" aria-hidden="true">

<span class="aurora aurora-one"></span>

<span class="aurora aurora-two"></span>

</div>

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

v-for="(node,index) in visibleNodes"

:key="node.id"

:node="node"

:index="index"

/>

</div>

<div class="canvas-hint">

<span class="hint-mark" aria-hidden="true"></span>

<span>Drag to shape your universe</span>

</div>

</div>

</template>

<script setup lang="ts">

import {

computed,

ref,

onMounted,

onUnmounted

} from "vue";

import WorkspaceToolbar from "./WorkspaceToolbar.vue";
import WorkspaceGrid from "./WorkspaceGrid.vue";
import WorkspaceNode from "./WorkspaceNode.vue";

import {

WorkspaceState

} from "./WorkspaceState";

import {

workspaceEngine

} from "./WorkspaceEngine";

import {

WorkspaceCamera

} from "./WorkspaceCamera";

const canvas=

ref<HTMLElement>();

let workspaceCamera: WorkspaceCamera | undefined;

const visibleNodes = computed(()=>{

const term = WorkspaceState.searchTerm.trim().toLowerCase();

if(!term)return WorkspaceState.nodes.nodes;

return WorkspaceState.nodes.nodes.filter((node)=>

node.title.toLowerCase().includes(term) ||

node.description.toLowerCase().includes(term)

);

});

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

void workspaceEngine.load();

window.addEventListener(

"mousemove",

mouseMove

);

window.addEventListener(

"mouseup",

mouseUp

);

if(canvas.value){

workspaceCamera = new WorkspaceCamera(

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

workspaceCamera?.dispose();

});

</script>

<style scoped>

.canvas{

position:relative;

overflow:hidden;

width:100%;

height:100%;

background:#040812;

isolation:isolate;

}

.atmosphere{

inset:0;

overflow:hidden;

pointer-events:none;

position:absolute;

z-index:0;

}

.aurora{

border-radius:50%;

filter:blur(16px);

opacity:.55;

position:absolute;

}

.aurora-one{

animation:drift-one 18s ease-in-out infinite alternate;

background:radial-gradient(circle,rgba(52,140,255,.18),rgba(52,140,255,0) 68%);

height:570px;

left:-210px;

top:-250px;

width:570px;

}

.aurora-two{

animation:drift-two 21s ease-in-out infinite alternate;

background:radial-gradient(circle,rgba(155,102,255,.12),rgba(155,102,255,0) 70%);

bottom:-290px;

height:610px;

right:-280px;

width:610px;

}

.world{

position:absolute;

inset:0;

transform-origin:center;

transition:

transform

.05s linear;

}

.canvas-hint{

align-items:center;

bottom:22px;

color:rgba(189,213,245,.43);

display:flex;

font-size:11px;

gap:8px;

left:30px;

letter-spacing:.02em;

pointer-events:none;

position:absolute;

z-index:4;

}

.hint-mark{

border:1px solid rgba(133,194,255,.48);

border-radius:50%;

height:10px;

position:relative;

width:10px;

}

.hint-mark::after{

background:#81c3ff;

border-radius:50%;

box-shadow:0 0 10px #81c3ff;

content:"";

height:3px;

left:2.5px;

position:absolute;

top:2.5px;

width:3px;

}

@keyframes drift-one{

to{transform:translate(75px,52px) scale(1.08);}

}

@keyframes drift-two{

to{transform:translate(-58px,-45px) scale(1.1);}

}

@media (prefers-reduced-motion:reduce){

.aurora-one,
.aurora-two{animation:none;}

}

</style>
