<template>
  <section v-if="visible" class="threshold">
    <div class="veil" aria-hidden="true"></div>
    <svg class="path-lines" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-32 612c249-188 399 131 620-85s336 70 574-62 288-24 476-155"></path>
      <circle cx="451" cy="456" r="164"></circle><circle cx="451" cy="456" r="228"></circle>
    </svg>

    <main>
      <button class="back" type="button" @click="returnToWelcome">← Back</button>
      <span class="eyebrow">THE THRESHOLD</span>
      <h1>What will you make<br /><em>more possible?</em></h1>
      <p>Begin by naming the direction you are growing toward, or step directly into the work already waiting for you.</p>

      <div class="choices">
        <button class="choice primary" type="button" @click="startJourney">
          <span class="choice-symbol">01</span>
          <span><small>BEGIN WITH INTENTION</small><strong>Shape my field</strong><i>Build the first outline of your world.</i></span>
          <b aria-hidden="true">↗</b>
        </button>
        <button class="choice" type="button" @click="continueJourney">
          <span class="choice-symbol">02</span>
          <span><small>CONTINUE THE PRACTICE</small><strong>Open my private Field</strong><i>Return to projects, questions, and momentum.</i></span>
          <b aria-hidden="true">↗</b>
        </button>
      </div>
    </main>

    <p class="side-note">TOP IS A BRIDGE<br />BACK TO REAL LIFE</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import { useExperienceStore } from "../stores/experience";

const router = useRouter();
const route = useRoute();
const experience = useExperienceStore();
const visible = computed(() => route.path === "/");

function startJourney(): void {
  router.push("/identity");
}

function continueJourney(): void {
  router.push("/field");
}

function returnToWelcome(): void {
  experience.showIntro();
}
</script>

