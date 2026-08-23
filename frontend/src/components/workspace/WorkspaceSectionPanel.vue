<template>
  <section class="surface" :class="`surface--${WorkspaceState.activeSection.toLowerCase()}`" aria-live="polite">
    <header class="surface-header">
      <div>
        <span class="eyebrow">{{ eyebrow }}</span>
        <h1>{{ heading }}</h1>
        <p>{{ description }}</p>
      </div>
      <button class="exit" type="button" @click="returnToMap"><span>←</span> {{ exitLabel }}</button>
    </header>

    <div v-if="isNativeSection" class="surface-content">
      <Atelier v-if="WorkspaceState.activeSection === 'Atelier'" />
      <CraftStudio v-else-if="WorkspaceState.activeSection === 'Studio'" />
      <BlueprintBuilder v-else />
    </div>

    <div v-else-if="WorkspaceState.dashboard" class="surface-content">
      <template v-if="WorkspaceState.activeSection === 'Projects'">
        <article v-if="WorkspaceState.dashboard.projects.length === 0" class="empty-state">
          <span class="empty-mark" aria-hidden="true">+</span>
          <span class="eyebrow">NO DEMO WORK</span>
          <h2>Nothing here is pretending to be your project.</h2>
          <p>Start when you have something real you want to build, learn, practice, or change.</p>
          <button class="accent" type="button" @click="beginProject">Begin a real project</button>
        </article>

        <button v-for="project in WorkspaceState.dashboard.projects" :key="project.id" class="project-card" type="button" @click="openProject(project.id)">
          <div class="card-topline"><span>{{ directionLabel(project.direction) }}</span><strong>{{ statusLabel(project.status) }}</strong></div>
          <h2>{{ project.title }}</h2>
          <p>{{ project.purpose }}</p>
          <footer><span><b>Next move</b>{{ project.nextAction }}</span><i aria-hidden="true">↗</i></footer>
        </button>

        <button v-if="WorkspaceState.dashboard.projects.length > 0" class="create-card" type="button" @click="beginProject"><span>+</span><strong>Begin another project</strong><small>Only if it has a real place in your life.</small></button>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'Project'">
        <article v-if="activeProject" class="project-room">
          <div class="room-heading"><span>{{ directionLabel(activeProject.direction) }}</span><small>{{ statusLabel(activeProject.status) }}</small></div>
          <h2>{{ activeProject.title }}</h2>
          <p>{{ activeProject.purpose }}</p>
          <form class="next-action" @submit.prevent="saveNextAction">
            <label for="next-action">THE NEXT ACTION THAT MAKES THIS REAL</label>
            <textarea id="next-action" v-model.trim="nextActionDraft" maxlength="180" placeholder="Write one action you can begin this week."></textarea>
            <div><small>{{ nextActionDraft.length }}/180</small><button class="accent" :disabled="savingNextAction || nextActionDraft.trim().length < 3" type="submit">{{ savingNextAction ? 'Saving…' : 'Protect this next move' }}</button></div>
          </form>
          <footer class="room-footer"><p>No invented score. The truth of this project is the action you choose and the work you return to.</p><button type="button" @click="returnToProjects">Back to projects ↗</button></footer>
        </article>
        <article v-else class="empty-state"><span class="eyebrow">PROJECT NOT FOUND</span><h2>This project is no longer in your field.</h2><p>Return to your projects and choose the work you want to continue.</p><button class="accent" type="button" @click="returnToProjects">See my projects</button></article>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'AI'">
        <article v-if="WorkspaceState.dashboard.projects.length === 0" class="empty-state"><span class="eyebrow">FOCUS RITUAL</span><h2>Clarity starts with something real.</h2><p>Begin a project and TOP can bring you back to the next action you chose—without inventing advice.</p><button class="accent" type="button" @click="beginProject">Begin a project</button></article>
        <template v-else>
          <article class="focus-intro"><span class="eyebrow">FOCUS RITUAL</span><h2>Return to the next move you already chose.</h2><p>TOP protects attention by bringing you back to a real commitment, not by generating more things to consume.</p><button class="accent" :disabled="focusLoading" type="button" @click="requestFocus()">{{ focusLoading ? 'Finding it…' : 'Show my next move' }}</button></article>
          <article v-if="focus" class="focus-result"><span>YOUR FOCUS</span><h2>{{ focus.title }}</h2><strong>{{ focus.action }}</strong><p>{{ focus.reason }}</p></article>
          <div class="project-pills"><button v-for="project in WorkspaceState.dashboard.projects" :key="project.id" type="button" @click="requestFocus(project.id)">{{ project.title }}</button></div>
        </template>
      </template>

      <template v-else-if="WorkspaceState.activeSection === 'Reflection'">
        <form class="reflection-form" @submit.prevent="submitReflection"><span class="eyebrow">WEEKLY REFLECTION</span><h2>What did you make matter this week?</h2><p>Reflection turns effort into learning. Keep it honest, concrete, and yours.</p><textarea v-model="reflection" maxlength="800" placeholder="I am proud that I…"></textarea><div><small>{{ reflection.length }}/800</small><button class="accent" :disabled="reflectionSaving || reflection.trim().length < 3" type="submit">{{ reflectionSaving ? 'Saving…' : 'Keep this reflection' }}</button></div><strong v-if="reflectionMessage" class="success">{{ reflectionMessage }}</strong></form>
      </template>
    </div>

    <div v-else-if="WorkspaceState.dashboardStatus === 'offline'" class="offline-state"><span class="eyebrow">YOUR FIELD IS LOCAL</span><h2>The shared workspace is offline.</h2><p>Start the TOP API to create and save real projects. No sample projects will appear while it is unavailable.</p><div><button class="accent" type="button" @click="retryWorkspace">Try connection</button><button class="quiet-action" type="button" @click="returnToMap">Back to the field ↗</button></div></div>
    <div v-else class="loading-state"><span></span>Opening your field…</div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { getFocusSuggestion, saveWorkspaceReflection, type FocusSuggestion, type ProjectDirection, type ProjectStatus } from "../../lib/api";
