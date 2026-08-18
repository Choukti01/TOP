<template>
  <section class="surface" aria-live="polite">
    <header class="surface-header">
      <div>
        <span class="eyebrow">{{ eyebrow }}</span>
        <h1>{{ heading }}</h1>
        <p>{{ description }}</p>
      </div>
      <button class="exit" type="button" @click="returnToMap">Return to universe <span>↗</span></button>
    </header>

    <div v-if="WorkspaceState.dashboard" class="surface-content">
      <template v-if="WorkspaceState.activeSection === 'Projects'">
        <article v-for="project in WorkspaceState.dashboard.projects" :key="project.id" class="project-card">
          <div class="card-topline"><span>{{ project.category }}</span><strong>{{ project.momentum }}% momentum</strong></div>
          <h2>{{ project.title }}</h2>
          <p>{{ project.nextMove }}</p>
          <footer>
            <span>{{ project.signal }}</span>
            <button type="button" @click="openProject(project.id)">Open project</button>
          </footer>
        </article>
        <button class="create-card" type="button" @click="WorkspaceState.seedComposerOpen = true">
          <span>+</span><strong>Plant a Seed</strong><small>Start an idea before it becomes a project.</small>
        </button>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'Knowledge'">
        <button v-for="item in WorkspaceState.dashboard.knowledge" :key="item.id" class="resource-card" type="button" @click="showInsight(item.title, item.detail)">
          <span>{{ item.format }}</span><h2>{{ item.title }}</h2><p>{{ item.detail }}</p><i>Open note ↗</i>
        </button>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'Research'">
        <button v-for="question in WorkspaceState.dashboard.research" :key="question.id" class="resource-card research" type="button" @click="showInsight(question.title, question.detail)">
          <span>OPEN QUESTION</span><h2>{{ question.title }}</h2><p>{{ question.detail }}</p><i>Explore direction ↗</i>
        </button>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'Assets'">
        <button v-for="asset in WorkspaceState.dashboard.assets" :key="asset.id" class="resource-card asset" type="button" @click="showInsight(asset.title, asset.detail)">
          <span>{{ asset.type }}</span><h2>{{ asset.title }}</h2><p>{{ asset.detail }}</p><i>Pin to workspace ↗</i>
        </button>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'Worlds'">
        <button v-for="world in WorkspaceState.dashboard.worlds" :key="world.id" class="world-card" type="button" @click="openProject(world.id)">
          <span :style="{ background: world.color }"></span><div><h2>{{ world.title }}</h2><p>{{ world.description }}</p></div><i>Enter ↗</i>
        </button>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'AI'">
        <div class="focus-intro">
          <span class="eyebrow">TOP FOCUS GUIDE</span>
          <h2>Use intelligence to protect attention—not capture it.</h2>
          <p>The guide looks for the next meaningful move in your current projects. Your judgment stays in charge.</p>
          <button class="accent" type="button" :disabled="focusLoading" @click="requestFocus()">
            {{ focusLoading ? 'Reading your universe…' : 'Find my next move' }}
          </button>
        </div>
        <article v-if="focus" class="focus-result">
          <span>FOCUS SIGNAL</span><h2>{{ focus.title }}</h2><strong>{{ focus.action }}</strong><p>{{ focus.reason }}</p>
        </article>
        <div class="project-pills">
          <button v-for="project in WorkspaceState.dashboard.projects" :key="project.id" type="button" @click="requestFocus(project.id)">{{ project.title }}</button>
        </div>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'Reflection'">
        <form class="reflection-form" @submit.prevent="submitReflection">
          <span class="eyebrow">WEEKLY REFLECTION</span>
          <h2>What are you proud of building this week?</h2>
          <p>Reflection turns effort into learning. Keep it honest, concrete, and yours.</p>
          <textarea v-model="reflection" maxlength="800" placeholder="I am proud that I…"></textarea>
          <div><small>{{ reflection.length }}/800</small><button class="accent" :disabled="reflectionSaving" type="submit">{{ reflectionSaving ? 'Saving…' : 'Save reflection' }}</button></div>
          <strong v-if="reflectionMessage" class="success">{{ reflectionMessage }}</strong>
        </form>
      </template>

      <article v-if="insight" class="insight">
        <span>IN YOUR WORKSPACE</span><h2>{{ insight.title }}</h2><p>{{ insight.detail }}</p>
        <button type="button" @click="insight = null">Close note</button>
      </article>
    </div>

    <div v-else class="loading-state"><span></span>Loading your workspace intelligence…</div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { getFocusSuggestion, saveWorkspaceReflection, type FocusSuggestion } from "../../lib/api";