<style scoped>
.threshold { align-items:center; color:#f5ecdf; display:flex; inset:0; justify-content:center; overflow:hidden; position:fixed; z-index:2000; }.veil { background:radial-gradient(circle at 50% 47%,rgba(85,56,28,.25),rgba(13,10,8,.5) 53%,rgba(11,9,7,.83)),linear-gradient(120deg,rgba(120,78,35,.06),transparent 50%,rgba(78,102,59,.1)); inset:0; position:absolute; }.path-lines { animation:drift 34s ease-in-out infinite alternate; fill:none; height:100%; opacity:.36; position:absolute; stroke:rgba(232,191,124,.27); stroke-width:1; width:100%; }.path-lines circle:nth-child(3){stroke:rgba(157,183,128,.18)}
main { animation:rise .75s cubic-bezier(.2,.9,.3,1) both; max-width:790px; padding:34px; position:relative; text-align:center; }.back { background:transparent; border:0; color:rgba(244,225,199,.6); cursor:pointer; font-size:10px; left:34px; padding:7px; position:fixed; top:28px; transition:color .2s ease,transform .2s ease; }.back:hover { color:#efbd79; transform:translateX(-3px); }.eyebrow { color:#e5af64; font-size:9px; font-weight:850; letter-spacing:.2em; }.threshold h1 { font-family:Georgia,"Times New Roman",serif; font-size:clamp(46px,6.4vw,85px); font-weight:500; letter-spacing:-.075em; line-height:.94; margin:18px 0; }.threshold h1 em { color:#edc784; font-weight:400; }.threshold main > p { color:rgba(240,225,203,.66); font-size:14px; line-height:1.7; margin:0 auto; max-width:580px; }
.choices { display:grid; gap:13px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:37px; text-align:left; }.choice { align-items:flex-start; background:linear-gradient(145deg,rgba(45,34,22,.78),rgba(23,18,13,.85)); border:1px solid rgba(235,207,165,.15); border-radius:22px 22px 7px 22px; color:#f2e7d8; cursor:pointer; display:flex; gap:13px; min-height:166px; padding:19px; position:relative; transition:transform .22s ease,border-color .22s ease,background .22s ease; }.choice:hover { background:linear-gradient(145deg,rgba(64,46,25,.88),rgba(29,22,15,.92)); border-color:rgba(233,180,101,.48); transform:translateY(-5px); }.choice.primary { background:linear-gradient(145deg,rgba(176,119,61,.28),rgba(47,50,32,.38)); }.choice-symbol { border:1px solid rgba(230,183,109,.42); border-radius:50%; color:#e9b66f; flex:0 0 auto; font-family:Georgia,serif; font-size:11px; height:31px; line-height:30px; text-align:center; width:31px; }.choice small,.choice strong,.choice i { display:block; }.choice small { color:rgba(235,216,187,.48); font-size:8px; font-style:normal; font-weight:800; letter-spacing:.11em; }.choice strong { font-family:Georgia,serif; font-size:21px; font-weight:500; letter-spacing:-.035em; margin-top:6px; }.choice i { color:rgba(239,222,199,.57); font-size:11px; font-style:normal; line-height:1.5; margin-top:8px; }.choice b { bottom:17px; color:#eab773; font-size:15px; font-weight:400; position:absolute; right:18px; }
.side-note { bottom:32px; color:rgba(239,223,201,.37); font-size:8px; font-weight:800; letter-spacing:.16em; line-height:1.6; position:absolute; right:38px; text-align:right; }.side-note::before { background:#d99b53; content:""; display:block; height:21px; margin:0 0 8px auto; opacity:.62; width:1px; }
@keyframes rise { from { opacity:0; transform:translateY(26px); } to { opacity:1; transform:none; } } @keyframes drift { to { transform:translate(16px,-10px) scale(1.02); } }
@media (max-width:640px) { main { padding:25px; }.threshold h1 { font-size:50px; }.choices { grid-template-columns:1fr; margin-top:28px; }.choice { min-height:126px; }.back { left:16px; top:18px; }.side-note { display:none; } }
@media (prefers-reduced-motion:reduce) { main,.path-lines { animation:none; } }

.threshold { color:var(--top-ink); }.veil { background:radial-gradient(circle at 50% 47%,rgba(87,78,255,.22),rgba(5,7,18,.58) 53%,rgba(2,3,12,.9)),linear-gradient(120deg,rgba(74,220,255,.08),transparent 50%,rgba(133,89,255,.12)); }.path-lines { stroke:rgba(110,151,255,.32); }.path-lines circle:nth-child(3) { stroke:rgba(98,230,255,.23); }.back { color:rgba(202,214,250,.64); font-family:var(--top-mono); }.back:hover { color:var(--top-cyan); }.eyebrow { color:var(--top-cyan); font-family:var(--top-mono); }.threshold h1 { font-family:var(--top-display); font-weight:700; letter-spacing:-.085em; }.threshold h1 em { color:#ad98ff; }.threshold main > p { color:var(--top-muted); }.choice { background:linear-gradient(145deg,rgba(24,32,74,.78),rgba(9,12,30,.86)); border-color:rgba(123,153,255,.24); }.choice:hover { background:linear-gradient(145deg,rgba(38,50,110,.92),rgba(11,15,38,.96)); border-color:var(--top-cyan); box-shadow:0 20px 52px rgba(47,72,223,.2); }.choice.primary { background:linear-gradient(145deg,rgba(73,94,235,.35),rgba(25,62,80,.4)); }.choice-symbol { border-color:rgba(98,230,255,.55); color:var(--top-cyan); font-family:var(--top-mono); }.choice small { color:rgba(193,207,248,.53); font-family:var(--top-mono); }.choice strong { font-family:var(--top-display); font-weight:700; letter-spacing:-.055em; }.choice i { color:var(--top-muted); }.choice b { color:var(--top-cyan); }.side-note { color:rgba(192,207,248,.42); font-family:var(--top-mono); }.side-note::before { background:linear-gradient(var(--top-cyan),var(--top-violet)); }
</style>
