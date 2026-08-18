<template>
  <aside class="inspector" :class="{ 'is-empty': !selectedNode }">
    <header>
      <span class="eyebrow">DETAILS</span>
      <div class="header-row">
        <h2>{{ selectedNode ? "Project lens" : "Your map" }}</h2>
        <button
          v-if="selectedNode"
          class="close"
          type="button"
          aria-label="Close project details"
          @click="closeInspector"
        >
          ×
        </button>
      </div>
    </header>

    <section v-if="selectedNode" class="node-details">
      <div class="node-mark" :style="{ background: selectedNode.color }"></div>
      <span class="kind">{{ selectedNode.kind }}</span>
      <h3>{{ selectedNode.title }}</h3>
      <p>{{ selectedNode.description }}</p>

      <div class="progress-block">
        <div class="progress-label">
          <span>Momentum</span>
          <strong>{{ selectedNode.progress }}%</strong>
        </div>
        <div class="track">
          <div
            class="fill"
            :style="{ width: `${selectedNode.progress}%`, background: selectedNode.color }"
          ></div>
        </div>
      </div>

      <dl>
        <div>
          <dt>State</dt>
          <dd><span class="status-dot" :style="{ background: selectedNode.color }"></span>{{ selectedNode.status }}</dd>
        </div>
        <div>
          <dt>Position</dt>
          <dd>{{ Math.round(selectedNode.x) }}, {{ Math.round(selectedNode.y) }}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{{ selectedNode.kind }} node</dd>
        </div>
      </dl>

      <button type="button" @click="saveWorkspace">Save changes</button>
    </section>

    <div v-else class="empty">
      <div class="orbit"><div class="core"></div></div>
      <h3>Pick a project</h3>
      <p>Its story, momentum, and next move will open here.</p>
    </div>

    <footer>
      <span class="sync-dot" :class="WorkspaceState.syncStatus"></span>
      {{ syncMessage }}
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const selectedNode = computed(() =>
  WorkspaceState.nodes.nodes.find((node) => node.id === WorkspaceState.selectedNodeId)
);

const syncMessage = computed(() => {
  if (WorkspaceState.syncStatus === "synced") return "Synced with TOP API";
  if (WorkspaceState.syncStatus === "offline") return "Working from local data";
  return "Connecting to TOP API";
});

function saveWorkspace(): void {
  workspaceEngine.save();
}

function closeInspector(): void {
  workspaceEngine.clearSelection();
}
</script>

<style scoped>
.inspector {
  background: linear-gradient(160deg, rgba(11, 21, 39, 0.86), rgba(6, 12, 24, 0.78));
  backdrop-filter: blur(22px);
  border: 1px solid rgba(163, 197, 240, 0.12);
  border-radius: 20px;
  box-sizing: border-box;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
  color: #f3f7ff;
  display: flex;
  flex-direction: column;
  height: calc(100% - 40px);
  padding: 26px;
  position: absolute;
  right: 20px;
  top: 20px;
  width: 286px;
  z-index: 20;
}

.eyebrow,
.kind {
  color: #72b7ff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h2 {
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.03em;
  margin: 7px 0 0;
}

.header-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.close {
  align-items: center;
  background: rgba(180, 211, 247, 0.07);
  border: 1px solid rgba(180, 211, 247, 0.1);
  border-radius: 8px;
  color: rgba(227, 239, 255, 0.72);
  cursor: pointer;
  display: inline-flex;
  font-size: 21px;
  height: 30px;
  justify-content: center;
  line-height: 1;
  padding: 0 0 2px;
  width: 30px;
}

