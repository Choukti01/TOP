<template>
  <section class="arrival" aria-label="Entering your TOP field">
    <ThreeField mode="arrival" :pulse="1" />

    <div class="arrival-lines" aria-hidden="true"><i></i><i></i><i></i></div>

    <div class="arrival-copy">
      <img class="arrival-logo" :src="topLogoUrl" alt="TOP" />
      <span class="eyebrow">YOUR FIELD IS LIVE</span>
      <h1>Entering the<br /><em>possible.</em></h1>
      <p>Projects, questions, and the next real move are waiting in one place.</p>
    </div>

    <div class="entry-readout" aria-hidden="true">
      <span>LINKING YOUR FIELD</span>
      <i><b></b></i>
      <strong>01 / 01</strong>
    </div>

    <button class="skip" type="button" @click="complete">Skip transition <span>↗</span></button>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import ThreeField from "../ThreeField.vue";
import { topLogoUrl } from "../../lib/brand";

const emit = defineEmits<{ complete: [] }>();
let timer: ReturnType<typeof window.setTimeout> | undefined;

function complete(): void {
  if (timer !== undefined) window.clearTimeout(timer);
  emit("complete");
}

onMounted(() => {
  timer = window.setTimeout(complete, 1_650);
});

onUnmounted(() => {
  if (timer !== undefined) window.clearTimeout(timer);
});
</script>

<style scoped>
.arrival { align-items:center; background:radial-gradient(circle at 50% 50%,rgba(117,101,255,.2),transparent 25%),radial-gradient(circle at 18% 81%,rgba(47,220,255,.12),transparent 32%),#03040e; color:var(--top-ink); display:flex; inset:0; justify-content:center; overflow:hidden; position:fixed; z-index:500; }.arrival::before { background:radial-gradient(circle,transparent 0 29%,rgba(98,230,255,.15) 30%,transparent 30.4% 46%,rgba(156,124,255,.11) 46.4%,transparent 46.7%); border-radius:50%; content:""; height:min(92vw,1100px); opacity:.75; position:absolute; width:min(92vw,1100px); }.arrival::after { background:linear-gradient(90deg,transparent,rgba(216,229,255,.08),transparent); content:""; height:1px; left:0; position:absolute; right:0; top:50%; }.arrival-lines { animation:stream 1.5s cubic-bezier(.2,.7,.3,1) both; inset:0; pointer-events:none; position:absolute; }.arrival-lines i { background:linear-gradient(90deg,transparent,rgba(98,230,255,.75),transparent); height:1px; opacity:.62; position:absolute; transform:rotate(-27deg); width:68vw; }.arrival-lines i:nth-child(1) { left:-12vw; top:24%; }.arrival-lines i:nth-child(2) { right:-18vw; top:68%; }.arrival-lines i:nth-child(3) { left:12vw; top:84%; width:42vw; }.arrival-copy { animation:arrive 1.15s .12s cubic-bezier(.16,.92,.27,1) both; max-width:620px; padding:28px; position:relative; text-align:center; z-index:1; }.arrival-mark { border:1px solid rgba(98,230,255,.6); border-radius:50%; display:inline-flex; height:45px; margin-bottom:23px; position:relative; width:45px; }.arrival-mark::before,.arrival-mark::after { background:rgba(156,124,255,.72); content:""; height:1px; left:7px; position:absolute; top:21px; width:29px; }.arrival-mark::after { transform:rotate(90deg); }.arrival-mark i { border:1px solid var(--top-cyan); border-radius:50%; height:9px; position:absolute; width:9px; }.arrival-mark i:first-child { transform:translate(26px,9px); }.arrival-mark i:nth-child-child(2) { transform:translate(8px,27px); }.arrival-mark b { background:var(--top-lime); border-radius:50%; box-shadow:0 0 15px var(--top-lime); height:4px; left:20px; position:absolute; top:20px; width:4px; }.eyebrow { color:var(--top-cyan); display:block; font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.2em; }.arrival h1 { font-family:var(--top-display); font-size:clamp(54px,7.5vw,102px); font-weight:800; letter-spacing:-.095em; line-height:.84; margin:15px 0 19px; }.arrival h1 em { color:#b3a0ff; font-style:normal; }.arrival p { color:var(--top-muted); font-size:14px; line-height:1.65; margin:0 auto; max-width:420px; }.entry-readout { align-items:center; bottom:28px; display:flex; font-family:var(--top-mono); font-size:8px; gap:11px; left:30px; letter-spacing:.13em; position:absolute; z-index:1; }.entry-readout > span { color:rgba(193,207,248,.53); }.entry-readout > i { background:rgba(120,151,255,.19); display:block; height:2px; overflow:hidden; position:relative; width:92px; }.entry-readout > i b { animation:load 1.35s ease-out both; background:linear-gradient(90deg,var(--top-cyan),var(--top-violet),var(--top-pink)); display:block; height:100%; }.entry-readout strong { color:var(--top-cyan); font-weight:500; }.skip { background:transparent; border:0; bottom:25px; color:rgba(209,220,255,.64); cursor:pointer; font-family:var(--top-mono); font-size:9px; padding:9px; position:absolute; right:26px; transition:color .2s ease,transform .2s ease; z-index:1; }.skip:hover { color:var(--top-cyan); transform:translateX(3px); }.skip span { color:var(--top-cyan); font-size:15px; margin-left:5px; }.arrival :deep(.three-field canvas) { opacity:.9; }
@keyframes arrive { from { opacity:0; transform:translateY(28px) scale(.91); } 62% { opacity:1; } to { opacity:1; transform:none; } } @keyframes stream { from { opacity:0; transform:scale(1.35); } to { opacity:1; transform:none; } } @keyframes load { from { transform:translateX(-100%); } to { transform:none; } }
@media (max-width:620px) { .entry-readout { bottom:17px; left:17px; }.entry-readout > span { display:none; }.skip { bottom:14px; right:12px; }.arrival h1 { font-size:58px; } }
@media (prefers-reduced-motion:reduce) { .arrival-copy,.arrival-lines,.entry-readout > i b { animation:none; } }
.arrival-mark i:nth-child(2) { transform:translate(8px,27px); }
.arrival-logo { display:block; filter:drop-shadow(0 0 17px rgba(98,230,255,.38)); height:118px; margin:0 auto 21px; object-fit:contain; width:118px; }
</style>
