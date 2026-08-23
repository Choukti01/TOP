<template>
  <section class="atelier">
    <header class="atelier-header">
      <div>
        <span class="eyebrow">TOP / NATIVE ATELIER</span>
        <h2>The tools are the world.</h2>
        <p>Choose a medium, make a first version, and keep the work close. Nothing here asks you to consume more.</p>
      </div>
      <div class="atelier-status"><i></i><span>{{ activeMeta.kicker }} / READY</span></div>
    </header>

    <div class="atelier-orbit" aria-label="Choose an Atelier tool">
      <button
        v-for="tool in tools"
        :key="tool.id"
        class="tool-orbit"
        :class="{ active: activeTool === tool.id }"
        :style="{ '--tool-color': tool.color }"
        type="button"
        :aria-pressed="activeTool === tool.id"
        @click="selectTool(tool.id)"
      >
        <i aria-hidden="true">{{ tool.glyph }}</i>
        <span><small>{{ tool.kicker }}</small><strong>{{ tool.label }}</strong><em>{{ tool.description }}</em></span>
      </button>
    </div>

    <div class="atelier-bridge">
      <p><span>WORKING IN {{ activeMeta.label.toUpperCase() }}</span>{{ activeMeta.promise }}</p>
      <div>
        <button type="button" @click="openNativeTool('Studio')"><i>✦</i> Open visual studio</button>
        <button type="button" @click="openNativeTool('Blueprint')"><i>⌁</i> Open path mapper</button>
      </div>
    </div>

    <WorldComposer v-if="activeTool === 'world'" />
    <BoardBuilder v-else-if="activeTool === 'forge'" mode="forge" />
    <WritingRoom v-else-if="activeTool === 'writing'" />
    <SoundLab v-else-if="activeTool === 'sound'" />
    <BoardBuilder v-else-if="activeTool === 'quest'" mode="quest" />
    <BoardBuilder v-else-if="activeTool === 'prototype'" mode="prototype" />
    <MemoryGarden v-else-if="activeTool === 'memory'" />
    <BoardBuilder v-else mode="circle" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import BoardBuilder from "./BoardBuilder.vue";
import MemoryGarden from "./MemoryGarden.vue";
import SoundLab from "./SoundLab.vue";
import WorldComposer from "./WorldComposer.vue";
import WritingRoom from "./WritingRoom.vue";
import { workspaceEngine } from "./WorkspaceEngine";

type AtelierTool = "world" | "forge" | "writing" | "sound" | "quest" | "prototype" | "memory" | "circle";

const tools: Array<{ id: AtelierTool; label: string; kicker: string; description: string; promise: string; glyph: string; color: string }> = [
  { id: "world", label: "World Composer", kicker: "SPATIAL", description: "Shape a 3D place for a project.", promise: "Set landmarks and give the work a place you can return to.", glyph: "◌", color: "#ff9b54" },
  { id: "forge", label: "Idea Forge", kicker: "THINK", description: "Let fragments become a direction.", promise: "Move unfinished thoughts until a project begins to reveal itself.", glyph: "✧", color: "#ff72bd" },
  { id: "writing", label: "Writing Room", kicker: "WORD", description: "Write without the feed around it.", promise: "Hold language long enough for a real thought to take its own shape.", glyph: "¶", color: "#f3e8c3" },
  { id: "sound", label: "Sound Lab", kicker: "SOUND", description: "Set a small atmosphere for work.", promise: "Choose an intentional texture for focus, then make something away from noise.", glyph: "∿", color: "#62e6ff" },
  { id: "quest", label: "Learning Quest", kicker: "LEARN", description: "Turn a skill into terrain.", promise: "Pair study with practice, challenge, and proof—not endless courses.", glyph: "△", color: "#62e6ff" },
  { id: "prototype", label: "Prototype Table", kicker: "TEST", description: "Arrange the first real version.", promise: "Make the smallest testable shape before investing in polished certainty.", glyph: "▣", color: "#d9ff71" },
  { id: "memory", label: "Memory Garden", kicker: "NOTICE", description: "Keep evidence of a lived week.", promise: "Grow a quiet record of what you made, learned, helped, or noticed.", glyph: "✤", color: "#9c7cff" },
  { id: "circle", label: "Circle Builder", kicker: "TOGETHER", description: "Prepare a reason to gather.", promise: "Define purpose and agreements before inviting people into a shared circle.", glyph: "◎", color: "#9c7cff" }
];

const activeTool = ref<AtelierTool>("world");
const activeMeta = computed(() => tools.find((tool) => tool.id === activeTool.value) ?? tools[0]!);

function selectTool(tool: AtelierTool): void {
  activeTool.value = tool;
  workspaceEngine.triggerMotion("action");
}

function openNativeTool(section: "Studio" | "Blueprint"): void {
  workspaceEngine.openSection(section, "Atelier");
}
</script>

