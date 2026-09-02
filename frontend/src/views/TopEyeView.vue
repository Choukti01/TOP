<template>
  <main class="topeye-page">
    <div class="topeye-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>

    <header class="topeye-header">
      <button class="topeye-brand" type="button" aria-label="Return to TOP Page" @click="router.push('/top')"><img :src="topLogoUrl" alt="TOP" /></button>
      <div class="topeye-title"><span>TOP INTELLIGENCE</span><strong>T0PEYE</strong><small>See further. Build real.</small></div>
      <nav aria-label="T0PEYE navigation"><button type="button" @click="router.push('/top')">TOP Page</button><button type="button" @click="router.push('/field')">Private Field</button><button type="button" @click="router.push('/profile')">Profile</button></nav>
    </header>

    <section class="topeye-shell">
      <aside class="thread-rail" aria-label="T0PEYE spaces">
        <button class="new-space" type="button" :disabled="creating" @click="createSpace()"><i>+</i><span><small>NEW SPACE</small><strong>{{ creating ? 'Opening…' : 'Start fresh' }}</strong></span></button>

        <div class="rail-heading"><span>YOUR SPACES</span><small>{{ threads.length }}</small></div>
        <p v-if="loading" class="rail-state">Finding your private spaces…</p>
        <p v-else-if="threads.length === 0" class="rail-state">Nothing is stored here yet. Start where your attention wants to go.</p>
        <ol v-else class="thread-list">
          <li v-for="item in threads" :key="item.id" :class="{ active: thread?.id === item.id }">
            <button type="button" @click="openThread(item.id)"><i>{{ modeMark(item.mode) }}</i><span><strong>{{ item.title }}</strong><small>{{ modeLabel(item.mode) }} · {{ formatTime(item.updatedAt) }}</small></span></button>
            <button class="delete-thread" type="button" :aria-label="`Delete ${item.title}`" @click="removeThread(item)">×</button>
          </li>
        </ol>

        <div class="rail-foot"><span><i :class="{ live: status?.configured }"></i>{{ status?.configured ? 'LOCAL CORE READY' : status?.runtime?.engine === 'ollama' ? 'LOCAL CORE AWAITS MODEL' : 'LOCAL MODE ONLY' }}</span><button type="button" @click="router.push('/field')">Back to Field <b>↗</b></button></div>
      </aside>

      <section class="eye-stage">
        <template v-if="!thread">
          <section class="eye-arrival">
            <div class="eye-symbol" aria-hidden="true"><i></i><i></i><b></b></div>
            <span>T0PEYE FOUNDATION</span>
            <h1>What do you want<br />to <em>bring into view?</em></h1>
            <p>T0PEYE is your private intelligence space for thinking, planning, coding, researching, and making. Work can become an artifact, then enter your Field when you decide it is ready.</p>
            <div class="mode-grid" aria-label="Choose a way to work">
              <button v-for="option in modes" :key="option.id" type="button" @click="createSpace(option.id, option.prompt)"><i>{{ option.mark }}</i><span><strong>{{ option.label }}</strong><small>{{ option.description }}</small></span><b>↗</b></button>
            </div>
          </section>
        </template>

        <template v-else>
          <header class="conversation-head">
            <div><span>{{ modeLabel(thread.mode).toUpperCase() }} SPACE</span><h1>{{ thread.title }}</h1><p>{{ projectName || 'Private to you. No Field or project context is shared until you choose it.' }}</p></div>
            <div class="context-picker"><label for="topeye-project">CONTEXT</label><select id="topeye-project" v-model="selectedProjectId" :disabled="thread.messages.length > 0 || contextSaving" @change="saveProjectContext"><option value="">Private T0PEYE space</option><option v-for="project in projects" :key="project.id" :value="project.id">{{ project.title }}</option></select><small v-if="thread.messages.length > 0">Context is set when a space begins.</small><small v-else-if="contextSaving">Protecting context…</small></div>
          </header>

          <p v-if="error" class="eye-error" role="alert">{{ error }}</p>
          <section v-if="!status?.configured" class="connection-notice"><i>◌</i><div><strong>{{ status?.runtime?.engine === 'ollama' ? 'T0PEYE is waiting for its local core.' : 'T0PEYE runs from a local TOP studio.' }}</strong><p>{{ runtimeMessage }}</p><small v-if="installedModelNames">Models found on this machine: {{ installedModelNames }}</small><small v-else-if="status?.runtime?.requestedModel">Requested local profile: {{ status.runtime.requestedModel }}</small></div></section>

          <section ref="conversationEl" class="conversation" aria-live="polite">
            <div v-if="thread.messages.length === 0" class="empty-conversation"><span>THIS SPACE IS LISTENING</span><h2>Begin with the raw version.</h2><p>You can arrive with a question, half-formed idea, problem, file plan, code goal, or a direction that has not found its words yet.</p></div>
            <article v-for="message in thread.messages" :key="message.id" class="message" :class="message.role">
              <header><span>{{ message.role === 'assistant' ? 'T0PEYE' : authState.user?.displayName || 'YOU' }}</span><time>{{ formatTime(message.createdAt) }}</time></header>
              <p>{{ message.content }}</p>
              <footer v-if="message.role === 'assistant'"><small>{{ message.model || 'T0PEYE' }}</small><button type="button" :disabled="savingArtifactId === message.id" @click="saveArtifact(message)">{{ savingArtifactId === message.id ? 'Saving…' : 'Keep as artifact' }} <i>↗</i></button></footer>
            </article>
            <div v-if="sending" class="thinking" role="status"><i></i>T0PEYE is shaping a response…</div>
          </section>

          <form class="eye-composer" @submit.prevent="send">
            <div class="mode-strip" aria-label="T0PEYE mode">
              <button v-for="option in modes" :key="option.id" type="button" :class="{ active: mode === option.id }" :disabled="thread.messages.length > 0" @click="mode = option.id">{{ option.mark }} {{ option.label }}</button>
            </div>
            <textarea v-model.trim="draft" maxlength="12000" :disabled="sending || !status?.configured" :placeholder="status?.configured ? composerPlaceholder : runtimeMessage" @keydown.meta.enter.prevent="send" @keydown.ctrl.enter.prevent="send"></textarea>
            <footer><small>{{ draft.length }}/12000 <span>·</span> {{ status?.configured ? '⌘ / Ctrl + Enter to send' : 'T0PEYE only speaks with the local model you choose to run on this machine.' }}</small><button type="submit" :disabled="sending || !status?.configured || draft.length < 1">{{ sending ? 'Thinking…' : 'Send to T0PEYE' }} <i>↗</i></button></footer>
          </form>
        </template>
      </section>

      <aside class="artifact-rail">
        <div class="artifact-heading"><span>T0PEYE LIBRARY</span><small>{{ artifacts.length }} kept</small></div>
        <p class="artifact-intro">Useful outputs stay yours. Keep a plan, draft, code idea, research note, or design direction before you decide where it belongs.</p>
        <ol v-if="artifacts.length" class="artifact-list"><li v-for="artifact in artifacts.slice(0, 8)" :key="artifact.id"><span>{{ artifact.kind }}</span><strong>{{ artifact.title }}</strong><p>{{ artifact.content }}</p><small>{{ formatTime(artifact.updatedAt) }}<template v-if="artifact.projectId"> · Field-linked</template></small></li></ol>
        <div v-else class="artifact-empty"><i>✦</i><strong>Your first kept artifact will appear here.</strong><p>T0PEYE never treats an answer as finished work until you choose to keep it.</p></div>
        <div class="capability-list"><span>FOUNDATION</span><p><i>✓</i> Private conversations</p><p><i>✓</i> Project-aware spaces</p><p><i>✓</i> Kept artifacts</p><p><i>{{ status?.configured ? '✓' : '◌' }}</i> Local model engine</p><p><i>◌</i> Consent memory and tools next</p></div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { authState } from "../lib/auth";
