<template>
  <div id="app">

    <RouterView />

    <ExperienceView v-if="route.path === '/'" />

  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

import ExperienceView from "./views/ExperienceView.vue";
import "./styles/top-spectral.css";

const route = useRoute();
</script>

<style>

:root {
  color-scheme: dark;
  font-family: var(--top-body);
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
  margin: 0;
  background: var(--top-void);
}

html {
  min-height: 100%;
  scroll-behavior: smooth;
}

body {
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

#app {
  min-height: 100dvh;
  overflow: visible;
}

body {
  color: var(--top-ink);
}

button,
input {
  font: inherit;
}

</style>
