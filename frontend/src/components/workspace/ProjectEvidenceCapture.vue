<template>
  <section class="evidence-capture" :class="{ blocked: disabled }">
    <div class="capture-heading">
      <div><span>PROJECT EVIDENCE</span><h3>Let this work belong somewhere real.</h3><p>{{ description }}</p></div>
      <i aria-hidden="true">↗</i>
    </div>

    <div v-if="projects.length === 0" class="capture-empty">
      <p>Start a real project first, then this tool can add a truthful trace to its trail.</p>
      <button type="button" @click="beginProject">Begin a project</button>
    </div>

    <form v-else @submit.prevent="record">
      <label>
        <span>ADD TO</span>
        <select v-model="projectId" aria-label="Project to receive this evidence">
          <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.title }}</option>
        </select>
      </label>
      <label>
        <span>WHAT DID YOU MAKE?</span>
        <input v-model.trim="title" maxlength="140" placeholder="Name this piece of work" />
      </label>
      <label class="context">
        <span>WHY DOES IT MATTER? <em>optional</em></span>
        <textarea v-model.trim="note" maxlength="500" placeholder="Leave a short context for your future self."></textarea>
      </label>
      <div class="capture-actions">
        <small v-if="message" :class="{ error: errorMessage }">{{ message }}</small>
        <small v-else>{{ disabled ? "Finish something in this tool before you record it." : "This is evidence, not content for a feed." }}</small>
        <button type="submit" :disabled="disabled || saving || title.length < 3 || !projectId">{{ saving ? "Linking…" : "Link to project" }} <span>↗</span></button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import type { ProjectArtifact, ProjectArtifactKind } from "../../lib/api";
import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const props = withDefaults(defineProps<{
  kind: ProjectArtifactKind;
  defaultTitle: string;
  defaultNote?: string;
  description: string;
  disabled?: boolean;
}>(), {
  defaultNote: "",
  disabled: false
});

const emit = defineEmits<{ recorded: [artifact: ProjectArtifact] }>();
const projectId = ref("");
const title = ref("");
const note = ref("");
const saving = ref(false);
const message = ref("");
const errorMessage = ref(false);
const projects = computed(() => (WorkspaceState.dashboard?.projects ?? []).filter((project) => project.status !== "completed"));

watch(() => [props.defaultTitle, props.defaultNote], () => {
  title.value = props.defaultTitle;
  note.value = props.defaultNote;
}, { immediate: true });

watch([projects, () => WorkspaceState.activeProjectId], () => {
  const activeProjectId = WorkspaceState.activeProjectId;
  const activeProjectExists = activeProjectId && projects.value.some((project) => project.id === activeProjectId);
  if (activeProjectExists) {
    projectId.value = activeProjectId;
    return;
  }
  if (!projects.value.some((project) => project.id === projectId.value)) projectId.value = projects.value[0]?.id ?? "";
}, { immediate: true });

function beginProject(): void {
  WorkspaceState.projectComposerOpen = true;
  workspaceEngine.triggerMotion("action");
}

async function record(): Promise<void> {
  if (props.disabled || !projectId.value || title.value.trim().length < 3) return;
  saving.value = true;
  message.value = "";

  try {
    const artifact = await workspaceEngine.recordProjectArtifact(projectId.value, {
      title: title.value,
      kind: props.kind,
      ...(note.value ? { note: note.value } : {})
    });
    message.value = "Linked to this project’s real trail.";
    errorMessage.value = false;
    emit("recorded", artifact);
  } catch (cause) {
    message.value = cause instanceof Error ? cause.message : "TOP could not link this work to your project.";
    errorMessage.value = true;
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.evidence-capture { background:linear-gradient(120deg,rgba(96,230,255,.09),rgba(156,124,255,.08),rgba(255,114,189,.06)); border:1px solid rgba(126,158,255,.25); border-radius:19px 19px 5px 19px; margin-top:17px; padding:20px; position:relative; }.evidence-capture::before { background:linear-gradient(90deg,var(--top-cyan),var(--top-violet),var(--top-pink)); content:""; height:1px; left:20px; opacity:.7; position:absolute; right:20px; top:0; }.capture-heading { align-items:flex-start; display:flex; gap:18px; justify-content:space-between; }.capture-heading span,.evidence-capture label > span { color:var(--top-cyan); display:block; font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.14em; }.capture-heading h3 { font-family:var(--top-display); font-size:27px; font-weight:700; letter-spacing:-.065em; line-height:.95; margin:10px 0 7px; }.capture-heading p { color:var(--top-muted); font-size:11px; line-height:1.6; margin:0; max-width:650px; }.capture-heading > i { border:1px solid rgba(98,230,255,.38); border-radius:50%; color:var(--top-cyan); flex:0 0 auto; font-size:17px; font-style:normal; height:30px; line-height:29px; margin-top:3px; text-align:center; width:30px; }.evidence-capture form { display:grid; gap:10px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:21px; }.evidence-capture label { display:grid; gap:7px; }.evidence-capture label.context,.capture-actions { grid-column:span 2; }.evidence-capture label em { color:var(--top-muted); font-style:normal; font-weight:400; letter-spacing:0; }.evidence-capture input,.evidence-capture select,.evidence-capture textarea { background:rgba(3,5,17,.61); border:1px solid rgba(125,157,255,.27); border-radius:11px 11px 4px 11px; box-sizing:border-box; color:var(--top-ink); font:inherit; font-size:12px; outline:0; padding:11px; width:100%; }.evidence-capture textarea { min-height:72px; resize:vertical; }.evidence-capture input:focus,.evidence-capture select:focus,.evidence-capture textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.capture-actions { align-items:center; display:flex; gap:18px; justify-content:space-between; margin-top:2px; }.capture-actions small { color:var(--top-muted); font-size:10px; line-height:1.45; max-width:360px; }.capture-actions small.error { color:#ffc4dd; }.capture-actions button,.capture-empty button { background:rgba(98,230,255,.12); border:1px solid rgba(98,230,255,.63); border-radius:999px; color:var(--top-cyan); cursor:pointer; flex:0 0 auto; font-family:var(--top-mono); font-size:9px; font-weight:800; padding:11px 13px; transition:.2s ease; }.capture-actions button:hover:not(:disabled),.capture-empty button:hover { background:rgba(98,230,255,.2); transform:translateY(-2px); }.capture-actions button:disabled { cursor:wait; opacity:.5; }.capture-actions button span { font-size:14px; margin-left:4px; }.capture-empty { align-items:center; background:rgba(3,5,17,.34); border:1px dashed rgba(126,158,255,.24); display:flex; gap:16px; justify-content:space-between; margin-top:21px; padding:13px; }.capture-empty p { color:var(--top-muted); font-size:11px; line-height:1.55; margin:0; max-width:510px; }.blocked { opacity:.8; }
@media (max-width:620px) { .evidence-capture form { grid-template-columns:1fr; }.evidence-capture label.context,.capture-actions { grid-column:span 1; }.capture-actions,.capture-empty { align-items:flex-start; flex-direction:column; gap:10px; }.capture-actions button,.capture-empty button { width:100%; } }
</style>
