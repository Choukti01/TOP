<template>
  <div id="app">

    <RouterView />

    <ExperienceView v-if="route.path === '/'" />

  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

import ExperienceView from "./views/ExperienceView.vue";

const route = useRoute();
</script>

<style>

:root {
  color-scheme: dark;
  font-family: Inter, Aptos, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  min-width: 320px;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: #030712;
}

body {
  color: #f2f7ff;
}

button,
input {
  font: inherit;
}

button:focus-visible,
input:focus-visible {
  outline: 2px solid #76c8ff;
  outline-offset: 3px;
}

::selection {
  background: rgba(116, 197, 255, 0.32);
  color: #fff;
}

</style>