import Atelier from "./Atelier.vue";
import BlueprintBuilder from "./BlueprintBuilder.vue";
import CraftStudio from "./CraftStudio.vue";
import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const focus = ref<FocusSuggestion | null>(null);
const focusLoading = ref(false);
const reflection = ref("");
const reflectionSaving = ref(false);
const reflectionMessage = ref("");
const nextActionDraft = ref("");
const savingNextAction = ref(false);
const isNativeSection = computed(() => ["Atelier", "Studio", "Blueprint"].includes(WorkspaceState.activeSection));

const copy = {
  Projects: ["LIFE PROJECTS", "Build a life with visible evidence.", "Projects are not posts. They are commitments you can return to, improve, and share."],
  Project: ["PROJECT SPACE", "Make the work tangible.", "Keep one next action clear enough to carry into your real life."],
  Atelier: ["TOP ATELIER", "Build what does not exist yet.", "Choose a medium, make a first version, and let the work become clearer through your hands."],
  Studio: ["TOP STUDIO", "Make something from nothing.", "Paint, sketch, and keep a visual trace of the work you are bringing into the world."],
  Blueprint: ["BLUEPRINT BUILDER", "Give the path a shape.", "Connect what you need to learn, make, test, and share—then move the map until it makes sense."],
  AI: ["ATTENTION, PROTECTED", "A guide for your next meaningful move.", "Useful intelligence should help you leave the screen with clarity, not stay on it longer."],
  Reflection: ["REFLECTION", "Make the learning visible.", "Growth is easier to continue when you notice what you have already built."]
} as const;

const activeProject = computed(() => WorkspaceState.dashboard?.projects.find((project) => project.id === WorkspaceState.activeProjectId) ?? null);
const activeCopy = computed(() => copy[WorkspaceState.activeSection as keyof typeof copy] ?? copy.Projects);
const eyebrow = computed(() => activeProject.value ? `PROJECT / ${directionLabel(activeProject.value.direction)}` : activeCopy.value[0]);
const heading = computed(() => activeProject.value?.title ?? activeCopy.value[1]);
const description = computed(() => activeProject.value?.purpose ?? activeCopy.value[2]);
const exitLabel = computed(() => WorkspaceState.activeSection === "Project" ? "Back to projects" : "Back to the field");

watch(activeProject, (project) => { nextActionDraft.value = project?.nextAction ?? ""; }, { immediate: true });

