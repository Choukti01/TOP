<template>
  <section class="intro" :class="{ entering, 'path-open': pathOpen }" @pointermove="guideField" @pointerleave="releaseField">
    <ThreeField mode="arrival" :pulse="fieldPulse" :drift="fieldDrift" />
    <div class="intro-haze" aria-hidden="true"></div>
    <div class="intro-grid" aria-hidden="true"></div>
    <svg class="signal-lines" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-40 692C205 497 387 876 637 624s372 12 551-157 294-151 505-46" />
      <path d="M-15 295c248-141 392 119 607-29s344-66 538 21 300-44 523-210" />
      <circle cx="1212" cy="340" r="134" /><circle cx="1212" cy="340" r="211" />
    </svg>

    <header class="intro-header">
      <button class="brand-mark" type="button" aria-label="Return to the TOP arrival" @click="resetArrival">
        <img :src="topLogoUrl" alt="TOP" />
      </button>
      <div class="header-reading" aria-label="TOP purpose"><i aria-hidden="true"></i><span>A FIELD FOR REAL MOVEMENT</span></div>
      <button class="sign-in" type="button" @click="signIn">Sign in <span aria-hidden="true">→</span></button>
    </header>

    <aside class="field-index" aria-label="Arrival progress">
      <span>01</span><i></i><small>ARRIVAL</small>
    </aside>

    <main class="arrival-copy">
      <div class="arrival-eyebrow"><i aria-hidden="true"></i><span>YOUR ATTENTION CAN BECOME A STARTING POINT</span></div>
      <h1><span>On your way to the T0P,</span><em>don’t forget to<br />make a plan.</em></h1>
      <p class="arrival-statement">Bring one idea to the place where it can meet people, take form, and leave a real trace.</p>
      <p class="arrival-support">TOP turns a signal into a circle, a circle into work, and work into a life that moves forward.</p>

      <div class="arrival-actions">
        <button class="begin" type="button" :disabled="entering" @click="enter">
          <span><small>ENTER THE FIELD</small>{{ entering ? 'Opening the field…' : 'Begin something real' }}</span><i aria-hidden="true">→</i>
        </button>
        <button class="loop-toggle" type="button" :aria-expanded="pathOpen" aria-controls="top-loop" @click="togglePath">
          <span>{{ pathOpen ? 'Close the path' : 'See how it moves' }}</span><i aria-hidden="true">{{ pathOpen ? '−' : '+' }}</i>
        </button>
      </div>

      <Transition name="path-reveal">
        <section v-if="pathOpen" id="top-loop" class="movement-loop" aria-label="How TOP moves an idea into the world">
          <p>A project is not a post. It is a return to something that matters.</p>
          <ol>
            <li><span>01</span><strong>Signal</strong><small>Name what wants to move.</small></li>
            <li><span>02</span><strong>Circle</strong><small>Let the right people enter.</small></li>
            <li><span>03</span><strong>Work</strong><small>Make the next action real.</small></li>
            <li><span>04</span><strong>Trace</strong><small>Keep evidence and learning.</small></li>
          </ol>
        </section>
      </Transition>
    </main>

    <aside class="field-reading" aria-label="What TOP protects">
      <span>THE LONGER VIEW</span>
      <p>Less consumption.<br />More creation.</p>
      <small>MOVE THE FIELD WITH YOUR CURSOR</small>
    </aside>

    <footer class="intro-footer">
      <span><i aria-hidden="true"></i> THE FIELD IS OPEN</span>
      <p>NOT A FEED · A PRACTICE</p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

import ThreeField from "../components/ThreeField.vue";
import { topLogoUrl } from "../lib/brand";
import { useExperienceStore } from "../stores/experience";

const router = useRouter();
const experience = useExperienceStore();
const entering = ref(false);
const pathOpen = ref(false);
const fieldPulse = ref(0);
const fieldDrift = ref({ x: 0, y: 0 });

function guideField(event: PointerEvent): void {
  const x = event.clientX / Math.max(window.innerWidth, 1) * 2 - 1;
  const y = event.clientY / Math.max(window.innerHeight, 1) * 2 - 1;
  fieldDrift.value = { x, y };
}

function releaseField(): void {
  fieldDrift.value = { x: 0, y: 0 };
}

function resetArrival(): void {
  pathOpen.value = false;
  releaseField();
  fieldPulse.value += 1;
}

function togglePath(): void {
  pathOpen.value = !pathOpen.value;
  fieldPulse.value += 1;
}