import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const focus = ref<FocusSuggestion | null>(null);
const focusLoading = ref(false);
const reflection = ref("");
const reflectionSaving = ref(false);
const reflectionMessage = ref("");
const insight = ref<{ title: string; detail: string } | null>(null);

const copy = {
  Projects: ["LIFE PROJECTS", "Projects that make the real world different.", "Every project is a promise made visible through consistent work."],
  Knowledge: ["KNOWLEDGE LIBRARY", "Knowledge that earns its place through use.", "Keep only what sharpens your craft, expands your curiosity, or helps someone else."],
  Research: ["CURIOSITY ENGINE", "Questions worth following.", "TOP should widen your perspective, not narrow it to what already gets your attention."],
  AI: ["ATTENTION, PROTECTED", "A guide for your next meaningful move.", "Useful intelligence should help you leave the screen with clarity, not stay on it longer."],
  Assets: ["CREATOR TOOLKIT", "Working materials for real projects.", "Templates, principles, and rituals that turn intent into contribution."],
  Worlds: ["YOUR WORLDS", "Enter the work you are building.", "A world is more than a profile. It is a direction that can gather people and momentum."],
  Reflection: ["REFLECTION", "Make the learning visible.", "Growth is easier to continue when you notice what you have already built."]
} as const;

const activeCopy = computed(() => copy[WorkspaceState.activeSection as Exclude<keyof typeof copy, "Overview">] ?? copy.Projects);
const eyebrow = computed(() => activeCopy.value[0]);
const heading = computed(() => activeCopy.value[1]);
const description = computed(() => activeCopy.value[2]);

function returnToMap(): void {
  WorkspaceState.activeSection = "Overview";
  insight.value = null;
}

function openProject(id: string): void {
  WorkspaceState.activeSection = "Overview";
  workspaceEngine.select(id);
}

function showInsight(title: string, detail: string): void {
  insight.value = { title, detail };
  workspaceEngine.notify(`${title} is now in focus.`);
}

async function requestFocus(projectId?: string): Promise<void> {
  focusLoading.value = true;

  try {
    focus.value = await getFocusSuggestion(projectId);
  } catch (error) {
    workspaceEngine.notify(error instanceof Error ? error.message : "TOP Focus Guide is unavailable right now.");
  } finally {
    focusLoading.value = false;
  }
}

async function submitReflection(): Promise<void> {
  reflectionMessage.value = "";

  try {
    reflectionSaving.value = true;
    const result = await saveWorkspaceReflection(reflection.value);
    reflectionMessage.value = result.message;
    reflection.value = "";
    workspaceEngine.notify("Reflection saved to your practice.");
  } catch (error) {
    workspaceEngine.notify(error instanceof Error ? error.message : "Your reflection could not be saved.");
  } finally {
    reflectionSaving.value = false;
  }
}
</script>