import { topLogoUrl } from "../lib/brand";
import {
  createTopEyeArtifact,
  createTopEyeThread,
  deleteTopEyeThread,
  getPersonalDashboard,
  getTopEyeArtifacts,
  getTopEyeStatus,
  getTopEyeThread,
  getTopEyeThreads,
  sendTopEyeMessage,
  updateTopEyeThreadProject,
  type TopEyeArtifact,
  type TopEyeArtifactKind,
  type TopEyeMessage,
  type TopEyeMode,
  type TopEyeStatus,
  type TopEyeThread,
  type TopEyeThreadDetail,
  type WorkspaceProject
} from "../lib/api";

const router = useRouter();
const thread = ref<TopEyeThreadDetail | null>(null);
const threads = ref<TopEyeThread[]>([]);
const artifacts = ref<TopEyeArtifact[]>([]);
const projects = ref<WorkspaceProject[]>([]);
const status = ref<TopEyeStatus | null>(null);
const mode = ref<TopEyeMode>("chat");
const selectedProjectId = ref("");
const draft = ref("");
const loading = ref(true);
const creating = ref(false);
const sending = ref(false);
const contextSaving = ref(false);
const savingArtifactId = ref("");
const error = ref("");
const conversationEl = ref<HTMLElement | null>(null);

