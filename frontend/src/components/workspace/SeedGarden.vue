<template>
  <section class="seed-garden">
    <header class="garden-header">
      <div><span>THE SEED GARDEN</span><h2>Let an idea earn<br />its next form.</h2><p>Seeds are not posts. They are private beginnings you can return to, question, tend, and turn into a project only when the time is right.</p></div>
      <button type="button" @click="composerOpen = !composerOpen"><i>+</i>{{ composerOpen ? "Close planter" : "Plant a seed" }}</button>
    </header>

    <form v-if="composerOpen" class="seed-planter" @submit.prevent="plant">
      <div><span>PLANT A SEED</span><p>Give the beginning enough clarity to find again.</p></div>
      <label><span>NAME THE POSSIBILITY</span><input v-model.trim="draft.title" maxlength="120" placeholder="A neighbourhood repair ritual" /></label>
      <label><span>WHAT TENSION OR PROBLEM IS HERE?</span><textarea v-model.trim="draft.problem" maxlength="2000" placeholder="What feels unresolved, needed, or worth exploring?"></textarea></label>
      <label><span>WHAT CHANGE DO YOU HOPE FOR?</span><textarea v-model.trim="draft.desiredOutcome" maxlength="2000" placeholder="Describe the real-world outcome this could help create."></textarea></label>
      <div class="planter-actions"><small v-if="message" :class="{ error: messageIsError }">{{ message }}</small><small v-else>Nothing here will be published or ranked.</small><button type="submit" :disabled="planting || !canPlant">{{ planting ? "Planting…" : "Plant this seed" }} <i>↗</i></button></div>
    </form>

    <div v-if="loading" class="garden-loading"><i></i>Opening your private garden…</div>
    <div v-else-if="error" class="garden-error"><span>THE GARDEN IS OFFLINE</span><h3>Your seeds need the TOP API.</h3><p>{{ error }}</p><button type="button" @click="load">Try again</button></div>
    <div v-else class="garden-layout">
      <section class="seed-list" aria-label="Your seeds">
        <article v-if="seeds.length === 0" class="garden-empty"><i>✧</i><strong>Nothing needs to pretend it is ready.</strong><p>Plant the first idea you want to protect from the noise.</p></article>
        <button v-for="seed in seeds" :key="seed.id" class="seed-card" :class="{ selected: detail?.id === seed.id, archived: seed.status === 'archived' }" type="button" @click="selectSeed(seed.id)">
          <span class="seed-state"><i></i>{{ statusLabel(seed.status) }}</span><h3>{{ seed.title }}</h3><p>{{ seed.problem }}</p><footer><span>{{ seed.entryCount }} {{ seed.entryCount === 1 ? "tending note" : "tending notes" }}</span><strong v-if="seed.projectId">Project ↗</strong><strong v-else>Open ↗</strong></footer>
        </button>
      </section>

      <article v-if="detail" class="seed-room">
        <header><div><span>{{ detail.sourcePublicPostId ? 'FROM A PUBLIC TOP SIGNAL' : statusLabel(detail.status) }}</span><h3>{{ detail.title }}</h3></div><button v-if="detail.status !== 'archived'" type="button" @click="archive">Archive</button></header>
        <section class="seed-origin"><div><span>THE TENSION</span><p>{{ detail.problem }}</p></div><div><span>THE HOPE</span><p>{{ detail.desiredOutcome }}</p></div></section>

        <section v-if="detail.status !== 'archived'" class="tend-station"><span>TEND THIS SEED</span><p>What did you notice, learn, test, or decide since you last returned?</p><form @submit.prevent="tend"><textarea v-model.trim="entryDraft" maxlength="1000" placeholder="Add one honest note to help this seed grow…"></textarea><div><small>{{ entryDraft.length }}/1000</small><button type="submit" :disabled="tending || entryDraft.length < 3">{{ tending ? "Tending…" : "Keep this note" }}</button></div></form></section>

        <section class="seed-trail"><span>THE GROWTH TRAIL</span><p v-if="detail.entries.length === 0">No notes yet. It is allowed to be quietly unfinished.</p><ol v-else><li v-for="entry in detail.entries" :key="entry.id"><i></i><div><p>{{ entry.body }}</p><time>{{ formatTime(entry.createdAt) }}</time></div></li></ol></section>

        <section v-if="detail.projectId" class="project-born"><span>THIS SEED BECAME A PROJECT</span><p>The beginning is protected in the garden; the work continues in your field.</p><button type="button" @click="openProject(detail.projectId)">Open the project ↗</button></section>
        <section v-else-if="detail.status !== 'archived'" class="project-threshold"><span>WHEN THIS IS READY</span><h4>Give it a project, not a post.</h4><p>Choose the direction and first real move. The seed’s tension and hope will become the project’s origin.</p><div class="threshold-controls"><label><span>LIVING DIRECTION</span><select v-model="direction"><option value="personal">Personal practice</option><option value="creative">Creative work</option><option value="learning">Learning journey</option><option value="community">Community contribution</option><option value="venture">Venture or service</option><option value="other">Own direction</option></select></label><label><span>FIRST NEXT ACTION</span><input v-model.trim="nextAction" maxlength="180" placeholder="One action you can genuinely begin" /></label></div><div class="threshold-actions"><small>{{ detail.entries.length ? "This seed has been tended. You can make the commitment when it feels real." : "You can begin now, but one tending note often makes the first action clearer." }}</small><button type="button" :disabled="turning || nextAction.length < 3" @click="turnIntoProject">{{ turning ? "Beginning…" : "Turn into project" }} <i>↗</i></button></div></section>
      </article>

      <article v-else class="seed-placeholder"><i>✧</i><h3>Choose a seed.</h3><p>Every beginning deserves a room where it can become clearer before it asks for more of your life.</p></article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { createSeed, createSeedEntry, getSeed, getSeeds, turnSeedIntoProject, updateSeedStatus, type ProjectDirection, type SeedDetail, type SeedStatus, type TopSeed } from "../../lib/api";
