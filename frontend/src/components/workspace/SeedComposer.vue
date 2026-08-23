<template>
  <div v-if="WorkspaceState.projectComposerOpen" class="backdrop" @click.self="close">
    <form class="composer" @submit.prevent="beginProject">
      <button class="close" type="button" aria-label="Close project composer" @click="close">×</button>
      <span class="eyebrow">BEGIN A PROJECT</span>
      <h2>Give a real intention a place to grow.</h2>
      <p>A TOP project begins with why it matters and one action you can actually take.</p>

      <label>Project name<input v-model.trim="title" maxlength="80" placeholder="Build a neighbourhood repair circle" /></label>
      <label>Why it matters<textarea v-model.trim="purpose" maxlength="280" placeholder="Describe the change you want this project to create in real life."></textarea></label>
      <label>Living direction
        <select v-model="direction">
          <option value="personal">A personal practice</option>
          <option value="creative">Creative work</option>
          <option value="learning">Learning journey</option>
          <option value="community">Community contribution</option>
          <option value="venture">Venture or service</option>
          <option value="other">A direction of my own</option>
        </select>
      </label>
      <label>Your first next action<input v-model.trim="nextAction" maxlength="180" placeholder="Invite two neighbours to a 20-minute conversation" /></label>

      <p v-if="error" class="error">{{ error }}</p>
      <footer><button class="cancel" type="button" @click="close">Not yet</button><button class="plant" :disabled="saving || !isComplete" type="submit">{{ saving ? 'Beginning…' : 'Begin project' }}</button></footer>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { ProjectDirection } from "../../lib/api";
import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const title = ref("");
const purpose = ref("");
const direction = ref<ProjectDirection>("personal");
const nextAction = ref("");
const error = ref("");
const saving = ref(false);
const isComplete = computed(() => title.value.trim().length >= 3 && purpose.value.trim().length >= 12 && nextAction.value.trim().length >= 3);

watch(
  () => WorkspaceState.projectDraft,
  (draft) => {
    if (!draft) return;
    title.value = draft.title;
    purpose.value = draft.purpose;
    direction.value = draft.direction;
    nextAction.value = draft.nextAction;
  },
  { immediate: true }
);

function close(): void {
  WorkspaceState.projectComposerOpen = false;
  WorkspaceState.projectDraft = null;
  error.value = "";
}

async function beginProject(): Promise<void> {
  error.value = "";

  if (!isComplete.value) {
    error.value = "Give this project a clear name, purpose, and first next action.";
    return;
  }

  try {
    saving.value = true;
    await workspaceEngine.createProject({
      title: title.value,
      purpose: purpose.value,
      direction: direction.value,
      nextAction: nextAction.value
    });
    title.value = "";
    purpose.value = "";
    direction.value = "personal";
    nextAction.value = "";
    WorkspaceState.projectDraft = null;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Your project could not be started.";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.backdrop { align-items:center; backdrop-filter:blur(15px); background:rgba(13,10,7,.74); display:flex; inset:0; justify-content:center; overflow:auto; padding:22px; position:fixed; z-index:200; }.composer { animation:rise .34s cubic-bezier(.2,.9,.3,1) both; background:radial-gradient(circle at 89% 12%,rgba(205,132,74,.2),transparent 27%),radial-gradient(circle at 9% 91%,rgba(119,148,91,.15),transparent 25%),linear-gradient(145deg,#33271c,#1a1510); border:1px solid rgba(239,205,156,.25); border-radius:28px 28px 8px 28px; box-shadow:0 35px 110px rgba(0,0,0,.61),inset 0 1px rgba(255,245,225,.08); color:#f4eade; max-width:600px; padding:36px; position:relative; width:100%; }.eyebrow { color:#e6ae64; font-size:9px; font-weight:850; letter-spacing:.17em; }.composer h2 { font-family:Georgia,"Times New Roman",serif; font-size:36px; font-weight:500; letter-spacing:-.06em; margin:13px 0 9px; max-width:460px; }.composer > p { color:rgba(234,219,198,.65); font-size:14px; line-height:1.65; margin:0; }.composer label { color:rgba(238,224,204,.83); display:block; font-size:11px; font-weight:750; margin-top:20px; }.composer input,.composer textarea,.composer select { background:rgba(13,10,7,.58); border:1px solid rgba(230,200,159,.16); border-radius:13px 13px 5px 13px; color:#f4ebdf; display:block; font:inherit; font-size:13px; margin-top:8px; outline:0; padding:13px; width:100%; }.composer textarea { height:98px; resize:vertical; }.composer select { appearance:none; cursor:pointer; }.composer input:focus,.composer textarea:focus,.composer select:focus { border-color:#e1a85e; box-shadow:0 0 0 3px rgba(225,168,94,.11); }.composer footer { display:flex; gap:10px; justify-content:flex-end; margin-top:29px; }.composer footer button,.close { border-radius:999px; cursor:pointer; font-size:12px; font-weight:800; padding:11px 16px; }.cancel { background:transparent; border:1px solid rgba(229,204,168,.16); color:rgba(240,226,205,.78); }.plant { background:linear-gradient(135deg,#efcc87,#c58349); border:1px solid rgba(255,228,178,.38); box-shadow:0 10px 28px rgba(195,123,54,.22),inset 0 1px rgba(255,249,228,.5); color:#291a0e; }.plant:disabled { cursor:wait; opacity:.7; }.close { align-items:center; background:rgba(244,225,195,.06); border:1px solid rgba(244,225,195,.14); color:#f1dfc5; display:flex; font-size:20px; height:31px; justify-content:center; line-height:1; padding:0 0 3px; position:absolute; right:20px; top:20px; width:31px; }.error { color:#ee9b83 !important; margin-top:16px !important; } @keyframes rise { from { opacity:0; transform:translateY(18px) scale(.97); } to { opacity:1; transform:none; } } @media (max-width:600px) { .backdrop { align-items:flex-start; }.composer { margin:auto 0; padding:31px 22px; }.composer h2 { font-size:31px; } }

.backdrop { background:rgba(3,5,15,.78); }.composer { background:radial-gradient(circle at 89% 12%,rgba(99,94,255,.27),transparent 27%),radial-gradient(circle at 9% 91%,rgba(49,219,255,.16),transparent 25%),linear-gradient(145deg,#171d48,#070a1d); border-color:rgba(128,159,255,.38); color:var(--top-ink); }.composer::before { background:linear-gradient(90deg,var(--top-cyan),var(--top-violet),var(--top-pink)); content:""; height:2px; left:28px; position:absolute; right:28px; top:0; }.eyebrow { color:var(--top-cyan); font-family:var(--top-mono); }.composer h2 { font-family:var(--top-display); font-weight:700; letter-spacing:-.075em; }.composer > p { color:var(--top-muted); }.composer label { color:rgba(225,233,255,.85); font-family:var(--top-mono); }.composer input,.composer textarea,.composer select { background:rgba(2,4,14,.58); border-color:rgba(122,154,255,.3); color:var(--top-ink); }.composer input:focus,.composer textarea:focus,.composer select:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.12); }.cancel { border-color:rgba(122,154,255,.28); color:rgba(225,233,255,.8); }.plant { background:linear-gradient(110deg,var(--top-cyan),#a08aff 52%,var(--top-pink)); box-shadow:0 12px 30px rgba(83,105,255,.3),inset 0 1px rgba(255,255,255,.6); color:#06101c; }.close { background:rgba(145,160,255,.08); border-color:rgba(128,159,255,.25); color:var(--top-ink); }
</style>