const modes: Array<{ id: TopEyeMode; label: string; mark: string; description: string; prompt: string }> = [
  { id: "chat", label: "Chat", mark: "◌", description: "Think aloud, untangle, and decide.", prompt: "Help me think clearly about…" },
  { id: "plan", label: "Plan", mark: "△", description: "Shape an idea into a real path.", prompt: "Turn this into a practical plan: …" },
  { id: "code", label: "Code", mark: "⌘", description: "Design, write, and improve software.", prompt: "Help me build this in code: …" },
  { id: "research", label: "Research", mark: "⌕", description: "Investigate without losing the truth.", prompt: "Help me research this question carefully: …" },
  { id: "create", label: "Create", mark: "✦", description: "Make a draft worth returning to.", prompt: "Help me create a first version of…" }
];

const projectName = computed(() => projects.value.find((project) => project.id === thread.value?.projectId)?.title ?? "");
const runtimeMessage = computed(() => status.value?.runtime?.message ?? "T0PEYE is preparing its local engine.");
const installedModelNames = computed(() => status.value?.runtime?.installedModels.map((item) => item.name).join(", ") ?? "");
const composerPlaceholder = computed(() => ({
  chat: "Ask T0PEYE anything. Begin messy if you need to.",
  plan: "What do you want to make real? Include the outcome, constraints, and what is already true.",
  code: "Describe the software, bug, feature, or code you want to build.",
  research: "Name the question, what you need to decide, and the sources or perspectives that matter.",
  create: "Describe what you want to make, who it is for, and what it should make possible."
}[mode.value]));

function modeLabel(value: TopEyeMode): string { return modes.find((item) => item.id === value)?.label ?? "Chat"; }
function modeMark(value: TopEyeMode): string { return modes.find((item) => item.id === value)?.mark ?? "◌"; }
function artifactKind(): TopEyeArtifactKind {
  const kinds: Record<TopEyeMode, TopEyeArtifactKind> = { chat: "note", plan: "plan", code: "code", research: "research", create: "document" };
  return kinds[thread.value?.mode ?? mode.value];
}
function formatTime(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Now" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date); }

async function loadFoundation(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const [statusResult, threadsResult, artifactsResult] = await Promise.all([getTopEyeStatus(), getTopEyeThreads(), getTopEyeArtifacts()]);
    status.value = statusResult;
    threads.value = threadsResult.threads;
    artifacts.value = artifactsResult.artifacts;
    try { projects.value = (await getPersonalDashboard()).projects; } catch { projects.value = []; }
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "T0PEYE could not open your private foundation.";
  } finally { loading.value = false; }
}

async function createSpace(nextMode = mode.value, prompt = ""): Promise<void> {
  creating.value = true;
  error.value = "";
  try {
    const result = await createTopEyeThread({ title: `${modeLabel(nextMode)} space`, mode: nextMode, ...(selectedProjectId.value ? { projectId: selectedProjectId.value } : {}) });
    thread.value = { ...result.thread, messages: [] };
    threads.value = [result.thread, ...threads.value];
    mode.value = nextMode;
    draft.value = prompt;
  } catch (reason) { error.value = reason instanceof Error ? reason.message : "T0PEYE could not open that private space."; } finally { creating.value = false; }
}

async function openThread(id: string): Promise<void> {
  error.value = "";
  try {
    const result = await getTopEyeThread(id);
    thread.value = result.thread;
    mode.value = result.thread.mode;
    selectedProjectId.value = result.thread.projectId ?? "";
    draft.value = "";
    await scrollConversation();
  } catch (reason) { error.value = reason instanceof Error ? reason.message : "That T0PEYE space could not be opened."; }
}