function beginProject(): void { WorkspaceState.projectComposerOpen = true; workspaceEngine.triggerMotion("action"); }
function openProject(id: string): void { focus.value = null; workspaceEngine.openProject(id); }
function returnToMap(): void {
  if (WorkspaceState.activeSection === "Project") { returnToProjects(); return; }
  const returnSection = WorkspaceState.returnSection;
  workspaceEngine.openSection(returnSection ?? "Overview");
}
function returnToProjects(): void { workspaceEngine.openSection("Projects"); }
function directionLabel(direction: ProjectDirection): string { return { personal: "Personal practice", creative: "Creative work", learning: "Learning journey", community: "Community contribution", venture: "Venture or service", other: "Own direction" }[direction]; }
function statusLabel(status: ProjectStatus): string { return { planning: "Beginning", active: "In practice", paused: "Paused", completed: "Complete" }[status]; }

async function retryWorkspace(): Promise<void> { await workspaceEngine.load(); if (WorkspaceState.dashboardStatus === "offline") workspaceEngine.notify("TOP API is still offline. Your empty field remains honest."); }
async function requestFocus(projectId?: string): Promise<void> { focusLoading.value = true; try { focus.value = await getFocusSuggestion(projectId); } catch (error) { workspaceEngine.notify(error instanceof Error ? error.message : "TOP focus is unavailable right now."); } finally { focusLoading.value = false; } }
async function saveNextAction(): Promise<void> { if (!activeProject.value) return; savingNextAction.value = true; try { await workspaceEngine.saveProjectNextAction(activeProject.value.id, nextActionDraft.value); } catch (error) { workspaceEngine.notify(error instanceof Error ? error.message : "Your next action could not be saved."); } finally { savingNextAction.value = false; } }
async function submitReflection(): Promise<void> { reflectionMessage.value = ""; try { reflectionSaving.value = true; const result = await saveWorkspaceReflection(reflection.value); reflectionMessage.value = result.message; reflection.value = ""; workspaceEngine.notify("Reflection kept in your practice."); } catch (error) { workspaceEngine.notify(error instanceof Error ? error.message : "Your reflection could not be saved."); } finally { reflectionSaving.value = false; } }
</script>

