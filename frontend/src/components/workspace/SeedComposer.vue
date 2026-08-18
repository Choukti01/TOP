<template>
  <div v-if="WorkspaceState.seedComposerOpen" class="backdrop" @click.self="close">
    <form class="composer" @submit.prevent="plantSeed">
      <button class="close" type="button" aria-label="Close Seed composer" @click="close">×</button>
      <span class="eyebrow">PLANT A SEED</span>
      <h2>What deserves a first step?</h2>
      <p>A Seed is an intention with enough clarity for someone to help it grow.</p>
      <label>Seed title<input v-model.trim="title" maxlength="80" placeholder="Build a neighbourhood repair circle"></label>
      <label>Why it matters<textarea v-model.trim="description" maxlength="280" placeholder="Describe the change this idea could create in the real world."></textarea></label>
      <p v-if="error" class="error">{{ error }}</p>
      <footer><button class="cancel" type="button" @click="close">Not yet</button><button class="plant" :disabled="saving" type="submit">{{ saving ? 'Planting…' : 'Plant Seed' }}</button></footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const title = ref("");
const description = ref("");
const error = ref("");
const saving = ref(false);

function close(): void {
  WorkspaceState.seedComposerOpen = false;
  error.value = "";
}

async function plantSeed(): Promise<void> {
  error.value = "";

  try {
    saving.value = true;
    await workspaceEngine.createSeed(title.value, description.value);
    title.value = "";
    description.value = "";
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Your Seed could not be planted.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.backdrop { align-items:center; backdrop-filter:blur(10px); background:rgba(2,6,15,.68); display:flex; inset:0; justify-content:center; padding:22px; position:absolute; z-index:100; }.composer { animation:rise .32s cubic-bezier(.2,.9,.3,1) both; background:radial-gradient(circle at 88% 10%,rgba(240,118,171,.18),transparent 27%),linear-gradient(145deg,#121f37,#080f20); border:1px solid rgba(191,218,248,.17); border-radius:24px; box-shadow:0 30px 100px rgba(0,0,0,.55); max-width:580px; padding:34px; position:relative; width:100%; }.eyebrow { color:#f191c4; font-size:10px; font-weight:800; letter-spacing:.16em; }.composer h2 { font-size:32px; font-weight:520; letter-spacing:-.045em; margin:13px 0 9px; }.composer > p { color:rgba(216,231,251,.63); font-size:14px; line-height:1.6; margin:0; }.composer label { color:rgba(219,235,254,.82); display:block; font-size:12px; font-weight:700; margin-top:23px; }.composer input,.composer textarea { background:rgba(5,11,22,.7); border:1px solid rgba(173,207,245,.13); border-radius:11px; color:#eff7ff; display:block; font:inherit; font-size:14px; margin-top:8px; outline:0; padding:12px; width:100%; }.composer textarea { height:112px; resize:vertical; }.composer input:focus,.composer textarea:focus { border-color:#ef82b8; box-shadow:0 0 0 3px rgba(239,130,184,.1); }.composer footer { display:flex; gap:10px; justify-content:flex-end; margin-top:28px; }.composer footer button,.close { border-radius:10px; cursor:pointer; font-size:13px; font-weight:750; padding:11px 15px; }.cancel { background:transparent; border:1px solid rgba(179,211,249,.14); color:rgba(222,237,255,.75); }.plant { background:linear-gradient(135deg,#ef84b8,#a58cff); border:0; box-shadow:0 10px 28px rgba(221,104,172,.22); color:#17102e; }.plant:disabled { cursor:wait; opacity:.7; }.close { align-items:center; background:rgba(211,230,251,.07); border:1px solid rgba(211,230,251,.1); color:#dcecff; display:flex; font-size:20px; height:31px; justify-content:center; padding:0 0 2px; position:absolute; right:20px; top:20px; width:31px; }.error { color:#ff9ebd !important; margin-top:16px !important; } @keyframes rise { from { opacity:0; transform:translateY(18px) scale(.97); } to { opacity:1; transform:none; } }
</style>
