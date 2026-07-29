<template>

<div ref="container" class="world"></div>

</template>

<script setup lang="ts">

import { ref,onMounted } from "vue";

import { Engine } from "../engine/core/Engine";

const container = ref<HTMLElement>();

onMounted(()=>{

    if(container.value){

        const engine = new Engine(

            container.value

        );

        engine.start();

    }

});

</script>

<style scoped>

.world{

position:fixed;

inset:0;

overflow:hidden;

}

</style>