<style scoped>
.surface { animation:surface-in .56s cubic-bezier(.18,.9,.25,1) both; background:radial-gradient(ellipse at 82% 12%,rgba(102,230,255,.13),transparent 24%),radial-gradient(circle at 12% 82%,rgba(141,111,255,.16),transparent 25%),linear-gradient(135deg,rgba(6,7,17,.87),rgba(6,7,17,.72)); backdrop-filter:blur(9px); color:var(--top-ink); min-height:100dvh; padding:clamp(110px,12vw,152px) clamp(25px,7vw,110px) 76px; position:relative; z-index:60; }.surface::before { border:1px solid rgba(98,230,255,.13); border-radius:50%; content:""; height:600px; pointer-events:none; position:absolute; right:-240px; top:-250px; width:760px; }.surface-header,.surface-content,.offline-state { margin:0 auto; max-width:1120px; position:relative; }.surface-header { align-items:flex-start; display:flex; gap:34px; justify-content:space-between; margin-bottom:48px; }.eyebrow,.card-topline span,.focus-result span,.room-heading span { color:var(--top-cyan); font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.17em; text-transform:uppercase; } h1,h2,p { margin:0; } h1 { font-family:var(--top-display); font-size:clamp(42px,5vw,72px); font-weight:750; letter-spacing:-.085em; line-height:.91; margin-top:12px; max-width:760px; }.surface-header p { color:var(--top-muted); font-size:14px; line-height:1.7; margin-top:17px; max-width:620px; }.exit { align-items:center; background:rgba(12,18,45,.66); border:1px solid rgba(113,150,255,.34); border-radius:999px; color:var(--top-ink); cursor:pointer; display:flex; flex:0 0 auto; font-family:var(--top-mono); font-size:10px; gap:7px; padding:12px 15px; transition:.2s ease; }.exit:hover { border-color:var(--top-cyan); transform:translateX(-3px); }.exit span { color:var(--top-cyan); font-size:15px; }.surface-content { display:grid; gap:17px; grid-template-columns:repeat(3,minmax(0,1fr)); padding-bottom:45px; }.project-card,.focus-intro,.focus-result,.reflection-form,.project-room,.empty-state,.create-card { background:linear-gradient(145deg,rgba(24,32,74,.78),rgba(9,12,30,.9)); border:1px solid rgba(123,153,255,.23); border-radius:23px 23px 8px 23px; box-shadow:inset 0 1px rgba(220,239,255,.07),0 22px 55px rgba(0,0,0,.2); color:var(--top-ink); overflow:hidden; padding:23px; position:relative; text-align:left; }.project-card { cursor:pointer; min-height:274px; transition:.22s ease; }.project-card::before { background:radial-gradient(circle,rgba(98,230,255,.18),transparent 68%); content:""; height:120px; position:absolute; right:-44px; top:-55px; width:120px; }.project-card:hover { border-color:rgba(98,230,255,.7); box-shadow:0 0 0 1px rgba(156,124,255,.2),0 25px 65px rgba(0,0,0,.42); transform:translateY(-5px); }.card-topline,.room-heading { align-items:center; display:flex; justify-content:space-between; position:relative; }.card-topline strong,.room-heading small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; font-weight:500; }.project-card h2 { font-family:var(--top-display); font-size:27px; font-weight:700; letter-spacing:-.06em; margin:29px 0 9px; position:relative; }.project-card p { color:var(--top-muted); display:-webkit-box; font-size:12px; line-height:1.6; overflow:hidden; position:relative; -webkit-box-orient:vertical; -webkit-line-clamp:3; }.project-card footer { align-items:flex-end; border-top:1px solid rgba(128,158,255,.13); bottom:0; display:flex; gap:14px; justify-content:space-between; left:23px; padding:14px 0; position:absolute; right:23px; }.project-card footer span { color:var(--top-muted); display:block; font-size:10px; line-height:1.45; max-width:210px; }.project-card footer b { color:var(--top-lime); display:block; font-family:var(--top-mono); font-size:8px; letter-spacing:.13em; margin-bottom:4px; text-transform:uppercase; }.project-card footer i { color:var(--top-cyan); font-size:18px; font-style:normal; }.empty-state,.focus-intro,.focus-result,.reflection-form,.project-room { grid-column:span 3; }.empty-state { align-items:flex-start; display:flex; flex-direction:column; min-height:280px; padding:clamp(32px,5vw,62px); }.empty-state h2,.focus-intro h2,.reflection-form h2,.project-room h2 { font-family:var(--top-display); font-size:clamp(31px,4vw,53px); font-weight:700; letter-spacing:-.07em; line-height:.96; margin:15px 0; max-width:760px; }.empty-state p,.focus-intro p,.reflection-form p,.project-room > p { color:var(--top-muted); line-height:1.7; max-width:680px; }.empty-mark { align-items:center; border:1px solid var(--top-cyan); border-radius:50%; color:var(--top-cyan); display:flex; font-family:var(--top-display); font-size:25px; height:46px; justify-content:center; margin-bottom:24px; width:46px; }.accent { background:linear-gradient(110deg,var(--top-cyan),#a08aff 52%,var(--top-pink)); border:1px solid rgba(255,255,255,.4); border-radius:999px; box-shadow:0 15px 38px rgba(83,105,255,.35),inset 0 1px rgba(255,255,255,.65); color:#07101d; cursor:pointer; font-size:11px; font-weight:850; margin-top:25px; padding:13px 18px; transition:.2s ease; }.accent:hover:not(:disabled) { transform:translateY(-3px); }.accent:disabled { cursor:wait; opacity:.7; }.create-card { align-items:flex-start; background:linear-gradient(145deg,rgba(91,108,255,.24),rgba(34,229,255,.08)); cursor:pointer; display:flex; flex-direction:column; justify-content:center; min-height:274px; transition:.2s ease; }.create-card:hover { border-color:var(--top-cyan); transform:translateY(-4px); }.create-card > span { align-items:center; border:1px solid var(--top-cyan); border-radius:50%; color:var(--top-cyan); display:flex; font-family:var(--top-display); font-size:23px; height:39px; justify-content:center; margin-bottom:20px; width:39px; }.create-card strong { font-family:var(--top-display); font-size:22px; font-weight:700; letter-spacing:-.045em; }.create-card small { color:var(--top-muted); font-size:12px; line-height:1.5; margin-top:8px; }.project-room { background:radial-gradient(circle at 88% 12%,rgba(98,230,255,.18),transparent 25%),linear-gradient(145deg,rgba(28,38,85,.95),rgba(7,10,28,.95)); padding:clamp(31px,5vw,62px); }.room-heading { border-bottom:1px solid rgba(128,158,255,.14); padding-bottom:17px; }.project-room > p { font-size:15px; }.next-action { border-top:1px solid rgba(128,158,255,.14); margin-top:34px; padding-top:28px; }.next-action label { color:var(--top-cyan); display:block; font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.16em; }.next-action textarea,.reflection-form textarea { background:rgba(3,5,17,.66); border:1px solid rgba(122,154,255,.3); border-radius:18px 18px 5px 18px; color:var(--top-ink); font:inherit; height:118px; margin-top:11px; outline:0; padding:15px; resize:vertical; width:100%; }.reflection-form textarea { height:150px; margin-top:28px; }.next-action textarea:focus,.reflection-form textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.12); }.next-action > div,.reflection-form > div { align-items:center; display:flex; justify-content:space-between; }.next-action small,.reflection-form small { color:var(--top-muted); font-family:var(--top-mono); font-size:10px; }.room-footer { align-items:flex-end; border-top:1px solid rgba(128,158,255,.14); display:flex; gap:24px; justify-content:space-between; margin-top:30px; padding-top:22px; }.room-footer p { color:var(--top-muted); font-size:11px; line-height:1.6; max-width:500px; }.room-footer button,.quiet-action { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; flex:0 0 auto; font-family:var(--top-mono); font-size:10px; padding:12px 0; }.focus-intro { background:radial-gradient(circle at 84% 27%,rgba(156,124,255,.2),transparent 26%),linear-gradient(145deg,rgba(38,34,84,.95),rgba(10,8,31,.94)); padding:clamp(30px,5vw,62px); }.focus-result { background:linear-gradient(145deg,rgba(50,41,106,.84),rgba(13,12,40,.94)); }.focus-result h2 { font-family:var(--top-display); font-size:22px; font-weight:700; margin:14px 0 13px; }.focus-result strong { color:var(--top-ink); display:block; font-family:var(--top-display); font-size:27px; font-weight:700; max-width:730px; }.focus-result p { color:var(--top-muted); line-height:1.65; margin-top:13px; max-width:750px; }.project-pills { display:flex; flex-wrap:wrap; gap:9px; grid-column:span 3; }.project-pills button { background:rgba(111,125,255,.1); border:1px solid rgba(125,157,255,.25); border-radius:999px; color:rgba(230,237,255,.82); cursor:pointer; font-family:var(--top-mono); font-size:9px; padding:10px 14px; }.project-pills button:hover { border-color:var(--top-cyan); }.success { color:var(--top-lime); display:block; font-size:13px; margin-top:20px; }.offline-state { background:linear-gradient(145deg,rgba(24,32,74,.88),rgba(7,10,28,.93)); border:1px solid rgba(123,153,255,.24); border-radius:26px 26px 8px 26px; min-height:360px; padding:clamp(32px,5vw,64px); }.offline-state h2 { font-family:var(--top-display); font-size:clamp(31px,4vw,49px); font-weight:700; letter-spacing:-.07em; margin:13px 0; max-width:560px; }.offline-state p { color:var(--top-muted); line-height:1.7; max-width:590px; }.offline-state > div { align-items:center; display:flex; gap:17px; }.loading-state { align-items:center; color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:11px; gap:10px; justify-content:center; min-height:300px; position:relative; }.loading-state span { animation:pulse 1.2s ease-in-out infinite; background:var(--top-cyan); border-radius:50%; box-shadow:0 0 16px var(--top-cyan); height:8px; width:8px; } @keyframes surface-in { from { opacity:0; transform:translateY(20px) scale(.985); } to { opacity:1; transform:none; } } @keyframes pulse { 50% { opacity:.25; transform:scale(.65); } }
@media (max-width:800px) { .surface { padding:116px 20px 55px; }.surface-header { flex-direction:column; gap:24px; margin-bottom:31px; }.surface-content { grid-template-columns:1fr; }.project-card,.focus-intro,.focus-result,.reflection-form,.project-room,.empty-state,.project-pills { grid-column:span 1; }.room-footer { align-items:flex-start; flex-direction:column; gap:7px; }.offline-state { padding:31px 24px; }.offline-state > div { align-items:flex-start; flex-direction:column; gap:0; } }
</style>