import { workspaceEngine } from "./WorkspaceEngine";

const seeds = ref<TopSeed[]>([]);
const detail = ref<SeedDetail | null>(null);
const loading = ref(true);
const error = ref("");
const composerOpen = ref(false);
const planting = ref(false);
const tending = ref(false);
const turning = ref(false);
const entryDraft = ref("");
const nextAction = ref("");
const direction = ref<ProjectDirection>("creative");
const message = ref("");
const messageIsError = ref(false);
const draft = ref({ title: "", problem: "", desiredOutcome: "" });
const canPlant = computed(() => draft.value.title.length >= 3 && draft.value.problem.length >= 10 && draft.value.desiredOutcome.length >= 10);

onMounted(() => { void load(); });

async function load(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const result = await getSeeds();
    seeds.value = result.seeds;
    const selected = detail.value?.id;
    if (selected && result.seeds.some((seed) => seed.id === selected)) await selectSeed(selected);
    else if (!detail.value && result.seeds[0]) await selectSeed(result.seeds[0].id);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "TOP could not reach your seed garden.";
  } finally {
    loading.value = false;
  }
}

async function selectSeed(seedId: string): Promise<void> {
  try {
    detail.value = await getSeed(seedId);
    entryDraft.value = "";
    nextAction.value = "";
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "That seed could not be opened.";
  }
}

async function plant(): Promise<void> {
  if (!canPlant.value) return;
  planting.value = true;
  message.value = "";
  try {
    const { seed } = await createSeed(draft.value);
    seeds.value = [seed, ...seeds.value];
    detail.value = await getSeed(seed.id);
    draft.value = { title: "", problem: "", desiredOutcome: "" };
    composerOpen.value = false;
    workspaceEngine.notify("Seed planted. Let it become clear before it becomes loud.");
  } catch (cause) {
    message.value = cause instanceof Error ? cause.message : "TOP could not plant this seed.";
    messageIsError.value = true;
  } finally {
    planting.value = false;
  }
}

