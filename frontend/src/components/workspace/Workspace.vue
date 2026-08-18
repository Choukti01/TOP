<template>

<div class="workspace">

    <!-- Left Navigation -->
    <WorkspaceSidebar/>

    <!-- Center -->
    <main class="center">

        <WorkspaceCanvas v-show="WorkspaceState.activeSection === 'Overview'"/>

        <WorkspaceInspector v-if="WorkspaceState.activeSection === 'Overview'"/>

        <WorkspaceSectionPanel v-if="WorkspaceState.activeSection !== 'Overview'"/>

        <SeedComposer/>

        <WorkspaceToast/>

    </main>

</div>

</template>

<script setup lang="ts">

import WorkspaceSidebar from "./WorkspaceSidebar.vue";
import WorkspaceCanvas from "./WorkspaceCanvas.vue";
import WorkspaceInspector from "./WorkspaceInspector.vue";
import WorkspaceSectionPanel from "./WorkspaceSectionPanel.vue";
import SeedComposer from "./SeedComposer.vue";
import WorkspaceToast from "./WorkspaceToast.vue";
import { WorkspaceState } from "./WorkspaceState";

</script>

<style scoped>

.workspace{

position:fixed;

inset:0;

display:grid;

grid-template-columns:

224px

minmax(0,1fr);

background:#040812;

overflow:hidden;

}

.center{

position:relative;

overflow:hidden;

background:#040812;

}

@media (max-width: 1220px){

.workspace{

grid-template-columns:

210px

1fr;

}

.workspace :deep(.inspector){

display:none;

}

}

</style>