async function removeThread(item: TopEyeThread): Promise<void> {
  if (!window.confirm(`Delete “${item.title}”? This removes its private conversation, but kept artifacts stay in your T0PEYE Library.`)) return;
  error.value = "";
  try {
    await deleteTopEyeThread(item.id);
    threads.value = threads.value.filter((entry) => entry.id !== item.id);
    if (thread.value?.id === item.id) { thread.value = null; draft.value = ""; }
  } catch (reason) { error.value = reason instanceof Error ? reason.message : "That T0PEYE space could not be deleted."; }
}

async function send(): Promise<void> {
  if (!thread.value || !status.value?.configured || !draft.value || sending.value) return;
  sending.value = true;
  error.value = "";
  const content = draft.value;
  draft.value = "";
  try {
    const result = await sendTopEyeMessage(thread.value.id, content);
    thread.value = { ...thread.value, messages: [...thread.value.messages, result.userMessage, result.assistantMessage], updatedAt: result.assistantMessage.createdAt };
    threads.value = [thread.value, ...threads.value.filter((entry) => entry.id !== thread.value?.id)];
    await scrollConversation();
  } catch (reason) { draft.value = content; error.value = reason instanceof Error ? reason.message : "T0PEYE could not complete that response."; } finally { sending.value = false; }
}

async function saveProjectContext(): Promise<void> {
  if (!thread.value || thread.value.messages.length > 0 || contextSaving.value) return;
  contextSaving.value = true;
  error.value = "";
  try {
    const result = await updateTopEyeThreadProject(thread.value.id, selectedProjectId.value || null);
    thread.value = { ...thread.value, ...result.thread, messages: thread.value.messages };
    threads.value = threads.value.map((item) => item.id === result.thread.id ? result.thread : item);
  } catch (reason) {
    selectedProjectId.value = thread.value.projectId ?? "";
    error.value = reason instanceof Error ? reason.message : "T0PEYE could not protect that project context.";
  } finally { contextSaving.value = false; }
}

async function saveArtifact(message: TopEyeMessage): Promise<void> {
  if (!thread.value || savingArtifactId.value) return;
  savingArtifactId.value = message.id;
  error.value = "";
  try {
    const firstLine = message.content.replace(/\s+/g, " ").trim().slice(0, 74);
    const result = await createTopEyeArtifact({ threadId: thread.value.id, projectId: thread.value.projectId, kind: artifactKind(), title: firstLine || `${modeLabel(thread.value.mode)} artifact`, content: message.content });
    artifacts.value = [result.artifact, ...artifacts.value];
  } catch (reason) { error.value = reason instanceof Error ? reason.message : "T0PEYE could not keep that artifact."; } finally { savingArtifactId.value = ""; }
}

async function scrollConversation(): Promise<void> {
  await nextTick();
  conversationEl.value?.scrollTo({ top: conversationEl.value.scrollHeight, behavior: "smooth" });
}

onMounted(() => { void loadFoundation(); });
</script>