.close:hover { background: rgba(112, 184, 255, 0.15); color: #eaf5ff; }

.node-details {
  border-top: 1px solid rgba(163, 197, 240, 0.09);
  margin-top: 30px;
  padding-top: 25px;
}

.node-mark {
  border-radius: 9px;
  box-shadow: 0 0 28px color-mix(in srgb, currentColor 0%, transparent);
  height: 34px;
  margin-bottom: 20px;
  width: 34px;
}

.kind {
  color: rgba(164, 197, 236, 0.63);
}

h3 {
  font-size: 23px;
  font-weight: 450;
  letter-spacing: -0.02em;
  margin: 8px 0 10px;
}

p {
  color: rgba(205, 221, 243, 0.58);
  font-size: 13px;
  line-height: 1.7;
  margin: 0;
}

.progress-block {
  margin: 28px 0;
}

.progress-label {
  color: rgba(205, 221, 243, 0.58);
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  margin-bottom: 9px;
}

.progress-label strong {
  color: #e5f1ff;
  font-weight: 600;
}

.track {
  background: rgba(167, 198, 238, 0.1);
  border-radius: 999px;
  height: 5px;
  overflow: hidden;
}

.fill {
  border-radius: inherit;
  height: 100%;
}

dl {
  border-bottom: 1px solid rgba(163, 197, 240, 0.08);
  border-top: 1px solid rgba(163, 197, 240, 0.08);
  margin: 0;
}

dl div {
  align-items: center;
  border-bottom: 1px solid rgba(163, 197, 240, 0.06);
  display: flex;
  justify-content: space-between;
  padding: 13px 0;
}

dl div:last-child { border-bottom: 0; }

dt { color: rgba(205, 221, 243, 0.43); font-size: 11px; }
dd { color: rgba(225, 237, 253, 0.8); font-size: 11px; margin: 0; text-transform: capitalize; }

.status-dot {
  border-radius: 50%;
  display: inline-block;
  height: 6px;
  margin-right: 6px;
  vertical-align: middle;
  width: 6px;
}

button {
  background: rgba(112, 184, 255, 0.08);
  border: 1px solid rgba(112, 184, 255, 0.25);
  border-radius: 10px;
  color: #9dceff;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  margin-top: 22px;
  padding: 11px 14px;
  transition: background 160ms ease, transform 160ms ease;
  width: 100%;
}

button:hover { background: rgba(112, 184, 255, 0.16); transform: translateY(-1px); }

.empty {
  align-items: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.is-empty {
  height: 174px;
  padding: 20px;
  width: 246px;
}

.is-empty .empty {
  align-items: flex-start;
  flex: 0;
  justify-content: flex-start;
  margin-top: 15px;
  text-align: left;
}

.is-empty .empty::before { margin-bottom: 6px; }
.is-empty .empty h3 { font-size: 16px; margin: 0 0 4px; }
.is-empty .empty p { font-size: 11px; line-height: 1.45; max-width: 190px; }
.is-empty .orbit,
.is-empty footer { display: none; }

.empty::before {
  color: rgba(154, 194, 239, 0.44);
  content: "YOUR PROJECT MAP";
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  margin-bottom: 10px;
}

.empty h3 { font-size: 18px; margin: 24px 0 8px; }
.empty p { max-width: 210px; }

.orbit {
  align-items: center;
  animation: spin 14s linear infinite;
  border: 1px solid rgba(112, 184, 255, 0.28);
  border-radius: 50%;
  display: flex;
  height: 96px;
  justify-content: center;
  position: relative;
  width: 96px;
}

.orbit::after {
  background: #7abaff;
  border-radius: 50%;
  box-shadow: 0 0 15px #7abaff;
  content: "";
  height: 7px;
  position: absolute;
  right: 7px;
  top: 18px;
  width: 7px;
}

.core { background: radial-gradient(circle, #d6ecff, #5caaf8 50%, transparent 72%); border-radius: 50%; height: 44px; width: 44px; }

footer {
  align-items: center;
  border-top: 1px solid rgba(163, 197, 240, 0.08);
  color: rgba(190, 210, 237, 0.48);
  display: flex;
  font-size: 11px;
  gap: 7px;
  margin-top: 25px;
  padding-top: 18px;
}

@media (max-width: 1220px) {
  .inspector { display: none; }
}

.sync-dot { border-radius: 50%; height: 6px; width: 6px; }
.sync-dot.loading { background: #f3b35b; }
.sync-dot.synced { background: #62d7ae; box-shadow: 0 0 10px rgba(98, 215, 174, 0.5); }
.sync-dot.offline { background: #eb7f8f; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
