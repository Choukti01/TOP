<template>
<div ref="container" class="engine"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Engine } from "@/engine/core/Engine";

const container = ref<HTMLElement | null>(null);

onMounted(() => {
  if (!container.value) return;

  const engine = new Engine(container.value);
  engine.start();
});
</script>

<style scoped>
.engine {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