async function tend(): Promise<void> {
  if (!detail.value || entryDraft.value.length < 3) return;
  tending.value = true;
  try {
    await createSeedEntry(detail.value.id, { body: entryDraft.value });
    entryDraft.value = "";
    await refreshSelected();
    workspaceEngine.notify("The seed has a new trace of attention.");
  } catch (cause) {
    workspaceEngine.notify(cause instanceof Error ? cause.message : "TOP could not keep that tending note.");
  } finally {
    tending.value = false;
  }
}

async function archive(): Promise<void> {
  if (!detail.value) return;
  try {
    await updateSeedStatus(detail.value.id, { status: "archived" });
    await refreshSelected();
    workspaceEngine.notify("Seed archived. It is kept without demanding attention.");
  } catch (cause) {
    workspaceEngine.notify(cause instanceof Error ? cause.message : "TOP could not archive that seed.");
  }
}

async function turnIntoProject(): Promise<void> {
  if (!detail.value || nextAction.value.length < 3) return;
  turning.value = true;
  try {
    const { project } = await turnSeedIntoProject(detail.value.id, { direction: direction.value, nextAction: nextAction.value });
    await workspaceEngine.load();
    await refreshSelected();
    workspaceEngine.notify("This seed now has a real place in your project field.");
    workspaceEngine.openProject(project.id);
  } catch (cause) {
    workspaceEngine.notify(cause instanceof Error ? cause.message : "TOP could not begin this project.");
  } finally {
    turning.value = false;
  }
}

async function refreshSelected(): Promise<void> {
  if (!detail.value) return;
  detail.value = await getSeed(detail.value.id);
  const result = await getSeeds();
  seeds.value = result.seeds;
}