function signIn(): void {
  void router.push({ path: "/join", query: { next: "/top" } });
}

function enter(): void {
  if (entering.value) return;
  entering.value = true;
  pathOpen.value = false;
  fieldPulse.value += 1;
  window.setTimeout(() => experience.enter(), 560);
}
</script>

<style scoped>
.intro { align-items:center; background:#030510; color:var(--top-ink); display:flex; inset:0; isolation:isolate; justify-content:center; min-height:100dvh; overflow:hidden; position:fixed; z-index:1000; }.intro-haze { background:radial-gradient(circle at 50% 46%,rgba(89,94,255,.19),transparent 19%),radial-gradient(circle at 19% 73%,rgba(66,222,255,.12),transparent 30%),radial-gradient(circle at 84% 24%,rgba(255,114,189,.11),transparent 27%),linear-gradient(122deg,rgba(3,5,16,.12),rgba(3,5,16,.5) 50%,rgba(3,5,16,.83)); inset:0; pointer-events:none; position:absolute; z-index:1; }.intro-grid { background-image:linear-gradient(rgba(128,158,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(128,158,255,.045) 1px,transparent 1px); background-size:68px 68px; inset:-20%; mask-image:radial-gradient(ellipse at center,black,transparent 66%); opacity:.62; pointer-events:none; position:absolute; transform:perspective(600px) rotateX(61deg) translateY(21%); z-index:1; }.signal-lines { animation:signal-drift 26s ease-in-out infinite alternate; fill:none; height:100%; opacity:.47; pointer-events:none; position:absolute; stroke:rgba(123,158,255,.28); stroke-width:1; width:100%; z-index:2; }.signal-lines circle { stroke:rgba(98,230,255,.2); }.intro-header,.field-index,.field-reading,.intro-footer,.arrival-copy { position:absolute; z-index:3; }.intro-header { align-items:center; display:flex; left:clamp(22px,4vw,62px); right:clamp(22px,4vw,62px); top:clamp(19px,3vw,35px); }.brand-mark { background:transparent; border:0; border-radius:12px 12px 3px 12px; cursor:pointer; display:flex; padding:4px; transition:background .2s ease,transform .2s ease; }.brand-mark:hover { background:rgba(98,230,255,.09); transform:translateY(-2px); }.brand-mark img { filter:drop-shadow(0 0 13px rgba(98,230,255,.35)); height:49px; object-fit:contain; width:49px; }.header-reading { align-items:center; color:rgba(208,220,255,.56); display:flex; font-family:var(--top-mono); font-size:8px; font-weight:700; gap:10px; letter-spacing:.14em; margin-left:17px; }.header-reading i,.arrival-eyebrow i,.intro-footer span i { background:var(--top-cyan); border-radius:50%; box-shadow:0 0 16px var(--top-cyan); display:block; flex:0 0 auto; height:5px; width:5px; }.sign-in { align-items:center; background:rgba(8,13,35,.48); border:1px solid rgba(128,158,255,.28); border-radius:999px; color:var(--top-ink); cursor:pointer; display:flex; font-family:var(--top-mono); font-size:9px; gap:10px; margin-left:auto; padding:10px 12px 10px 15px; transition:.2s ease; }.sign-in:hover { background:rgba(98,230,255,.11); border-color:var(--top-cyan); transform:translateY(-2px); }.sign-in span { color:var(--top-cyan); font-size:14px; }.field-index { align-items:center; display:flex; gap:10px; left:clamp(22px,4vw,62px); top:50%; transform:rotate(-90deg) translateX(-50%); transform-origin:left top; }.field-index span,.field-index small { font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.15em; }.field-index span { color:var(--top-cyan); }.field-index small { color:rgba(202,215,250,.4); }.field-index i { background:linear-gradient(90deg,var(--top-cyan),transparent); height:1px; width:73px; }.arrival-copy { animation:arrival-rise .9s .08s cubic-bezier(.16,.9,.25,1) both; left:50%; max-width:760px; padding:22px; text-align:center; top:50%; transform:translate(-50%,-50%); width:min(100%,840px); }.arrival-eyebrow { align-items:center; color:var(--top-cyan); display:flex; font-family:var(--top-mono); font-size:8px; font-weight:800; gap:10px; justify-content:center; letter-spacing:.16em; }.arrival-copy h1 { color:#f4f8ff; font-family:var(--top-display); font-size:clamp(62px,8.7vw,126px); font-weight:700; letter-spacing:-.095em; line-height:.79; margin:24px 0 23px; text-shadow:0 0 44px rgba(135,122,255,.25),0 6px 45px rgba(0,0,0,.74); }.arrival-copy h1 em { color:#b2a2ff; font-style:normal; }.arrival-statement { color:rgba(237,243,255,.88); font-size:clamp(16px,1.55vw,20px); line-height:1.52; margin:0 auto; max-width:600px; }.arrival-support { color:var(--top-muted); font-size:13px; line-height:1.65; margin:11px auto 0; max-width:530px; }.arrival-actions { align-items:center; display:flex; gap:12px; justify-content:center; margin-top:30px; }.begin { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#a08aff 53%,var(--top-pink)); border:1px solid rgba(255,255,255,.53); border-radius:999px; box-shadow:0 18px 50px rgba(83,105,255,.4),inset 0 1px rgba(255,255,255,.65); color:#07101d; cursor:pointer; display:flex; gap:19px; min-height:58px; padding:8px 9px 8px 20px; text-align:left; transition:transform .25s ease,box-shadow .25s ease; }.begin:hover:not(:disabled) { box-shadow:0 22px 59px rgba(83,105,255,.57),inset 0 1px rgba(255,255,255,.65); transform:translateY(-4px); }.begin:disabled { cursor:wait; opacity:.72; }.begin small,.begin span { display:block; }.begin small { color:rgba(7,16,29,.62); font-family:var(--top-mono); font-size:7px; font-weight:900; letter-spacing:.12em; margin-bottom:3px; }.begin span { font-family:var(--top-display); font-size:18px; font-weight:800; line-height:1; }.begin i { align-items:center; background:rgba(7,16,29,.13); border-radius:50%; display:flex; font-size:20px; font-style:normal; height:39px; justify-content:center; width:39px; }.loop-toggle { align-items:center; background:rgba(8,13,35,.5); border:1px solid rgba(128,158,255,.28); border-radius:999px; color:rgba(225,234,255,.8); cursor:pointer; display:flex; font-family:var(--top-mono); font-size:9px; gap:11px; min-height:48px; padding:9px 11px 9px 15px; transition:.2s ease; }.loop-toggle:hover { border-color:var(--top-cyan); color:var(--top-ink); transform:translateY(-2px); }.loop-toggle i { align-items:center; background:rgba(98,230,255,.11); border-radius:50%; color:var(--top-cyan); display:flex; font-size:15px; font-style:normal; height:25px; justify-content:center; width:25px; }.movement-loop { background:linear-gradient(145deg,rgba(14,24,62,.8),rgba(7,10,28,.74)); border:1px solid rgba(122,154,255,.27); border-radius:19px 19px 5px 19px; box-shadow:0 22px 55px rgba(0,0,0,.24); margin:22px auto 0; max-width:690px; padding:15px; text-align:left; }.movement-loop > p { color:var(--top-muted); font-size:11px; line-height:1.5; margin:0 0 13px; }.movement-loop ol { display:grid; gap:1px; grid-template-columns:repeat(4,minmax(0,1fr)); list-style:none; margin:0; overflow:hidden; padding:0; border:1px solid rgba(122,154,255,.18); border-radius:11px 11px 3px 11px; }.movement-loop li { background:rgba(3,7,22,.52); min-height:78px; padding:11px; }.movement-loop li + li { border-left:1px solid rgba(122,154,255,.18); }.movement-loop li > span,.movement-loop small { display:block; font-family:var(--top-mono); font-size:7px; letter-spacing:.1em; }.movement-loop li > span { color:var(--top-cyan); }.movement-loop strong { color:var(--top-ink); display:block; font-size:13px; margin-top:7px; }.movement-loop small { color:var(--top-muted); line-height:1.45; margin-top:4px; }.field-reading { bottom:clamp(72px,10vh,126px); right:clamp(22px,4vw,62px); text-align:right; }.field-reading > span,.field-reading small { color:rgba(195,210,249,.43); display:block; font-family:var(--top-mono); font-size:7px; font-weight:700; letter-spacing:.15em; }.field-reading p { color:rgba(238,244,255,.76); font-family:var(--top-display); font-size:22px; line-height:.96; margin:11px 0 14px; }.field-reading small { color:var(--top-cyan); font-size:6px; }.intro-footer { align-items:center; border-top:1px solid rgba(122,154,255,.16); bottom:clamp(19px,3vw,32px); display:flex; justify-content:space-between; left:clamp(22px,4vw,62px); padding-top:12px; right:clamp(22px,4vw,62px); }.intro-footer span,.intro-footer p { color:rgba(195,210,249,.46); font-family:var(--top-mono); font-size:7px; font-weight:700; letter-spacing:.14em; margin:0; }.intro-footer span { align-items:center; display:flex; gap:8px; }.intro-footer span i { animation:field-pulse 1.8s ease-in-out infinite; height:4px; width:4px; }.path-reveal-enter-active,.path-reveal-leave-active { transition:opacity .32s ease,transform .32s ease; }.path-reveal-enter-from,.path-reveal-leave-to { opacity:0; transform:translateY(-9px); }.entering .arrival-copy { animation:field-entry .55s cubic-bezier(.3,.8,.2,1) both; }.entering .signal-lines { animation-duration:.7s; opacity:.8; }.entering :deep(.three-field canvas) { filter:brightness(1.2); }.intro :deep(.three-field canvas) { opacity:.93; transition:filter .45s ease; } @keyframes arrival-rise { from { opacity:0; transform:translate(-50%,calc(-50% + 25px)); } to { opacity:1; transform:translate(-50%,-50%); } } @keyframes signal-drift { to { transform:translate(18px,-11px) scale(1.025); } } @keyframes field-pulse { 50% { box-shadow:0 0 0 8px rgba(98,230,255,0),0 0 18px var(--top-cyan); } } @keyframes field-entry { to { opacity:0; transform:translate(-50%,calc(-50% - 19px)) scale(.96); } }
@media (max-width:760px) { .intro { align-items:flex-start; overflow-y:auto; position:fixed; }.intro-header { left:max(16px,env(safe-area-inset-left)); right:max(16px,env(safe-area-inset-right)); top:max(14px,env(safe-area-inset-top)); }.brand-mark img { height:47px; width:47px; }.header-reading,.field-index,.field-reading { display:none; }.sign-in { min-height:43px; padding:9px 11px 9px 13px; }.arrival-copy { animation:mobile-arrival-rise .8s .08s cubic-bezier(.16,.9,.25,1) both; left:0; padding:calc(93px + env(safe-area-inset-top)) 19px calc(76px + env(safe-area-inset-bottom)); position:relative; top:0; transform:none; width:100%; }.arrival-copy h1 { font-size:clamp(57px,17vw,87px); line-height:.81; margin:21px 0 18px; }.arrival-statement { font-size:17px; line-height:1.45; }.arrival-support { font-size:13px; line-height:1.52; margin-top:12px; }.arrival-actions { align-items:stretch; flex-direction:column; margin:25px auto 0; max-width:330px; }.begin,.loop-toggle { justify-content:space-between; width:100%; }.movement-loop { margin-top:17px; padding:12px; }.movement-loop ol { grid-template-columns:repeat(2,minmax(0,1fr)); }.movement-loop li:nth-child(3) { border-left:0; border-top:1px solid rgba(122,154,255,.18); }.movement-loop li:nth-child(4) { border-top:1px solid rgba(122,154,255,.18); }.movement-loop li { min-height:75px; }.intro-footer { bottom:max(16px,env(safe-area-inset-bottom)); left:16px; padding-top:10px; right:16px; }.intro-footer p { display:none; }.intro :deep(.three-field canvas) { opacity:.62; } }
@keyframes mobile-arrival-rise { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
@media (max-width:390px) { .arrival-copy { padding-left:16px; padding-right:16px; }.arrival-copy h1 { font-size:55px; }.arrival-eyebrow { font-size:7px; gap:8px; }.movement-loop li { padding:9px; }.movement-loop strong { font-size:12px; } }
@media (prefers-reduced-motion:reduce) { .signal-lines,.arrival-copy,.entering .arrival-copy { animation:none; }.path-reveal-enter-active,.path-reveal-leave-active { transition:none; } }
.arrival-copy h1 { font-size:clamp(55px,7.7vw,111px); line-height:.82; }.arrival-copy h1 span { color:rgba(233,241,255,.72); display:block; font-family:var(--top-body); font-size:.37em; font-weight:600; letter-spacing:-.045em; line-height:1.08; margin-bottom:17px; text-shadow:none; }.arrival-copy h1 em { display:block; } @media (max-width:760px) { .arrival-copy h1 { font-size:clamp(52px,13.5vw,78px); line-height:.83; }.arrival-copy h1 span { font-size:.39em; margin-bottom:14px; } }
</style>
