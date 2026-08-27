<template>
  <main class="movement-page">
    <ThreeField mode="identity" />
    <div class="movement-orbit movement-orbit-one" aria-hidden="true"></div>
    <div class="movement-orbit movement-orbit-two" aria-hidden="true"></div>

    <header class="movement-header">
      <button class="movement-brand" type="button" aria-label="Go to TOP Page" @click="skip"><img :src="topLogoUrl" alt="TOP" /></button>
      <button class="movement-skip" type="button" @click="skip">I will begin later <span>↗</span></button>
    </header>

    <section class="movement-shell">
      <aside class="movement-intro">
        <span>FIRST MOVEMENT</span>
        <h1>Give the next thing that matters a <em>place to begin.</em></h1>
        <p>TOP does not need a perfect plan. One honest direction and one small action are enough to create momentum.</p>
        <ol aria-label="First movement steps"><li :class="{ active: step === 1, complete: step > 1 }"><b>01</b><span>Set your direction</span></li><li :class="{ active: step === 2, complete: step > 2 }"><b>02</b><span>Name what wants to move</span></li><li :class="{ active: step === 3 }"><b>03</b><span>Choose its first home</span></li></ol>
      </aside>

      <section class="movement-card" aria-live="polite">
        <div class="movement-card-top"><span>{{ `0${step} / 03` }}</span><small>{{ step === 1 ? 'DIRECTION' : step === 2 ? 'INTENTION' : 'FIRST ACTION' }}</small></div>

        <form v-if="step === 1" @submit.prevent="nextFromDirection">
          <h2>What field are you growing?</h2>
          <p>These details are public only on your profile. Your actual work remains inside your private Field.</p>
          <label><span>FIELD NAME <em>OPTIONAL</em></span><input v-model.trim="fieldName" maxlength="48" autocomplete="organization-title" placeholder="Design, robotics, community gardens…" /></label>
          <label><span>LOCATION <em>OPTIONAL</em></span><input v-model.trim="location" maxlength="80" autocomplete="address-level2" placeholder="A city, region, or anywhere" /></label>
          <button type="submit">Continue <i>↗</i></button>
        </form>

        <form v-else-if="step === 2" @submit.prevent="nextFromIntention">
          <h2>What do you want to move forward?</h2>
          <p>Use real words. This can be a question, a need, an idea, or a beginning you want to protect.</p>
          <label><span>NAME IT</span><input v-model.trim="title" maxlength="120" required placeholder="Build a neighborhood repair club" /></label>
          <label><span>WHY IT MATTERS</span><textarea v-model.trim="details" maxlength="1000" required placeholder="What needs to change, make sense, or become possible?"></textarea></label>
          <div class="movement-actions"><button class="secondary" type="button" @click="step = 1">Back</button><button type="submit" :disabled="title.length < 3 || details.length < 3">Continue <i>↗</i></button></div>
        </form>

        <form v-else @submit.prevent="createFirstMovement">
          <h2>Where should this begin?</h2>
          <p>You can change its shape later. Start with the place that gives your intention the most useful first move.</p>
          <fieldset class="home-options"><legend>FIRST HOME</legend><label :class="{ selected: home === 'seed' }"><input v-model="home" value="seed" type="radio" /><span><b>Plant a seed</b><small>Keep it private while it takes shape.</small></span><i>◌</i></label><label :class="{ selected: home === 'project' }"><input v-model="home" value="project" type="radio" /><span><b>Begin a project</b><small>Set a next action inside your private Field.</small></span><i>△</i></label><label :class="{ selected: home === 'signal' }"><input v-model="home" value="signal" type="radio" /><span><b>Share a signal</b><small>Invite useful people into a public conversation.</small></span><i>↗</i></label></fieldset>
          <label v-if="home === 'project'"><span>FIRST REAL ACTION</span><input v-model.trim="nextAction" maxlength="180" required placeholder="A small action I can take this week" /></label>
          <p v-if="error" class="movement-error">{{ error }}</p>
          <div class="movement-actions"><button class="secondary" type="button" :disabled="creating" @click="step = 2">Back</button><button type="submit" :disabled="creating || (home === 'project' && nextAction.length < 3)">{{ creating ? 'Creating your beginning…' : home === 'signal' ? 'Share my signal' : home === 'project' ? 'Begin my project' : 'Plant my seed' }} <i>↗</i></button></div>
        </form>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import ThreeField from "../components/ThreeField.vue";
import { createPublicPost, createSeed, createWorkspaceProject, type ProjectDirection } from "../lib/api";
import { refineTopProfile } from "../lib/auth";
import { topLogoUrl } from "../lib/brand";

