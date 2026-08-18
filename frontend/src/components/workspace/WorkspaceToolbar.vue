<template>
  <header class="toolbar">
    <div class="world-title">
      <span class="eyebrow">LIVE WORKSPACE</span>
      <strong>{{ WorkspaceState.worldName }}</strong>
    </div>

    <label class="search" aria-label="Search your workspace">
      <span aria-hidden="true">⌕</span>
      <input v-model="WorkspaceState.searchTerm" placeholder="Search your world" />
      <kbd>⌘ K</kbd>
    </label>

    <div class="actions">
      <button class="secondary" type="button" @click="saveWorkspace">
        {{ saveLabel }}
      </button>
      <button class="primary" type="button" @click="createSeed">
        <span aria-hidden="true">+</span>
        New seed
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const saveLabel = ref("Save layout");

function createSeed(): void {
  WorkspaceState.seedComposerOpen = true;
}

function saveWorkspace(): void {
  workspaceEngine.save();
  saveLabel.value = "Saved locally";

  window.setTimeout(() => {
    saveLabel.value = "Save layout";
  }, 1_800);
}
</script>

<style scoped>
.toolbar {
  align-items: center;
  display: flex;
  gap: 18px;
  justify-content: space-between;
  left: 30px;
  position: absolute;
  right: 30px;
  top: 26px;
  z-index: 50;
}

@media (min-width: 1221px) {
  .toolbar { right: 326px; }
}

.world-title {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 128px;
}

.eyebrow {
  color: rgba(170, 202, 239, 0.56);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

strong {
  color: #f5f9ff;
  font-size: 17px;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.search {
  align-items: center;
  background: rgba(8, 16, 31, 0.72);
  border: 1px solid rgba(162, 197, 240, 0.12);
  border-radius: 12px;
  color: #79baff;
  display: flex;
  flex: 0 1 330px;
  gap: 9px;
  min-width: 180px;
  padding: 0 11px;
  backdrop-filter: blur(20px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
}

.search input {
  background: transparent;
  border: 0;
  color: #eaf2ff;
  font: inherit;
  font-size: 13px;
  height: 40px;
  min-width: 0;
  outline: 0;
  width: 100%;
}

.search input::placeholder {
  color: rgba(199, 217, 240, 0.44);
}

kbd {
  border: 1px solid rgba(210, 227, 255, 0.11);
  border-radius: 5px;
  color: rgba(210, 227, 255, 0.45);
  font-size: 10px;
  padding: 2px 5px;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 9px;
}

button {
  align-items: center;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  font-size: 12px;
  font-weight: 650;
  gap: 7px;
  height: 40px;
  justify-content: center;
  padding: 0 15px;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

button:hover {
  transform: translateY(-2px);
}

.secondary {
  background: rgba(10, 20, 38, 0.7);
  border-color: rgba(162, 197, 240, 0.13);
  color: rgba(226, 236, 251, 0.8);
}

.secondary:hover {
  border-color: rgba(112, 184, 255, 0.48);
}

.primary {
  background: #78baff;
  box-shadow: 0 10px 30px rgba(71, 157, 245, 0.25);
  color: #061326;
}

.primary span {
  font-size: 19px;
  font-weight: 400;
  line-height: 0;
}

@media (max-width: 840px) {
  .toolbar {
    left: 16px;
    right: 16px;
    top: 16px;
  }

  .world-title,
  .secondary,
  kbd {
    display: none;
  }
}
</style>
