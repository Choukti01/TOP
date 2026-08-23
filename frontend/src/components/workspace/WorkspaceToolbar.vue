<template>
  <header class="toolbar">
    <label class="search" aria-label="Search your workspace">
      <span class="search-mark" aria-hidden="true">⌕</span>
      <input ref="searchInput" v-model="WorkspaceState.searchTerm" placeholder="Search your field" />
      <button
        v-if="WorkspaceState.searchTerm"
        class="clear-search"
        type="button"
        aria-label="Clear workspace search"
        @click.prevent="WorkspaceState.searchTerm = ''"
      >×</button>
      <kbd>⌘ K</kbd>
    </label>

    <div class="actions">
      <button class="save" type="button" @click="saveWorkspace">
        <span aria-hidden="true">◌</span>{{ saveLabel }}
      </button>
      <button class="seed" type="button" @click="createProject">
        <span aria-hidden="true">+</span>
        Begin a project
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from "vue";

import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const saveLabel = ref("Hold this shape");
const searchInput = ref<HTMLInputElement>();

function createProject(): void {
  WorkspaceState.projectComposerOpen = true;
}

function saveWorkspace(): void {
  saveLabel.value = workspaceEngine.save() ? "Shape remembered" : "Could not save";

  window.setTimeout(() => {
    saveLabel.value = "Hold this shape";
  }, 1_800);
}

function handleShortcut(event: KeyboardEvent): void {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    void nextTick(() => searchInput.value?.focus());
  }
}

onMounted(() => window.addEventListener("keydown", handleShortcut));
onUnmounted(() => window.removeEventListener("keydown", handleShortcut));
</script>

<style scoped>
.toolbar { align-items:center; display:flex; gap:10px; left:50%; position:absolute; top:24px; transform:translateX(-50%); z-index:50; }
.search { align-items:center; background:rgba(23,18,14,.68); border:1px solid rgba(235,204,159,.19); border-radius:999px; box-shadow:0 12px 35px rgba(0,0,0,.19),inset 0 1px rgba(255,243,222,.06); color:#e2ad68; display:flex; gap:9px; min-width:260px; padding:0 13px; transition:border-color .2s ease,box-shadow .2s ease; }.search:focus-within { border-color:rgba(225,173,100,.58); box-shadow:0 0 0 4px rgba(215,151,76,.09),0 16px 38px rgba(0,0,0,.25); }.search-mark { font-family:Georgia,serif; font-size:20px; line-height:1; }.search input { background:transparent; border:0; color:#f4e9d8; font:inherit; font-size:11px; height:42px; min-width:0; outline:0; width:178px; }.search input::placeholder { color:rgba(231,211,181,.43); } kbd { border:1px solid rgba(232,209,175,.13); border-bottom-color:rgba(232,209,175,.24); border-radius:5px; color:rgba(232,209,175,.44); font-size:9px; padding:3px 5px; white-space:nowrap; }.clear-search { align-items:center; background:rgba(241,224,194,.09); border:0; border-radius:50%; color:#f3dfbf; cursor:pointer; display:flex; font-size:15px; height:18px; justify-content:center; line-height:1; padding:0 0 2px; width:18px; }
.actions { display:flex; gap:7px; }.actions button { align-items:center; border-radius:999px; cursor:pointer; display:inline-flex; font-size:10px; font-weight:750; gap:6px; height:42px; letter-spacing:.015em; padding:0 13px; transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease,background .2s ease; }.actions button:hover { transform:translateY(-2px); }.save { background:rgba(23,18,14,.66); border:1px solid rgba(235,204,159,.17); color:rgba(245,233,214,.78); }.save span { color:#a9bd86; font-size:15px; }.save:hover { border-color:rgba(174,195,137,.5); }.seed { background:linear-gradient(135deg,#ecc47e,#c98747); border:1px solid rgba(255,230,182,.4); box-shadow:0 11px 28px rgba(191,123,52,.23),inset 0 1px rgba(255,247,221,.55); color:#2a1a0e; }.seed span { font-size:17px; font-weight:400; line-height:0; }
@media (max-width:760px) { .toolbar { gap:6px; top:69px; }.search { min-width:0; }.search input { width:min(31vw,150px); }.save { padding:0 10px !important; }.save span { margin:0; }.save { font-size:0 !important; }.seed { padding:0 11px !important; } kbd { display:none; } }

.search { background:rgba(9,13,31,.76); border-color:rgba(107,143,255,.31); }.search:focus-within { border-color:var(--top-cyan); box-shadow:0 0 0 4px rgba(98,230,255,.1),0 16px 38px rgba(0,0,0,.3); }.search-mark { color:var(--top-cyan); }.search input { color:var(--top-ink); }.search input::placeholder { color:rgba(180,197,238,.43); }.search kbd { border-color:rgba(130,160,255,.24); color:rgba(190,207,255,.55); font-family:var(--top-mono); }.save { background:rgba(9,13,31,.74); border-color:rgba(107,143,255,.28); color:rgba(226,234,255,.82); }.save span { color:var(--top-cyan); }.save:hover { border-color:var(--top-cyan); }.seed { background:linear-gradient(110deg,var(--top-cyan),#a08aff 52%,var(--top-pink)); box-shadow:0 11px 30px rgba(83,105,255,.32),inset 0 1px rgba(255,255,255,.58); color:#06101c; }.actions button { font-family:var(--top-body); }
</style>
