<template>

<div

class="node"

:class="{

selected:node.selected

}"

:style="{

left:node.x+'px',

top:node.y+'px'

}"

@click.stop="select"

@mousedown.stop="startDrag"

>

<h2>

{{node.title}}

</h2>

<p>

Creator Node

</p>

</div>

</template>

<script setup lang="ts">

import type {

WorkspaceNode

} from "../../engine/workspace/nodes/Node";

import {

workspaceEngine

} from "../../engine/workspace/WorkspaceEngine";

const props=

defineProps<{

node:WorkspaceNode

}>();

function select(){

workspaceEngine.select(

props.node.id

);

}

function startDrag(

e:MouseEvent

){

workspaceEngine.dragStart(

props.node,

e.clientX,

e.clientY

);

}

</script>

<style scoped>

.node{

position:absolute;

width:250px;

height:120px;

padding:24px;

border-radius:16px;

background:

linear-gradient(

180deg,

#101827,

#09111f

);

border:

1px solid

rgba(255,255,255,.08);

transition:

box-shadow .25s,

transform .25s,

border .25s;

cursor:grab;

color:white;

}

.node:active{

cursor:grabbing;

}

.node:hover{

transform:

translateY(-4px);

border-color:#70B8FF;

}

.selected{

border-color:#70B8FF;

box-shadow:

0 0 35px

rgba(

112,

184,

255,

.55

);

}

</style>
