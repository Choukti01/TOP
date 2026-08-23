<template>
  <aside class="field-dock" aria-label="TOP field controls">
    <div class="dock-heading"><span></span><small>MOVE WITH INTENTION</small></div>

    <button class="primary-tool" type="button" @click="continueWork">
      <span class="tool-glyph">↗</span>
      <span><small>{{ currentProject ? 'RETURN TO THE WORK' : 'MAKE A BEGINNING' }}</small><strong>{{ currentProject ? currentProject.title : 'Begin a real project' }}</strong></span>
      <i aria-hidden="true">→</i>
    </button>

    <div class="tool-row">
      <button type="button" @click="openAtelier"><span>✧</span><small>Open atelier</small></button>
      <button type="button" @click="openBlueprint"><span>⌘</span><small>Map a path</small></button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const currentProject = computed(() =>
  WorkspaceState.dashboard?.projects.find((project) => project.status === "active")
  ?? WorkspaceState.dashboard?.projects[0]
  ?? null,
);

function continueWork(): void {
  if (currentProject.value) {
    workspaceEngine.openProject(currentProject.value.id);
    return;
  }

  WorkspaceState.projectComposerOpen = true;
  workspaceEngine.triggerMotion("action");
}

function openAtelier(): void {
  workspaceEngine.openSection("Atelier");
}

function openBlueprint(): void {
  workspaceEngine.openSection("Blueprint");
}
</script>

<style scoped>
.field-dock { bottom:29px; left:29px; position:absolute; width:min(320px,calc(100vw - 58px)); z-index:8; }.dock-heading { align-items:center; color:rgba(193,207,248,.56); display:flex; font-family:var(--top-mono); font-size:8px; gap:7px; letter-spacing:.13em; margin:0 0 9px 5px; }.dock-heading span { background:var(--top-lime); border-radius:50%; box-shadow:0 0 12px var(--top-lime); height:5px; width:5px; }.primary-tool { align-items:center; backdrop-filter:blur(16px); background:linear-gradient(135deg,rgba(26,39,93,.88),rgba(7,12,33,.85)); border:1px solid rgba(98,230,255,.34); border-radius:18px 18px 5px 18px; box-shadow:0 20px 55px rgba(0,0,0,.25),inset 0 1px rgba(232,246,255,.09); color:var(--top-ink); cursor:pointer; display:flex; gap:12px; padding:13px; text-align:left; transition:border-color .24s ease,box-shadow .24s ease,transform .24s ease; width:100%; }.primary-tool:hover { border-color:var(--top-cyan); box-shadow:0 23px 65px rgba(0,0,0,.36),0 0 28px rgba(98,230,255,.09); transform:translateY(-3px); }.tool-glyph { align-items:center; background:linear-gradient(135deg,var(--top-cyan),var(--top-violet)); border-radius:12px 12px 4px 12px; color:#07101d; display:flex; flex:0 0 auto; font-size:20px; height:37px; justify-content:center; width:37px; }.primary-tool small,.primary-tool strong { display:block; }.primary-tool small { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; letter-spacing:.12em; }.primary-tool strong { font-family:var(--top-display); font-size:15px; font-weight:700; letter-spacing:-.04em; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.primary-tool > i { color:var(--top-cyan); font-size:18px; font-style:normal; margin-left:auto; }.tool-row { display:grid; gap:8px; grid-template-columns:1fr 1fr; margin-top:8px; }.tool-row button { align-items:center; backdrop-filter:blur(12px); background:rgba(10,15,38,.72); border:1px solid rgba(119,151,255,.25); border-radius:13px 13px 4px 13px; color:rgba(218,229,255,.82); cursor:pointer; display:flex; gap:7px; justify-content:center; padding:10px; transition:border-color .2s ease,background .2s ease,transform .2s ease; }.tool-row button:hover { background:rgba(25,37,83,.83); border-color:rgba(156,124,255,.72); transform:translateY(-2px); }.tool-row span { color:var(--top-lime); font-size:14px; }.tool-row small { font-family:var(--top-mono); font-size:8px; }
@media (max-width:700px) { .field-dock { bottom:17px; left:17px; width:min(290px,calc(100vw - 34px)); } }
</style>
