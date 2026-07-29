<template>

<div class="workspace">

    <!-- Left Navigation -->
    <WorkspaceSidebar/>

    <!-- Center -->
    <main class="center">

        <WorkspaceCanvas/>

    </main>

    <!-- Right Inspector -->
    <WorkspaceInspector/>

</div>

</template>

<script setup lang="ts">

import WorkspaceSidebar from "./WorkspaceSidebar.vue";
import WorkspaceCanvas from "./WorkspaceCanvas.vue";
import WorkspaceInspector from "./WorkspaceInspector.vue";

</script>

<style scoped>

.workspace{

position:fixed;

inset:0;

display:grid;

grid-template-columns:

280px

1fr

320px;

background:#040812;

overflow:hidden;

}

.center{

position:relative;

overflow:hidden;

background:#040812;

}

</style>
