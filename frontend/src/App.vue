<template>
  <div id="app">

    <RouterView />

    <ExperienceView />

  </div>
</template>

<script setup lang="ts">
import ExperienceView from "./views/ExperienceView.vue";
</script>

<style>

html,
body,
#app{

    width:100%;
    height:100%;
    margin:0;
    overflow:hidden;
    background:black;

}

</style>
