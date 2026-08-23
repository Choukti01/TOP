<template>

<div ref="container" class="world"></div>

</template>

<script setup lang="ts">

import { ref, onMounted, onUnmounted } from "vue";

import { Engine } from "../engine/core/Engine";

const container = ref<HTMLElement>();

let engine: Engine | undefined;

onMounted(()=>{

    if(container.value){

        engine = new Engine(

            container.value

        );

        engine.start();

    }

});

onUnmounted(()=>{

    engine?.dispose();

});

</script>

<style scoped>

.world{

position:fixed;

inset:0;

overflow:hidden;

}

</style>
