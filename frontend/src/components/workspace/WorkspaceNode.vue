<template>
  <article
    class="node"
    :class="[node.kind, { selected: node.selected }]"
    :style="{
      left: `calc(50% + ${node.x}px)`,
      top: `calc(50% + ${node.y}px)`,
      '--node-color': node.color,
      '--node-delay': `${index * 110}ms`
    }"
    @click.stop="select"
    @mousedown.stop="startDrag"
  >
    <div class="node-topline">
      <span class="kind">{{ node.kind }}</span>
      <span class="state"><i></i>{{ node.status }}</span>
    </div>

    <h2>{{ node.title }}</h2>
    <p>{{ node.description }}</p>

    <footer>
      <div class="progress"><span :style="{ width: `${node.progress}%` }"></span></div>
      <strong>{{ node.progress }}%</strong>
    </footer>
  </article>
</template>

<script setup lang="ts">
import type { WorkspaceNode } from "./nodes/Node";
import { workspaceEngine } from "./WorkspaceEngine";

const props = defineProps<{ node: WorkspaceNode; index: number }>();

function select(): void {
  workspaceEngine.select(props.node.id);
}

function startDrag(event: MouseEvent): void {
  workspaceEngine.dragStart(props.node, event.clientX, event.clientY);
}
</script>

<style scoped>
.node {
  animation: node-arrival 720ms var(--node-delay) both cubic-bezier(0.18, 0.9, 0.28, 1);
  background: linear-gradient(145deg, rgba(17, 30, 53, 0.93), rgba(7, 15, 30, 0.9));
  border: 1px solid rgba(174, 205, 245, 0.16);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  color: #eff6ff;
  cursor: grab;
  height: 174px;
  overflow: hidden;
  padding: 21px;
  position: absolute;
  transform: translate(-50%, -50%);
  transition: border-color 220ms ease, box-shadow 220ms ease, transform 220ms ease, background 220ms ease;
  width: 272px;
}

.node::before {
  background: radial-gradient(circle, var(--node-color) 0%, transparent 68%);
  content: "";
  filter: blur(16px);
  height: 90px;
  opacity: 0.24;
  position: absolute;
  right: -28px;
  top: -36px;
  width: 90px;
}

.node:active { cursor: grabbing; }

.node::after {
  border: 1px solid color-mix(in srgb, var(--node-color) 28%, transparent);
  border-radius: inherit;
  content: "";
  inset: -7px;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  transition: opacity 220ms ease, inset 220ms ease;
}

.node:hover,
.node.selected {
  border-color: color-mix(in srgb, var(--node-color) 70%, white 30%);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--node-color) 18%, transparent), 0 26px 66px rgba(0, 0, 0, 0.46);
  transform: translate(-50%, calc(-50% - 7px));
}

.node.selected::after {
  animation: signal 2.7s ease-out infinite;
  opacity: 1;
}

.node.world {
  box-shadow: 0 0 0 1px rgba(112, 184, 255, 0.22), 0 28px 75px rgba(27, 111, 205, 0.2);
}

.node.world::before {
  animation: world-glow 4.8s ease-in-out infinite;
  opacity: 0.34;
}

.node-topline,
footer {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.kind,
.state {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.kind { color: color-mix(in srgb, var(--node-color) 75%, white 25%); }
.state { color: rgba(208, 225, 246, 0.5); letter-spacing: 0.08em; }
.state i { background: var(--node-color); border-radius: 50%; box-shadow: 0 0 12px var(--node-color); display: inline-block; height: 5px; margin-right: 5px; vertical-align: middle; width: 5px; }

h2 {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  margin: 17px 0 7px;
  position: relative;
}

p {
  color: rgba(211, 226, 246, 0.57);
  display: -webkit-box;
  font-size: 11px;
  line-height: 1.55;
  margin: 0;
  overflow: hidden;
  position: relative;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

footer { bottom: 17px; left: 20px; position: absolute; right: 20px; }
.progress { background: rgba(209, 225, 247, 0.12); border-radius: 99px; height: 4px; overflow: hidden; width: calc(100% - 39px); }
.progress span { background: var(--node-color); border-radius: inherit; display: block; height: 100%; }
footer strong { color: rgba(230, 240, 255, 0.8); font-size: 10px; font-weight: 600; }

@keyframes node-arrival {
  from { opacity: 0; transform: translate(-50%, calc(-50% + 26px)) scale(0.95); }
  65% { opacity: 1; }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes signal {
  0% { inset: -5px; opacity: 0.6; }
  70%, 100% { inset: -22px; opacity: 0; }
}

@keyframes world-glow {
  50% { opacity: 0.55; transform: scale(1.28); }
}

@media (prefers-reduced-motion: reduce) {
  .node,
  .node.world::before,
  .node.selected::after { animation: none; }
}
</style>
