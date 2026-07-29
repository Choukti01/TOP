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

            title="TOP"

            :x="0"

            :y="0"

        />

        <WorkspaceNode

            title="rifKANDO"

            :x="500"

            :y="120"

        />

        <WorkspaceNode

            title="BlueRif"

            :x="-420"

            :y="-250"

        />

        <WorkspaceNode

            title="Deutschio"

            :x="-550"

            :y="300"

        />

    </div>

</div>

</template>

<script setup lang="ts">

import {

onMounted,

ref

} from "vue";

import WorkspaceToolbar from "./WorkspaceToolbar.vue";

import WorkspaceGrid from "./WorkspaceGrid.vue";

import WorkspaceNode from "./WorkspaceNode.vue";

import {

WorkspaceCamera

} from "./engine/WorkspaceCamera";

import {

WorkspaceState

} from "./engine/WorkspaceState";

const canvas=

ref<HTMLElement>();

onMounted(()=>{

if(canvas.value){

new WorkspaceCamera(

canvas.value

);

}

});

</script>

<style scoped>

.canvas{

position:relative;

overflow:hidden;

width:100%;

height:100%;

background:#050811;

cursor:grab;

}

.canvas:active{

cursor:grabbing;

}

.world{

position:absolute;

left:50%;

top:50%;

transform-origin:center;

transition:

transform

.05s linear;

width:5000px;

height:5000px;

}

</style>