function openProject(projectId: string): void { workspaceEngine.openProject(projectId); }
function statusLabel(status: SeedStatus): string { return { draft: "Draft", planted: "Planted", growing: "Growing", archived: "At rest" }[status]; }
function formatTime(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Now" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date); }
</script>

<style scoped>
.seed-garden { grid-column:span 3; }.garden-header { align-items:flex-start; display:flex; gap:30px; justify-content:space-between; }.garden-header > div > span,.seed-planter > div > span,.seed-room header span,.seed-origin span,.tend-station > span,.seed-trail > span,.project-threshold > span,.project-born > span { color:var(--top-pink); display:block; font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.16em; }.garden-header h2 { font-family:var(--top-display); font-size:clamp(38px,5vw,67px); font-weight:750; letter-spacing:-.09em; line-height:.88; margin:14px 0; }.garden-header p { color:var(--top-muted); line-height:1.68; max-width:640px; }.garden-header > button { background:linear-gradient(110deg,var(--top-pink),var(--top-violet),var(--top-cyan)); border:1px solid rgba(255,255,255,.36); border-radius:999px; color:#07101d; cursor:pointer; flex:0 0 auto; font-family:var(--top-body); font-size:10px; font-weight:900; margin-top:6px; padding:12px 15px; }.garden-header > button i { font-size:16px; font-style:normal; margin-right:7px; }.seed-planter { background:linear-gradient(140deg,rgba(69,37,79,.65),rgba(10,12,32,.9)); border:1px solid rgba(255,114,189,.28); border-radius:22px 22px 6px 22px; display:grid; gap:13px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:26px; padding:24px; }.seed-planter > div:first-child,.seed-planter label:nth-child(3),.seed-planter label:nth-child(4),.planter-actions { grid-column:span 2; }.seed-planter p { color:var(--top-muted); font-size:12px; margin:7px 0 0; }.seed-planter label,.threshold-controls label { display:grid; gap:7px; }.seed-planter label > span,.threshold-controls label > span { color:rgba(232,217,255,.7); font-family:var(--top-mono); font-size:8px; letter-spacing:.12em; }.seed-planter input,.seed-planter textarea,.tend-station textarea,.threshold-controls input,.threshold-controls select { background:rgba(3,5,17,.65); border:1px solid rgba(139,126,255,.29); border-radius:12px 12px 4px 12px; box-sizing:border-box; color:var(--top-ink); font:inherit; font-size:12px; outline:0; padding:12px; width:100%; }.seed-planter textarea { min-height:84px; resize:vertical; }.seed-planter input:focus,.seed-planter textarea:focus,.tend-station textarea:focus,.threshold-controls input:focus,.threshold-controls select:focus { border-color:var(--top-pink); box-shadow:0 0 0 3px rgba(255,114,189,.11); }.planter-actions,.threshold-actions { align-items:center; display:flex; gap:17px; justify-content:space-between; }.planter-actions small,.threshold-actions small { color:var(--top-muted); font-size:10px; line-height:1.45; }.planter-actions small.error { color:#ffd0e4; }.planter-actions button,.tend-station button,.threshold-actions button,.project-born button,.garden-error button { background:rgba(255,114,189,.12); border:1px solid rgba(255,114,189,.58); border-radius:999px; color:#ffd5eb; cursor:pointer; font-family:var(--top-mono); font-size:9px; font-weight:800; padding:11px 13px; }.planter-actions button:disabled,.tend-station button:disabled,.threshold-actions button:disabled { cursor:wait; opacity:.55; }.planter-actions i,.threshold-actions i { font-size:14px; font-style:normal; margin-left:4px; }.garden-loading { align-items:center; color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:10px; gap:9px; justify-content:center; min-height:330px; }.garden-loading i { animation:seed-pulse 1.2s ease-in-out infinite; background:var(--top-pink); border-radius:50%; box-shadow:0 0 15px var(--top-pink); height:7px; width:7px; }.garden-error { background:rgba(43,20,45,.58); border:1px solid rgba(255,114,189,.3); border-radius:22px 22px 6px 22px; margin-top:28px; padding:34px; }.garden-error span { color:var(--top-pink); font-family:var(--top-mono); font-size:8px; letter-spacing:.14em; }.garden-error h3 { font-family:var(--top-display); font-size:36px; letter-spacing:-.07em; margin:12px 0; }.garden-error p { color:var(--top-muted); line-height:1.6; }.garden-error button { margin-top:18px; }.garden-layout { display:grid; gap:17px; grid-template-columns:minmax(270px,.76fr) minmax(0,1.24fr); margin-top:28px; }.seed-list { align-content:start; display:grid; gap:10px; max-height:760px; overflow:auto; padding-right:4px; }.seed-card,.garden-empty,.seed-placeholder { background:linear-gradient(145deg,rgba(22,26,65,.76),rgba(6,8,24,.82)); border:1px solid rgba(128,153,255,.19); border-radius:18px 18px 5px 18px; color:var(--top-ink); padding:19px; text-align:left; }.seed-card { cursor:pointer; transition:.2s ease; }.seed-card:hover,.seed-card.selected { border-color:var(--top-pink); box-shadow:0 18px 40px rgba(0,0,0,.27),0 0 24px rgba(255,114,189,.1); transform:translateY(-2px); }.seed-card.archived { opacity:.58; }.seed-state { align-items:center; color:var(--top-pink); display:flex; font-family:var(--top-mono); font-size:8px; gap:7px; letter-spacing:.1em; }.seed-state i { background:currentColor; border-radius:50%; box-shadow:0 0 10px currentColor; height:5px; width:5px; }.seed-card h3,.seed-room h3,.seed-placeholder h3 { font-family:var(--top-display); font-size:24px; font-weight:700; letter-spacing:-.065em; line-height:.95; margin:15px 0 8px; }.seed-card p { color:var(--top-muted); display:-webkit-box; font-size:11px; line-height:1.55; margin:0; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:3; }.seed-card footer { align-items:center; border-top:1px solid rgba(126,153,255,.14); color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:8px; justify-content:space-between; margin-top:16px; padding-top:11px; }.seed-card footer strong { color:var(--top-cyan); font-weight:600; }.garden-empty,.seed-placeholder { align-items:center; display:flex; flex-direction:column; justify-content:center; min-height:235px; text-align:center; }.garden-empty i,.seed-placeholder i { color:var(--top-pink); font-family:var(--top-display); font-size:38px; font-style:normal; text-shadow:0 0 20px rgba(255,114,189,.7); }.garden-empty strong { font-family:var(--top-display); font-size:23px; letter-spacing:-.05em; margin-top:13px; }.garden-empty p,.seed-placeholder p { color:var(--top-muted); font-size:11px; line-height:1.6; margin:9px 0 0; max-width:280px; }.seed-room { background:radial-gradient(circle at 91% 9%,rgba(255,114,189,.15),transparent 26%),linear-gradient(145deg,rgba(29,31,78,.94),rgba(6,8,24,.94)); border:1px solid rgba(133,157,255,.27); border-radius:25px 25px 7px 25px; padding:clamp(25px,4vw,44px); }.seed-room > header { align-items:flex-start; border-bottom:1px solid rgba(127,154,255,.15); display:flex; justify-content:space-between; padding-bottom:18px; }.seed-room > header > button { background:transparent; border:0; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:6px 0; }.seed-room > header > button:hover { color:var(--top-pink); }.seed-origin { display:grid; gap:1px; grid-template-columns:1fr 1fr; margin-top:17px; overflow:hidden; border:1px solid rgba(127,154,255,.15); border-radius:15px 15px 4px 15px; }.seed-origin > div { background:rgba(3,5,16,.31); padding:17px; }.seed-origin > div + div { border-left:1px solid rgba(127,154,255,.15); }.seed-origin p { color:var(--top-muted); font-size:11px; line-height:1.6; margin:8px 0 0; }.tend-station,.seed-trail,.project-threshold,.project-born { border-top:1px solid rgba(127,154,255,.15); margin-top:24px; padding-top:22px; }.tend-station p,.project-threshold > p,.project-born p { color:var(--top-muted); font-size:12px; line-height:1.6; margin:9px 0 0; }.tend-station form { margin-top:14px; }.tend-station textarea { min-height:86px; resize:vertical; }.tend-station form > div { align-items:center; display:flex; justify-content:space-between; margin-top:8px; }.tend-station small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.seed-trail > p { color:var(--top-muted); font-size:11px; line-height:1.6; margin:13px 0 0; }.seed-trail ol { display:grid; gap:13px; list-style:none; margin:16px 0 0; padding:0; }.seed-trail li { display:grid; gap:10px; grid-template-columns:8px minmax(0,1fr); }.seed-trail li > i { background:var(--top-pink); border-radius:50%; box-shadow:0 0 11px rgba(255,114,189,.65); height:5px; margin-top:6px; width:5px; }.seed-trail li p { color:rgba(232,239,255,.88); font-size:12px; line-height:1.55; margin:0; }.seed-trail time { color:var(--top-muted); display:block; font-family:var(--top-mono); font-size:8px; margin-top:5px; }.project-threshold { background:linear-gradient(120deg,rgba(255,114,189,.08),rgba(156,124,255,.1)); border:1px solid rgba(255,114,189,.25); border-radius:17px 17px 5px 17px; padding:20px; }.project-threshold h4 { font-family:var(--top-display); font-size:29px; font-weight:700; letter-spacing:-.07em; margin:11px 0 0; }.threshold-controls { display:grid; gap:10px; grid-template-columns:.7fr 1.3fr; margin-top:18px; }.threshold-actions { margin-top:13px; }.project-born { background:rgba(156,236,153,.06); border:1px solid rgba(156,236,153,.2); border-radius:16px 16px 5px 16px; padding:19px; }.project-born > span { color:var(--top-lime); }.project-born button { border-color:rgba(156,236,153,.5); color:var(--top-lime); margin-top:14px; } @keyframes seed-pulse { 50% { opacity:.25; transform:scale(.6); } }
@media (max-width:800px) { .seed-garden { grid-column:span 1; }.garden-header { flex-direction:column; gap:18px; }.garden-header > button { margin:0; }.seed-planter,.garden-layout { grid-template-columns:1fr; }.seed-planter > div:first-child,.seed-planter label:nth-child(3),.seed-planter label:nth-child(4),.planter-actions { grid-column:span 1; }.seed-list { max-height:none; }.seed-origin,.threshold-controls { grid-template-columns:1fr; }.seed-origin > div + div { border-left:0; border-top:1px solid rgba(127,154,255,.15); }.planter-actions,.threshold-actions { align-items:flex-start; flex-direction:column; }.planter-actions button,.threshold-actions button { width:100%; } }
</style>