<style scoped>
.surface { animation: surface-in 420ms cubic-bezier(.2,.85,.3,1) both; background: radial-gradient(circle at 70% 12%,rgba(94,160,255,.12),transparent 26%),rgba(5,10,21,.94); inset:0; overflow:auto; padding: clamp(34px,6vw,86px); position:absolute; z-index:60; }
.surface::before { background-image: linear-gradient(rgba(157,196,244,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(157,196,244,.04) 1px,transparent 1px); background-size:46px 46px; content:""; inset:0; mask-image:linear-gradient(to bottom,black,transparent 80%); pointer-events:none; position:absolute; }
.surface-header,.surface-content { margin:0 auto; max-width:1040px; position:relative; }
.surface-header { align-items:flex-start; display:flex; gap:32px; justify-content:space-between; margin-bottom:42px; }
.eyebrow,.card-topline span,.focus-result span,.insight span { color:#8ecbff; font-size:10px; font-weight:750; letter-spacing:.16em; text-transform:uppercase; }
h1,h2,p { margin:0; } h1 { font-size:clamp(30px,4vw,52px); font-weight:500; letter-spacing:-.05em; margin-top:10px; max-width:670px; } .surface-header p { color:rgba(214,229,247,.58); font-size:14px; line-height:1.65; margin-top:14px; max-width:650px; }
.exit { background:rgba(148,191,244,.07); border:1px solid rgba(148,191,244,.15); border-radius:999px; color:#d9ecff; cursor:pointer; flex:0 0 auto; font-size:12px; padding:11px 15px; transition:background .2s ease,transform .2s ease; }.exit:hover { background:rgba(112,184,255,.16); transform:translateY(-2px); }.exit span { color:#83c6ff; font-size:15px; margin-left:4px; }
.surface-content { display:grid; gap:16px; grid-template-columns:repeat(3,minmax(0,1fr)); padding-bottom:40px; }
.project-card,.resource-card,.world-card,.focus-intro,.focus-result,.reflection-form,.insight,.create-card { background:linear-gradient(145deg,rgba(18,32,56,.88),rgba(8,16,30,.86)); border:1px solid rgba(159,197,244,.12); border-radius:20px; color:#eff6ff; overflow:hidden; padding:22px; position:relative; text-align:left; }.project-card { min-height:238px; }.card-topline { align-items:center; display:flex; justify-content:space-between; }.card-topline strong { color:rgba(211,231,253,.52); font-size:10px; font-weight:650; }.project-card h2,.resource-card h2,.world-card h2 { font-size:22px; font-weight:520; letter-spacing:-.03em; margin:29px 0 9px; }.project-card p,.resource-card p,.world-card p { color:rgba(213,230,249,.6); font-size:13px; line-height:1.55; }.project-card footer { border-top:1px solid rgba(159,197,244,.1); bottom:0; display:flex; gap:14px; justify-content:space-between; left:22px; padding:14px 0; position:absolute; right:22px; }.project-card footer span { color:rgba(209,229,250,.45); font-size:10px; line-height:1.4; max-width:170px; }.project-card footer button,.insight button { background:transparent; border:0; color:#90ccff; cursor:pointer; font-size:11px; font-weight:700; white-space:nowrap; }
.create-card { align-items:flex-start; background:linear-gradient(145deg,rgba(116,184,255,.14),rgba(73,105,171,.06)); cursor:pointer; display:flex; flex-direction:column; justify-content:center; min-height:238px; transition:border-color .2s ease,transform .2s ease; }.create-card:hover { border-color:rgba(131,202,255,.55); transform:translateY(-4px); }.create-card span { align-items:center; background:#8ecbff; border-radius:50%; color:#06203c; display:flex; font-size:22px; height:37px; justify-content:center; margin-bottom:20px; width:37px; }.create-card strong { font-size:20px; }.create-card small { color:rgba(216,233,252,.56); font-size:12px; line-height:1.5; margin-top:8px; }
.resource-card { cursor:pointer; min-height:215px; transition:border-color .2s ease,transform .2s ease,background .2s ease; }.resource-card:hover,.world-card:hover { background:linear-gradient(145deg,rgba(25,47,79,.95),rgba(10,20,37,.92)); border-color:rgba(126,195,255,.38); transform:translateY(-4px); }.resource-card span { color:#a8d4ff; font-size:10px; font-weight:700; letter-spacing:.13em; }.resource-card h2 { margin:21px 0 9px; }.resource-card i { bottom:19px; color:#80c6ff; font-size:11px; font-style:normal; font-weight:700; left:22px; position:absolute; }.world-card { align-items:center; cursor:pointer; display:flex; gap:15px; grid-column:span 3; min-height:128px; transition:border-color .2s ease,transform .2s ease; }.world-card > span { border-radius:50%; box-shadow:0 0 24px currentColor; height:11px; width:11px; }.world-card h2 { margin:0 0 7px; }.world-card i { color:#83c6ff; font-size:15px; font-style:normal; margin-left:auto; }
.focus-intro,.focus-result,.reflection-form { grid-column:span 3; }.focus-intro { background:radial-gradient(circle at 80% 30%,rgba(118,93,255,.22),transparent 25%),linear-gradient(145deg,rgba(17,31,55,.95),rgba(7,14,28,.9)); padding:clamp(28px,5vw,58px); }.focus-intro h2 { font-size:clamp(27px,4vw,45px); font-weight:500; letter-spacing:-.045em; line-height:1.06; margin:14px 0; max-width:680px; }.focus-intro p { color:rgba(219,234,253,.65); line-height:1.65; max-width:600px; }.accent { background:linear-gradient(135deg,#a98aff,#78baff); border:0; border-radius:11px; box-shadow:0 14px 38px rgba(107,137,255,.25); color:#0b1230; cursor:pointer; font-size:13px; font-weight:800; margin-top:25px; padding:13px 17px; transition:transform .2s ease,box-shadow .2s ease; }.accent:hover:not(:disabled) { box-shadow:0 18px 42px rgba(107,137,255,.42); transform:translateY(-3px); }.accent:disabled { cursor:wait; opacity:.7; }.focus-result { background:linear-gradient(145deg,rgba(28,22,63,.88),rgba(12,19,40,.9)); }.focus-result h2 { font-size:18px; margin:14px 0 13px; }.focus-result strong { color:#eff5ff; display:block; font-size:22px; font-weight:520; max-width:730px; }.focus-result p { color:rgba(217,230,251,.63); line-height:1.65; margin-top:13px; max-width:750px; }.project-pills { display:flex; flex-wrap:wrap; gap:9px; grid-column:span 3; }.project-pills button { background:rgba(149,193,248,.08); border:1px solid rgba(149,193,248,.14); border-radius:999px; color:rgba(221,237,255,.78); cursor:pointer; font-size:12px; padding:10px 14px; }.project-pills button:hover { border-color:#a58bff; color:#fff; }
.reflection-form { padding:clamp(28px,5vw,56px); }.reflection-form h2 { font-size:clamp(28px,4vw,45px); font-weight:500; letter-spacing:-.045em; margin:14px 0 12px; max-width:750px; }.reflection-form p { color:rgba(216,232,251,.63); line-height:1.65; max-width:640px; }.reflection-form textarea { background:rgba(4,10,20,.65); border:1px solid rgba(161,201,247,.15); border-radius:15px; color:#edf6ff; font:inherit; height:150px; margin-top:28px; outline:0; padding:15px; resize:vertical; width:100%; }.reflection-form textarea:focus { border-color:#83c6ff; box-shadow:0 0 0 3px rgba(131,198,255,.1); }.reflection-form > div { align-items:center; display:flex; justify-content:space-between; }.reflection-form small { color:rgba(208,227,249,.42); font-size:11px; }.success { color:#78e4b8; display:block; font-size:13px; margin-top:20px; }.insight { grid-column:span 3; }.insight h2 { font-size:20px; margin:13px 0 8px; }.insight p { color:rgba(216,232,251,.65); line-height:1.6; }.insight button { margin-top:16px; padding:0; }.loading-state { align-items:center; color:rgba(211,230,251,.6); display:flex; font-size:13px; gap:10px; justify-content:center; min-height:300px; position:relative; }.loading-state span { animation:pulse 1.2s ease-in-out infinite; background:#89c8ff; border-radius:50%; box-shadow:0 0 16px #89c8ff; height:8px; width:8px; }
@keyframes surface-in { from { opacity:0; transform:translateY(18px) scale(.985); } to { opacity:1; transform:none; } } @keyframes pulse { 50% { opacity:.25; transform:scale(.65); } }
@media (max-width:800px) { .surface { padding:28px 20px; }.surface-header { flex-direction:column; margin-bottom:28px; }.surface-content { grid-template-columns:1fr; }.project-card,.resource-card,.world-card,.focus-intro,.focus-result,.reflection-form,.insight,.project-pills { grid-column:span 1; }.world-card { min-height:150px; } }
</style>