<style scoped>
.topeye-page { background:#040611; color:var(--top-ink); min-height:100dvh; overflow:hidden; padding:clamp(22px,3vw,42px); position:relative; }.topeye-atmosphere,.topeye-atmosphere i { inset:0; pointer-events:none; position:absolute; }.topeye-atmosphere { overflow:hidden; }.topeye-atmosphere::before { background:radial-gradient(circle at 49% 38%,rgba(89,89,255,.2),transparent 22%),radial-gradient(circle at 15% 86%,rgba(63,224,255,.11),transparent 28%),radial-gradient(circle at 93% 9%,rgba(255,113,190,.1),transparent 23%); content:""; inset:0; position:absolute; }.topeye-atmosphere i { border:1px solid rgba(112,149,255,.1); border-radius:50%; height:66vw; left:44%; top:-40vw; transform:translateX(-50%); width:66vw; }.topeye-atmosphere i:nth-child(2) { height:41vw; left:71%; top:47%; width:41vw; }.topeye-atmosphere i:nth-child(3) { height:29vw; left:-4%; top:42%; width:29vw; }.topeye-header,.topeye-shell { margin:0 auto; max-width:1530px; position:relative; z-index:1; }.topeye-header { align-items:center; display:grid; gap:17px; grid-template-columns:auto minmax(0,1fr) auto; }.topeye-brand { background:transparent; border:0; cursor:pointer; padding:0; }.topeye-brand img { display:block; filter:drop-shadow(0 0 16px rgba(98,230,255,.44)); height:61px; object-fit:contain; width:61px; }.topeye-title { display:flex; gap:13px; align-items:baseline; }.topeye-title span,.topeye-title small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.13em; }.topeye-title strong { color:var(--top-ink); font-family:var(--top-display); font-size:35px; letter-spacing:-.065em; line-height:1; }.topeye-title strong::first-letter { color:var(--top-cyan); }.topeye-header nav { display:flex; gap:7px; }.topeye-header nav button { background:rgba(7,11,29,.57); border:1px solid rgba(122,154,255,.22); border-radius:999px; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:10px 12px; transition:.2s ease; }.topeye-header nav button:hover { border-color:var(--top-cyan); color:var(--top-ink); transform:translateY(-2px); }.topeye-shell { display:grid; gap:15px; grid-template-columns:235px minmax(0,1fr) 270px; margin-top:28px; min-height:calc(100dvh - 140px); }.thread-rail,.eye-stage,.artifact-rail { background:linear-gradient(145deg,rgba(17,25,63,.78),rgba(6,9,27,.84)); border:1px solid rgba(123,156,255,.22); box-shadow:inset 0 1px rgba(230,240,255,.06),0 27px 70px rgba(0,0,0,.23); }.thread-rail,.artifact-rail { border-radius:22px 22px 7px 22px; display:flex; flex-direction:column; min-height:0; padding:13px; }.new-space { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#9d87ff 53%,var(--top-pink)); border:1px solid rgba(255,255,255,.47); border-radius:15px 15px 4px 15px; color:#07101d; cursor:pointer; display:flex; gap:11px; padding:11px; text-align:left; }.new-space:disabled { cursor:wait; opacity:.65; }.new-space i { align-items:center; background:rgba(4,9,26,.15); border-radius:50%; display:flex; font-size:23px; font-style:normal; height:30px; justify-content:center; width:30px; }.new-space small,.new-space strong { display:block; }.new-space small { font-family:var(--top-mono); font-size:7px; font-weight:900; letter-spacing:.1em; }.new-space strong { font-size:15px; line-height:1; margin-top:2px; }.rail-heading,.artifact-heading { align-items:center; color:var(--top-cyan); display:flex; font-family:var(--top-mono); font-size:8px; font-weight:800; justify-content:space-between; letter-spacing:.13em; margin:24px 4px 10px; }.rail-heading small,.artifact-heading small { color:var(--top-muted); }.rail-state { color:var(--top-muted); font-size:11px; line-height:1.6; margin:4px; }.thread-list,.artifact-list { list-style:none; margin:0; padding:0; }.thread-list { display:grid; gap:5px; overflow:auto; padding-right:2px; }.thread-list li { align-items:stretch; background:rgba(4,7,21,.34); border:1px solid transparent; border-radius:12px 12px 3px 12px; display:grid; grid-template-columns:minmax(0,1fr) 27px; overflow:hidden; }.thread-list li.active { background:rgba(98,230,255,.09); border-color:rgba(98,230,255,.42); }.thread-list li > button:first-child { background:transparent; border:0; color:inherit; cursor:pointer; display:flex; gap:8px; min-width:0; padding:10px; text-align:left; }.thread-list li > button:first-child > i { align-items:center; border:1px solid rgba(98,230,255,.42); border-radius:50%; color:var(--top-cyan); display:flex; flex:0 0 auto; font-family:var(--top-mono); font-size:11px; font-style:normal; height:21px; justify-content:center; width:21px; }.thread-list strong,.thread-list small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.thread-list strong { color:var(--top-ink); font-size:11px; }.thread-list small { color:var(--top-muted); font-family:var(--top-mono); font-size:7px; margin-top:3px; }.delete-thread { background:transparent; border:0; color:rgba(196,210,250,.44); cursor:pointer; font-size:15px; padding:0; }.delete-thread:hover { color:var(--top-pink); }.rail-foot { border-top:1px solid rgba(123,156,255,.14); margin-top:auto; padding:15px 4px 3px; }.rail-foot > span { color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:7px; gap:6px; letter-spacing:.08em; }.rail-foot > span i { background:var(--top-violet); border-radius:50%; box-shadow:0 0 10px var(--top-violet); height:5px; width:5px; }.rail-foot > span i.live { background:var(--top-lime); box-shadow:0 0 11px var(--top-lime); }.rail-foot button { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:8px; margin-top:12px; padding:0; }.rail-foot b { font-size:13px; margin-left:4px; }.eye-stage { border-radius:26px 26px 8px 26px; display:flex; flex-direction:column; min-height:0; overflow:hidden; }.eye-arrival { align-items:center; animation:eye-arrival .65s cubic-bezier(.16,.9,.25,1) both; display:flex; flex:1; flex-direction:column; justify-content:center; padding:clamp(34px,7vw,92px); text-align:center; }.eye-symbol { border:1px solid rgba(98,230,255,.45); border-radius:50%; height:71px; margin-bottom:27px; position:relative; width:71px; }.eye-symbol::before,.eye-symbol::after { border:1px solid rgba(156,124,255,.32); border-radius:50%; content:""; inset:9px; position:absolute; }.eye-symbol::after { inset:20px; }.eye-symbol i { background:var(--top-cyan); border-radius:50%; box-shadow:0 0 13px var(--top-cyan); height:5px; position:absolute; width:5px; }.eye-symbol i:first-child { left:15px; top:24px; }.eye-symbol i:nth-child(2) { bottom:17px; right:18px; }.eye-symbol b { background:var(--top-lime); border-radius:50%; box-shadow:0 0 11px var(--top-lime); height:7px; left:32px; position:absolute; top:14px; width:7px; }.eye-arrival > span,.conversation-head > div > span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:900; letter-spacing:.16em; }.eye-arrival h1 { font-family:var(--top-display); font-size:clamp(45px,6vw,82px); font-weight:700; letter-spacing:-.09em; line-height:.84; margin:19px 0; }.eye-arrival h1 em { color:#ad9bff; font-style:normal; }.eye-arrival > p { color:var(--top-muted); font-size:14px; line-height:1.75; max-width:620px; }.mode-grid { display:grid; gap:8px; grid-template-columns:repeat(5,minmax(0,1fr)); margin-top:37px; max-width:900px; width:100%; }.mode-grid button { align-items:flex-start; background:rgba(5,8,24,.48); border:1px solid rgba(123,156,255,.2); border-radius:15px 15px 4px 15px; color:var(--top-ink); cursor:pointer; display:flex; flex-direction:column; min-height:150px; padding:14px; text-align:left; transition:.25s ease; }.mode-grid button:hover { background:linear-gradient(145deg,rgba(98,230,255,.14),rgba(156,124,255,.17)); border-color:var(--top-cyan); transform:translateY(-5px); }.mode-grid i { color:var(--top-cyan); font-family:var(--top-mono); font-size:16px; font-style:normal; }.mode-grid span { margin-top:auto; }.mode-grid strong,.mode-grid small { display:block; }.mode-grid strong { font-family:var(--top-display); font-size:19px; letter-spacing:-.04em; }.mode-grid small { color:var(--top-muted); font-size:9px; line-height:1.42; margin-top:4px; }.mode-grid b { color:var(--top-pink); font-size:14px; margin:9px 0 0 auto; }.conversation-head { align-items:flex-start; border-bottom:1px solid rgba(123,156,255,.14); display:flex; gap:18px; justify-content:space-between; padding:24px 28px 19px; }.conversation-head h1 { font-family:var(--top-display); font-size:37px; letter-spacing:-.07em; line-height:.9; margin:10px 0 6px; }.conversation-head p { color:var(--top-muted); font-size:10px; line-height:1.5; margin:0; max-width:440px; }.context-picker { display:grid; gap:6px; max-width:205px; min-width:166px; }.context-picker label { color:var(--top-muted); font-family:var(--top-mono); font-size:7px; letter-spacing:.11em; }.context-picker select { background:rgba(3,6,19,.65); border:1px solid rgba(123,156,255,.28); border-radius:10px 10px 3px 10px; color:var(--top-ink); font:inherit; font-size:10px; min-width:0; outline:0; padding:9px; }.context-picker small { color:var(--top-muted); font-size:8px; line-height:1.35; }.eye-error { background:rgba(255,113,171,.09); border-left:2px solid var(--top-pink); color:#ffd8e7; font-size:11px; line-height:1.5; margin:14px 28px 0; padding:10px; }.connection-notice { align-items:flex-start; background:linear-gradient(100deg,rgba(156,124,255,.12),rgba(98,230,255,.05)); border-bottom:1px solid rgba(156,124,255,.22); display:flex; gap:10px; padding:12px 28px; }.connection-notice > i { color:var(--top-violet); font-family:var(--top-mono); font-size:16px; font-style:normal; }.connection-notice strong { color:var(--top-ink); display:block; font-size:11px; }.connection-notice p { color:var(--top-muted); font-size:10px; line-height:1.5; margin:4px 0 0; }.conversation { display:grid; flex:1; gap:13px; min-height:180px; overflow:auto; padding:22px 28px; scroll-behavior:smooth; }.empty-conversation { align-self:center; border:1px dashed rgba(98,230,255,.34); border-radius:19px 19px 5px 19px; margin:auto; max-width:600px; padding:30px; text-align:center; width:100%; }.empty-conversation span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; letter-spacing:.14em; }.empty-conversation h2 { font-family:var(--top-display); font-size:35px; letter-spacing:-.06em; margin:13px 0 8px; }.empty-conversation p { color:var(--top-muted); font-size:12px; line-height:1.65; margin:0; }.message { background:rgba(4,7,22,.52); border:1px solid rgba(123,156,255,.17); border-radius:17px 17px 4px 17px; max-width:min(83%,720px); padding:14px; }.message.user { justify-self:end; background:linear-gradient(145deg,rgba(55,42,109,.66),rgba(10,11,34,.72)); border-color:rgba(156,124,255,.38); }.message header,.message footer { align-items:center; display:flex; justify-content:space-between; }.message header span,.message time,.message footer small { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; font-weight:800; letter-spacing:.09em; }.message.user header span { color:var(--top-lime); }.message time,.message footer small { color:var(--top-muted); font-weight:500; }.message > p { color:rgba(234,241,255,.9); font-size:13px; line-height:1.68; margin:10px 0 0; white-space:pre-wrap; }.message footer { border-top:1px solid rgba(123,156,255,.13); margin-top:12px; padding-top:9px; }.message footer button { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:0; }.message footer button:disabled { cursor:wait; opacity:.6; }.message footer i { font-size:12px; font-style:normal; }.thinking { align-items:center; color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:9px; gap:8px; padding:8px; }.thinking i { animation:eye-pulse 1s ease-in-out infinite; background:var(--top-cyan); border-radius:50%; box-shadow:0 0 12px var(--top-cyan); height:7px; width:7px; }.eye-composer { background:rgba(5,7,21,.64); border-top:1px solid rgba(123,156,255,.17); padding:14px 22px 18px; }.mode-strip { display:flex; flex-wrap:wrap; gap:5px; }.mode-strip button { background:transparent; border:1px solid rgba(123,156,255,.18); border-radius:999px; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:7px 9px; }.mode-strip button.active { background:rgba(98,230,255,.11); border-color:var(--top-cyan); color:var(--top-ink); }.mode-strip button:disabled { cursor:not-allowed; opacity:.64; }.eye-composer textarea { background:rgba(3,5,17,.69); border:1px solid rgba(123,156,255,.3); border-radius:15px 15px 4px 15px; color:var(--top-ink); font:inherit; font-size:13px; line-height:1.55; margin-top:10px; min-height:90px; outline:0; padding:12px; resize:vertical; width:100%; }.eye-composer textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.eye-composer textarea:disabled { cursor:not-allowed; opacity:.58; }.eye-composer footer { align-items:center; display:flex; gap:10px; justify-content:space-between; margin-top:9px; }.eye-composer footer small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.eye-composer footer small span { color:var(--top-cyan); }.eye-composer footer button { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#9e87ff 52%,var(--top-pink)); border:1px solid rgba(255,255,255,.4); border-radius:999px; color:#07101d; cursor:pointer; display:flex; font-size:10px; font-weight:900; gap:12px; padding:11px 11px 11px 15px; }.eye-composer footer button:disabled { cursor:not-allowed; opacity:.53; }.eye-composer footer button i { background:rgba(5,9,25,.13); border-radius:50%; font-size:14px; font-style:normal; padding:2px 5px; }.artifact-intro { color:var(--top-muted); font-size:10px; line-height:1.6; margin:0 4px 16px; }.artifact-list { display:grid; gap:8px; overflow:auto; padding-right:2px; }.artifact-list li { background:rgba(4,7,22,.34); border-left:1px solid var(--top-violet); padding:10px; }.artifact-list span { color:var(--top-violet); display:block; font-family:var(--top-mono); font-size:7px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }.artifact-list strong { color:var(--top-ink); display:block; font-size:11px; line-height:1.35; margin-top:5px; }.artifact-list p { color:var(--top-muted); display:-webkit-box; font-size:9px; line-height:1.55; margin:5px 0; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:3; }.artifact-list small { color:rgba(184,200,239,.57); font-family:var(--top-mono); font-size:7px; }.artifact-empty { border:1px dashed rgba(156,124,255,.36); border-radius:15px 15px 4px 15px; margin:5px 0; padding:16px 13px; }.artifact-empty i { color:var(--top-violet); font-size:17px; font-style:normal; }.artifact-empty strong { color:var(--top-ink); display:block; font-size:11px; line-height:1.45; margin-top:8px; }.artifact-empty p { color:var(--top-muted); font-size:9px; line-height:1.55; margin:5px 0 0; }.capability-list { border-top:1px solid rgba(123,156,255,.14); margin-top:auto; padding:18px 4px 3px; }.capability-list > span { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; font-weight:800; letter-spacing:.13em; }.capability-list p { color:var(--top-muted); font-size:9px; margin:8px 0 0; }.capability-list i { color:var(--top-lime); font-family:var(--top-mono); font-style:normal; margin-right:5px; } @keyframes eye-arrival { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } } @keyframes eye-pulse { 50% { opacity:.25; transform:scale(.6); } }
@media (max-width:1120px) { .topeye-shell { grid-template-columns:216px minmax(0,1fr); }.artifact-rail { display:none; }.mode-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }.mode-grid button { min-height:122px; } }
@media (max-width:760px) { .topeye-page { min-height:100svh; overflow-x:clip; overflow-y:auto; padding:16px 14px calc(28px + env(safe-area-inset-bottom)); }.topeye-header { gap:10px; grid-template-columns:auto minmax(0,1fr); }.topeye-brand img { height:48px; width:48px; }.topeye-title { display:block; }.topeye-title span,.topeye-title small { display:block; }.topeye-title strong { display:block; font-size:31px; margin:2px 0; }.topeye-header nav { grid-column:1 / -1; overflow:auto; padding:2px 0 3px; }.topeye-header nav button { min-height:38px; white-space:nowrap; }.topeye-shell { display:block; margin-top:17px; min-height:0; }.thread-rail { border-radius:18px 18px 5px 18px; margin-bottom:12px; min-height:auto; padding:10px; }.new-space { display:inline-flex; width:auto; }.thread-list { display:flex; gap:6px; margin-top:4px; overflow:auto; }.thread-list li { flex:0 0 174px; }.rail-heading { margin-top:16px; }.rail-foot { display:none; }.eye-stage { min-height:calc(100svh - 250px); }.eye-arrival { padding:42px 18px; }.eye-arrival h1 { font-size:clamp(43px,14vw,62px); }.eye-arrival > p { font-size:13px; }.mode-grid { grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:26px; }.mode-grid button { min-height:114px; }.mode-grid button:last-child { grid-column:span 2; min-height:92px; }.conversation-head { flex-direction:column; padding:21px 18px 17px; }.conversation-head h1 { font-size:34px; }.context-picker { max-width:none; width:100%; }.connection-notice { padding:12px 18px; }.conversation { max-height:none; min-height:280px; padding:17px; }.message { max-width:94%; }.eye-composer { padding:13px; }.eye-composer footer { align-items:stretch; flex-direction:column; }.eye-composer footer button { justify-content:space-between; min-height:46px; }.artifact-rail { display:flex; margin-top:12px; min-height:260px; }.artifact-list { max-height:310px; }.capability-list { margin-top:17px; } }
@media (max-width:390px) { .mode-grid { grid-template-columns:1fr; }.mode-grid button:last-child { grid-column:auto; }.topeye-title small { display:none; }.conversation-head h1 { font-size:31px; }.mode-strip button { min-height:38px; }.thread-list li { flex-basis:158px; } }
@media (prefers-reduced-motion:reduce) { .eye-arrival,.thinking i { animation:none; }.mode-grid button:hover,.topeye-header nav button:hover { transform:none; } }
</style>
