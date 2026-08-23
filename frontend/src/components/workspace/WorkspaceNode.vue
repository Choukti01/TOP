<template>
  <article
    class="node"
    :class="[node.kind, { selected: node.selected }]"
    :style="{
      left: 'calc(50% + ' + node.x + 'px)',
      top: 'calc(50% + ' + node.y + 'px)',
      '--node-delay': index * 110 + 'ms'
    }"
    @click.stop="openProject"
    @pointerdown.stop="startDrag"
  >
    <span class="node-number">0{{ index + 1 }}</span>
    <div class="node-topline">
      <span class="kind">{{ node.kind }}</span>
      <span class="state"><i></i>{{ node.status }}</span>
    </div>

    <h2>{{ node.title }}</h2>
    <p>{{ node.description }}</p>

    <footer><span>Open project</span><strong>↗</strong></footer>
  </article>
</template>

<script setup lang="ts">
import type { WorkspaceNode } from "./nodes/Node";
import { workspaceEngine } from "./WorkspaceEngine";

const props = defineProps<{ node: WorkspaceNode; index: number }>();

function openProject(): void {
  if (!workspaceEngine.canOpenDraggedProject()) return;
  workspaceEngine.openProject(props.node.id);
}

function startDrag(event: PointerEvent): void {
  workspaceEngine.dragStart(props.node, event.clientX, event.clientY);
}
</script>

<style scoped>
.node { --node-color:#ddb06b; animation:node-arrival 720ms var(--node-delay) both cubic-bezier(.18,.9,.28,1); background:linear-gradient(145deg,rgba(36,29,22,.94),rgba(20,16,13,.9)); border:1px solid rgba(238,215,178,.16); border-radius:22px 22px 7px 22px; box-shadow:0 24px 65px rgba(0,0,0,.32),inset 0 1px rgba(255,243,220,.035); box-sizing:border-box; color:#f6ede0; cursor:grab; height:168px; overflow:hidden; padding:20px; position:absolute; transform:translate(-50%,-50%); transition:border-color .22s ease,box-shadow .22s ease,transform .22s ease,background .22s ease; width:270px; }.node.project{--node-color:#e0ae62}.node.seed{--node-color:#d98398}
.node::before { background:radial-gradient(circle,var(--node-color),transparent 68%); content:""; filter:blur(19px); height:108px; opacity:.18; position:absolute; right:-35px; top:-45px; width:108px; }.node::after { border:1px solid color-mix(in srgb,var(--node-color) 45%,transparent); border-radius:inherit; content:""; inset:-7px; opacity:0; pointer-events:none; position:absolute; transition:opacity .22s ease,inset .22s ease; }.node-number { color:rgba(239,221,193,.26); font-family:Georgia,serif; font-size:10px; font-style:italic; position:absolute; right:18px; top:17px; }
.node:active { cursor:grabbing; }.node:hover,.node.selected { background:linear-gradient(145deg,rgba(48,38,26,.97),rgba(22,17,13,.96)); border-color:color-mix(in srgb,var(--node-color) 70%,white 15%); box-shadow:0 0 0 1px color-mix(in srgb,var(--node-color) 18%,transparent),0 29px 72px rgba(0,0,0,.49); transform:translate(-50%,calc(-50% - 7px)); }.node.selected::after { animation:signal 2.7s ease-out infinite; opacity:1; }
.node-topline,footer { align-items:center; display:flex; justify-content:space-between; }.kind,.state { font-size:9px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }.kind { color:var(--node-color); }.state { color:rgba(232,218,198,.46); letter-spacing:.08em; }.state i { background:var(--node-color); border-radius:50%; box-shadow:0 0 11px var(--node-color); display:inline-block; height:5px; margin-right:5px; vertical-align:middle; width:5px; }
h2 { font-family:Georgia,"Times New Roman",serif; font-size:22px; font-weight:500; letter-spacing:-.035em; margin:18px 0 7px; position:relative; } p { color:rgba(231,217,197,.6); display:-webkit-box; font-size:11px; line-height:1.55; margin:0; overflow:hidden; position:relative; -webkit-box-orient:vertical; -webkit-line-clamp:2; }
footer { border-top:1px solid rgba(235,216,186,.09); bottom:14px; left:20px; padding-top:12px; position:absolute; right:20px; } footer span { color:rgba(239,220,191,.5); font-size:9px; font-weight:750; letter-spacing:.1em; text-transform:uppercase; } footer strong { color:var(--node-color); font-size:15px; font-weight:500; }
@keyframes node-arrival { from { opacity:0; transform:translate(-50%,calc(-50% + 26px)) scale(.95); } 65% { opacity:1; } to { opacity:1; transform:translate(-50%,-50%) scale(1); } } @keyframes signal { 0% { inset:-5px; opacity:.6; } 70%,100% { inset:-22px; opacity:0; } }
@media (prefers-reduced-motion:reduce) { .node,.node.selected::after { animation:none; } }

.node { --node-color:var(--top-cyan); background:linear-gradient(145deg,rgba(26,34,79,.94),rgba(7,10,27,.92)); border-color:rgba(122,155,255,.28); box-shadow:0 24px 65px rgba(0,0,0,.42),inset 0 1px rgba(224,239,255,.06); }.node.project { --node-color:var(--top-cyan); }.node.seed { --node-color:var(--top-pink); }.node::before { opacity:.23; }.node:hover,.node.selected { background:linear-gradient(145deg,rgba(37,48,108,.98),rgba(10,14,36,.98)); border-color:var(--node-color); box-shadow:0 0 0 1px color-mix(in srgb,var(--node-color) 26%,transparent),0 0 34px color-mix(in srgb,var(--node-color) 22%,transparent),0 29px 72px rgba(0,0,0,.49); }.node-number { color:rgba(196,211,255,.32); font-family:var(--top-mono); }.kind,.state,footer span { font-family:var(--top-mono); }.kind { color:var(--node-color); }.state { color:rgba(190,205,244,.52); }.state i { box-shadow:0 0 12px var(--node-color); }.node h2 { font-family:var(--top-display); font-size:20px; font-weight:700; letter-spacing:-.055em; }.node p { color:var(--top-muted); }.node footer { border-color:rgba(126,157,255,.14); }.node footer strong { color:var(--node-color); }
</style>
