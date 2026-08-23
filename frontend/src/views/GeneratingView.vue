<template>
  <section class="generating">
    <ThreeField mode="generating" />

    <svg class="rings" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <ellipse cx="600" cy="450" rx="330" ry="210"></ellipse>
      <ellipse cx="600" cy="450" rx="238" ry="342"></ellipse>
      <path d="M61 713c267-312 423 172 631-149s305-176 478-142"></path>
    </svg>

    <main class="panel">
      <img class="generating-logo" :src="topLogoUrl" alt="TOP" />
      <span class="eyebrow">PREPARING YOUR STARTING POINT</span>
      <h1>The field is<br /><em>taking shape.</em></h1>
      <p>This sets up your local starting point, then opens the workspace where the real practice begins.</p>

      <div class="progress-shell">
        <div class="progress-copy"><span>{{ message }}</span><strong>{{ progress }}%</strong></div>
        <div class="bar" role="progressbar" aria-label="Preparing your TOP field" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="progress"><i :style="{ width: progress + '%' }"></i></div>
      </div>

      <button class="cancel" type="button" @click="cancel">← Adjust my choices</button>
    </main>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import ThreeField from "../components/ThreeField.vue";
import { topLogoUrl } from "../lib/brand";

const router = useRouter();
const progress = ref(0);
const message = ref("Finding the first thread…");
const messages = [
  "Saving your local starting point…",
  "Setting the field in motion…",
  "Making room for your projects…",
  "Opening TOP…"
];

let timer: ReturnType<typeof window.setInterval> | undefined;
let finishTimer: ReturnType<typeof window.setTimeout> | undefined;

onMounted(() => {
  let index = 0;

  timer = window.setInterval(() => {
    progress.value = Math.min(100, progress.value + 25);
    message.value = messages[index] ?? messages[messages.length - 1]!;
    index += 1;

    if (progress.value >= 100 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
      finishTimer = window.setTimeout(() => router.push("/workspace"), 520);
    }
  }, 620);
});

function cancel(): void {
  if (timer !== undefined) window.clearInterval(timer);
  if (finishTimer !== undefined) window.clearTimeout(finishTimer);
  router.push("/identity");
}

onUnmounted(() => {
  if (timer !== undefined) window.clearInterval(timer);
  if (finishTimer !== undefined) window.clearTimeout(finishTimer);
});
</script>

<style scoped>
.generating { align-items:center; background:radial-gradient(circle at 51% 47%,rgba(127,84,40,.25),transparent 31%),radial-gradient(circle at 86% 82%,rgba(111,138,84,.12),transparent 26%),#15120f; color:#f3ebde; display:flex; inset:0; justify-content:center; overflow:hidden; position:fixed; }.rings { animation:orbit 20s linear infinite; fill:none; height:100%; opacity:.48; position:absolute; stroke:rgba(232,187,117,.22); stroke-width:1; width:100%; }.rings ellipse:nth-child(2) { stroke:rgba(164,191,131,.18); }.rings path { stroke:rgba(234,188,116,.43); stroke-dasharray:2 8; }
.panel { animation:arrive .65s cubic-bezier(.2,.9,.3,1) both; max-width:600px; padding:34px; position:relative; text-align:center; }.seal { align-items:center; border:1px solid rgba(232,185,110,.73); border-radius:50%; display:inline-flex; height:45px; justify-content:center; margin-bottom:27px; position:relative; width:45px; }.seal::before,.seal::after { background:rgba(239,201,131,.57); content:""; height:1px; position:absolute; width:28px; }.seal::after{transform:rotate(90deg)}.seal i{border:1px solid rgba(232,188,112,.72);border-radius:50%;height:11px;position:absolute;width:11px}.seal i:first-child{transform:translate(8px,-8px)}.seal i:nth-child(2){border-color:rgba(162,190,132,.76);transform:translate(-8px,8px)}.seal b{background:#f5d8a5;border-radius:50%;box-shadow:0 0 12px #e2a95e;height:4px;width:4px}
.eyebrow { color:#e6ae64; display:block; font-size:9px; font-weight:850; letter-spacing:.2em; }.panel h1 { font-family:Georgia,"Times New Roman",serif; font-size:clamp(45px,6vw,75px); font-weight:500; letter-spacing:-.075em; line-height:.94; margin:18px 0; }.panel h1 em { color:#edc684; font-weight:400; }.panel > p { color:rgba(239,223,199,.64); font-size:14px; line-height:1.7; margin:0 auto; max-width:500px; }
.progress-shell { margin-top:39px; text-align:left; }.progress-copy { color:rgba(239,220,194,.58); display:flex; font-size:10px; justify-content:space-between; }.progress-copy strong { color:#ebbd78; font-weight:800; }.bar { background:rgba(239,213,174,.13); border-radius:99px; height:4px; margin-top:11px; overflow:hidden; }.bar i { background:linear-gradient(90deg,#b8794a,#efc77f); border-radius:inherit; display:block; height:100%; transition:width .48s cubic-bezier(.2,.8,.3,1); }.cancel { background:transparent; border:0; color:rgba(239,221,194,.57); cursor:pointer; font-size:10px; font-weight:700; margin-top:29px; padding:8px; transition:color .2s ease,transform .2s ease; }.cancel:hover { color:#eabb78; transform:translateX(-3px); }
@keyframes arrive { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } } @keyframes orbit { to { transform:rotate(2deg) scale(1.02); } } @media (prefers-reduced-motion:reduce) { .rings { animation:none; } }

.generating { background:radial-gradient(circle at 51% 47%,rgba(89,79,255,.24),transparent 31%),radial-gradient(circle at 86% 82%,rgba(72,222,255,.13),transparent 26%),#060711; color:var(--top-ink); }.generating .three-field { opacity:.52; }.rings { stroke:rgba(110,151,255,.25); }.rings ellipse:nth-child(2) { stroke:rgba(98,230,255,.2); }.rings path { stroke:var(--top-cyan); }.seal { border-color:rgba(98,230,255,.7); }.seal::before,.seal::after { background:rgba(156,124,255,.7); }.seal i { border-color:rgba(98,230,255,.7); }.seal i:nth-child(2) { border-color:rgba(217,255,113,.72); }.seal b { background:var(--top-lime); box-shadow:0 0 12px var(--top-lime); }.eyebrow { color:var(--top-cyan); font-family:var(--top-mono); }.panel h1 { font-family:var(--top-display); font-weight:700; letter-spacing:-.08em; }.panel h1 em { color:#ad98ff; }.panel > p,.progress-copy { color:var(--top-muted); }.progress-copy strong { color:var(--top-cyan); font-family:var(--top-mono); }.bar { background:rgba(124,153,255,.16); }.bar i { background:linear-gradient(90deg,var(--top-cyan),var(--top-violet),var(--top-pink)); box-shadow:0 0 14px rgba(98,230,255,.6); }.cancel { color:rgba(202,214,250,.62); font-family:var(--top-mono); }.cancel:hover { color:var(--top-cyan); }
.generating-logo { display:block; filter:drop-shadow(0 0 18px rgba(98,230,255,.38)); height:92px; margin:0 auto 23px; object-fit:contain; width:92px; }
</style>