type FirstHome = "seed" | "project" | "signal";

const router = useRouter();
const route = useRoute();
const step = ref(1);
const fieldName = ref("");
const location = ref("");
const title = ref("");
const details = ref("");
const home = ref<FirstHome>("seed");
const nextAction = ref("");
const creating = ref(false);
const error = ref("");

function nextFromDirection(): void {
  if (fieldName.value && fieldName.value.length < 2) return;
  step.value = 2;
}

function nextFromIntention(): void {
  if (title.value.length < 3 || details.value.length < 3) return;
  step.value = 3;
}

async function createFirstMovement(): Promise<void> {
  if (home.value === "project" && nextAction.value.length < 3) return;
  creating.value = true;
  error.value = "";
  try {
    if (fieldName.value || location.value) {
      await refineTopProfile({ fieldName: fieldName.value || null, location: location.value || null });
    }

    let destination = "/top";
    if (home.value === "seed") {
      await createSeed({ title: title.value, problem: details.value, desiredOutcome: "Take one useful next action and decide whether this seed deserves a project." });
      destination = "/field?focus=seeds";
    } else if (home.value === "project") {
      const { project } = await createWorkspaceProject({ title: title.value, purpose: details.value, direction: directionFor(fieldName.value), nextAction: nextAction.value });
      destination = `/field?project=${encodeURIComponent(project.id)}`;
    } else {
      const { post } = await createPublicPost({ kind: "idea", title: title.value, body: details.value });
      destination = `/top?signal=${encodeURIComponent(post.id)}`;
    }
    const requestedNext = typeof route.query.next === "string" && route.query.next.startsWith("/") ? route.query.next : "";
    await router.push(requestedNext || destination);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "TOP could not create this beginning yet.";
  } finally {
    creating.value = false;
  }
}

function directionFor(field: string): ProjectDirection {
  const normalized = field.toLowerCase();
  if (/(learn|study|language|school|research)/.test(normalized)) return "learning";
  if (/(art|design|music|film|write|craft)/.test(normalized)) return "creative";
  if (/(community|city|garden|club|social|help)/.test(normalized)) return "community";
  if (/(business|startup|venture|product)/.test(normalized)) return "venture";
  return "personal";
}

function skip(): void {
  const requestedNext = typeof route.query.next === "string" && route.query.next.startsWith("/") ? route.query.next : "/top";
  void router.push(requestedNext);
}
</script>