<style scoped>
.atelier { grid-column:span 3; }.atelier-header { align-items:flex-start; display:flex; gap:24px; justify-content:space-between; padding:0 2px; }.eyebrow { color:var(--top-cyan); font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.18em; }.atelier h2 { font-family:var(--top-display); font-size:clamp(35px,4.8vw,65px); font-weight:750; letter-spacing:-.09em; line-height:.89; margin:14px 0; }.atelier-header p { color:var(--top-muted); line-height:1.65; max-width:655px; }.atelier-status { align-items:center; color:rgba(210,222,255,.6); display:flex; flex:0 0 auto; font-family:var(--top-mono); font-size:8px; gap:8px; letter-spacing:.1em; padding-top:5px; }.atelier-status i { animation:signal 2.5s ease-in-out infinite; background:var(--top-lime); border-radius:50%; box-shadow:0 0 12px var(--top-lime); height:6px; width:6px; }.atelier-orbit { display:grid; gap:9px; grid-template-columns:repeat(4,minmax(0,1fr)); margin-top:29px; }.tool-orbit { animation:tool-in .48s both; animation-delay:calc(var(--tool-index, 0) * .04s); background:linear-gradient(145deg,color-mix(in srgb,var(--tool-color) 11%,#16224c),rgba(5,8,22,.9)); border:1px solid color-mix(in srgb,var(--tool-color) 25%,transparent); border-radius:17px 17px 5px 17px; color:var(--top-ink); cursor:pointer; min-height:148px; overflow:hidden; padding:17px; position:relative; text-align:left; transition:border-color .2s ease,box-shadow .2s ease,transform .2s ease; }.tool-orbit::after { background:radial-gradient(circle,var(--tool-color),transparent 66%); content:""; height:120px; opacity:0; pointer-events:none; position:absolute; right:-58px; top:-67px; transition:opacity .2s ease; width:120px; }.tool-orbit > i { color:var(--tool-color); display:block; font-family:var(--top-display); font-size:25px; font-style:normal; line-height:1; text-shadow:0 0 18px color-mix(in srgb,var(--tool-color) 70%,transparent); }.tool-orbit span { display:block; position:relative; z-index:1; }.tool-orbit small { color:var(--tool-color); display:block; font-family:var(--top-mono); font-size:7px; font-weight:800; letter-spacing:.13em; margin-top:20px; }.tool-orbit strong { display:block; font-family:var(--top-display); font-size:20px; font-weight:700; letter-spacing:-.055em; line-height:1; margin-top:5px; }.tool-orbit em { color:rgba(210,221,250,.54); display:block; font-size:10px; font-style:normal; line-height:1.42; margin-top:8px; }.tool-orbit:hover,.tool-orbit.active { border-color:var(--tool-color); box-shadow:0 0 0 1px color-mix(in srgb,var(--tool-color) 20%,transparent),0 18px 36px rgba(0,0,0,.25); transform:translateY(-5px); }.tool-orbit:hover::after,.tool-orbit.active::after { opacity:.16; }.tool-orbit.active { background:linear-gradient(145deg,color-mix(in srgb,var(--tool-color) 20%,#16224c),rgba(5,8,22,.94)); }.atelier-bridge { align-items:center; background:linear-gradient(100deg,rgba(96,230,255,.1),rgba(156,124,255,.1),rgba(255,114,189,.08)); border:1px solid rgba(136,162,255,.23); border-radius:17px 17px 5px 17px; display:flex; gap:24px; justify-content:space-between; margin:15px 0; padding:14px 17px; }.atelier-bridge p { color:rgba(218,228,255,.7); font-size:11px; line-height:1.5; max-width:560px; }.atelier-bridge p span { color:var(--top-cyan); display:block; font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.13em; margin-bottom:3px; }.atelier-bridge div { display:flex; flex:0 0 auto; gap:8px; }.atelier-bridge button { background:rgba(5,9,27,.56); border:1px solid rgba(135,164,255,.29); border-radius:999px; color:var(--top-ink); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:10px 12px; transition:.2s ease; }.atelier-bridge button i { color:var(--top-cyan); font-size:12px; font-style:normal; margin-right:4px; }.atelier-bridge button:hover { border-color:var(--top-cyan); transform:translateY(-2px); } @keyframes tool-in { from { opacity:0; transform:translateY(13px); } to { opacity:1; transform:none; } } @keyframes signal { 50% { box-shadow:0 0 0 5px rgba(217,255,113,0),0 0 12px var(--top-lime); } }
@media (max-width:900px) { .atelier-orbit { grid-template-columns:repeat(2,minmax(0,1fr)); }.atelier-bridge { align-items:flex-start; flex-direction:column; }.atelier-bridge div { flex-wrap:wrap; } }
@media (max-width:800px) { .atelier { grid-column:span 1; }.atelier-header { flex-direction:column; }.atelier-status { padding:0; }.tool-orbit { min-height:132px; } }
@media (max-width:520px) { .atelier-orbit { grid-template-columns:1fr; }.tool-orbit { min-height:120px; }.tool-orbit small { margin-top:13px; }.atelier-bridge div,.atelier-bridge button { width:100%; } }
</style>
