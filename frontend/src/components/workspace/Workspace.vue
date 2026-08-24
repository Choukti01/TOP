<template>
  <div class="workspace">
    <ThreeField :mode="fieldMode" :pulse="WorkspaceState.motionToken" />

    <WorkspaceArrival v-if="isArriving" @complete="completeArrival" />

    <main class="stage">
      <WorkspaceCanvas v-show="WorkspaceState.activeSection === 'Overview'" />
      <WorkspaceSectionPanel v-if="WorkspaceState.activeSection !== 'Overview'" />
      <SeedComposer />
      <WorkspaceToast />
    </main>

    <WorkspaceSidebar />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import ThreeField from "../ThreeField.vue";
import WorkspaceArrival from "./WorkspaceArrival.vue";
import WorkspaceSidebar from "./WorkspaceSidebar.vue";
import WorkspaceCanvas from "./WorkspaceCanvas.vue";
import WorkspaceSectionPanel from "./WorkspaceSectionPanel.vue";
import SeedComposer from "./SeedComposer.vue";
import WorkspaceToast from "./WorkspaceToast.vue";
import { WorkspaceState } from "./WorkspaceState";
import { workspaceEngine } from "./WorkspaceEngine";

const isArriving = ref(true);
const route = useRoute();

const fieldMode = computed(() =>
  WorkspaceState.activeSection === "Overview"
    ? "workspace"
    : WorkspaceState.activeSection.toLowerCase(),
);

function completeArrival(): void {
  isArriving.value = false;
}

function closeTransientUi(event: KeyboardEvent): void {
  if (event.key !== "Escape" || !WorkspaceState.projectComposerOpen) return;
  WorkspaceState.projectComposerOpen = false;
  WorkspaceState.projectDraft = null;
}

onMounted(() => window.addEventListener("keydown", closeTransientUi));
onUnmounted(() => window.removeEventListener("keydown", closeTransientUi));

watch(() => route.query.project, (projectId) => {
  if (typeof projectId === "string" && projectId.length > 0) workspaceEngine.openProject(projectId);
}, { immediate: true });
</script>

<style scoped>
.workspace { background:#060711; isolation:isolate; min-height:100dvh; overflow-x:clip; overflow-y:visible; position:relative; }
.stage { min-height:100dvh; position:relative; z-index:1; }
</style>