<style scoped>
.movement-page { align-items:center; background:radial-gradient(circle at 13% 15%,rgba(98,230,255,.15),transparent 25%),radial-gradient(circle at 87% 80%,rgba(156,124,255,.17),transparent 28%),#050611; color:var(--top-ink); display:flex; min-height:100dvh; overflow:hidden; padding:112px clamp(18px,5vw,64px) 64px; position:relative; }.movement-header { align-items:center; display:flex; justify-content:space-between; left:clamp(18px,5vw,64px); position:absolute; right:clamp(18px,5vw,64px); top:25px; z-index:2; }.movement-brand,.movement-skip { background:transparent; border:0; cursor:pointer; }.movement-brand img { display:block; filter:drop-shadow(0 0 15px rgba(98,230,255,.38)); height:66px; width:66px; }.movement-skip { align-items:center; border:1px solid rgba(126,156,255,.26); border-radius:999px; color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:8px; gap:8px; letter-spacing:.08em; padding:10px 13px; }.movement-skip:hover { border-color:var(--top-cyan); color:var(--top-ink); }.movement-skip span { color:var(--top-cyan); font-size:13px; }.movement-shell { align-items:center; display:grid; gap:clamp(46px,10vw,155px); grid-template-columns:minmax(0,1fr) minmax(370px,480px); margin:0 auto; max-width:1160px; position:relative; width:100%; z-index:1; }.movement-intro > span,.movement-card-top span,.movement-card label > span,.home-options legend { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.17em; }.movement-intro h1 { font-family:var(--top-display); font-size:clamp(47px,6vw,79px); font-weight:700; letter-spacing:-.085em; line-height:.89; margin:18px 0; max-width:590px; }.movement-intro h1 em { color:var(--top-lime); font-style:normal; }.movement-intro > p { color:var(--top-muted); font-size:14px; line-height:1.75; max-width:530px; }.movement-intro ol { display:grid; gap:12px; list-style:none; margin:34px 0 0; padding:0; }.movement-intro li { align-items:center; color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:9px; gap:11px; letter-spacing:.08em; }.movement-intro li b { align-items:center; border:1px solid rgba(126,156,255,.28); border-radius:50%; display:flex; font-size:7px; height:25px; justify-content:center; width:25px; }.movement-intro li.active { color:var(--top-ink); }.movement-intro li.active b { background:var(--top-cyan); border-color:var(--top-cyan); color:#07101d; }.movement-intro li.complete b { border-color:var(--top-lime); color:var(--top-lime); }.movement-card { background:linear-gradient(145deg,rgba(21,30,75,.88),rgba(7,9,27,.95)); border:1px solid rgba(128,160,255,.32); border-radius:28px 28px 8px 28px; box-shadow:0 34px 100px rgba(0,0,0,.43),inset 0 1px rgba(235,244,255,.1); padding:clamp(27px,4vw,42px); position:relative; }.movement-card::before { background:radial-gradient(circle,rgba(98,230,255,.21),transparent 69%); content:""; height:230px; position:absolute; right:-100px; top:-110px; width:230px; }.movement-card-top { display:flex; justify-content:space-between; position:relative; }.movement-card-top small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.movement-card form { display:grid; gap:15px; margin-top:25px; position:relative; }.movement-card h2 { font-family:var(--top-display); font-size:38px; font-weight:700; letter-spacing:-.07em; line-height:.92; margin:0; }.movement-card form > p { color:var(--top-muted); font-size:12px; line-height:1.65; margin:0 0 7px; }.movement-card label { display:grid; gap:8px; }.movement-card label > span em { color:var(--top-muted); font-size:7px; font-style:normal; margin-left:5px; }.movement-card input,.movement-card textarea { background:rgba(3,5,17,.68); border:1px solid rgba(127,159,255,.29); border-radius:13px 13px 4px 13px; color:var(--top-ink); font:inherit; font-size:12px; outline:0; padding:13px; }.movement-card textarea { min-height:115px; resize:vertical; }.movement-card input:focus,.movement-card textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.movement-card form > button,.movement-actions button { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#a08aff 54%,var(--top-pink)); border:1px solid rgba(255,255,255,.42); border-radius:999px; color:#07101d; cursor:pointer; display:flex; font-size:10px; font-weight:900; justify-content:space-between; margin-top:5px; padding:13px 15px 13px 18px; }.movement-card form > button i,.movement-actions button i { align-items:center; background:rgba(4,8,24,.13); border-radius:50%; display:flex; font-size:15px; font-style:normal; height:24px; justify-content:center; width:24px; }.movement-card button:disabled { cursor:wait; opacity:.56; }.movement-actions { display:flex; gap:10px; justify-content:flex-end; }.movement-actions .secondary { background:transparent; border-color:rgba(126,156,255,.32); color:var(--top-muted); }.home-options { border:0; display:grid; gap:8px; margin:0; padding:0; }.home-options legend { margin-bottom:7px; padding:0; }.home-options label { align-items:center; background:rgba(3,5,17,.43); border:1px solid rgba(126,156,255,.22); border-radius:14px 14px 4px 14px; cursor:pointer; display:grid; gap:10px; grid-template-columns:auto minmax(0,1fr) auto; padding:12px; }.home-options label.selected { background:rgba(98,230,255,.1); border-color:var(--top-cyan); }.home-options input { accent-color:var(--top-cyan); height:15px; margin:0; padding:0; width:15px; }.home-options span { display:grid; gap:3px; }.home-options b { font-size:11px; }.home-options small { color:var(--top-muted); font-size:9px; line-height:1.4; }.home-options i { color:var(--top-lime); font-size:16px; font-style:normal; }.movement-error { background:rgba(255,113,171,.09); border-left:2px solid var(--top-pink); color:#ffd7e7!important; font-size:10px!important; padding:9px; }.movement-orbit { border:1px solid rgba(98,230,255,.11); border-radius:50%; pointer-events:none; position:absolute; }.movement-orbit-one { height:620px; left:-285px; top:-285px; width:620px; }.movement-orbit-two { animation:movement-drift 18s ease-in-out infinite alternate; bottom:-390px; height:720px; right:-295px; width:720px; } @keyframes movement-drift { to { transform:translate(-25px,-28px) scale(1.07); } } @media (max-width:830px) { .movement-page { align-items:flex-start; overflow:auto; padding:112px 20px 46px; }.movement-shell { grid-template-columns:1fr; max-width:570px; }.movement-intro h1 { font-size:clamp(45px,12vw,66px); }.movement-intro ol { margin:25px 0 6px; }.movement-header { left:16px; right:16px; top:16px; }.movement-brand img { height:54px; width:54px; }.movement-card { padding:27px 23px; } } @media (prefers-reduced-motion:reduce) { .movement-orbit-two { animation:none; } }
</style>
