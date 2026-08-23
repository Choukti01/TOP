<template>
  <div class="canvas" ref="canvas">
    <WorkspaceToolbar />

    <div class="atmosphere" aria-hidden="true">
      <div class="paper-noise"></div>
      <div class="sun-wash wash-one"></div>
      <div class="sun-wash wash-two"></div>
      <svg class="terrain" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <path d="M-40 286C180 202 303 370 516 278s238-1 451-92 324-174 688-47"></path>
        <path d="M-85 360c212-79 415 70 605-24s245-62 414 21 386-113 729-52"></path>
        <path d="M-56 666c209-171 423-31 573-103s235-169 447-81 358 20 698-130"></path>
        <path d="M-21 753c239-141 390 28 613-110s373 89 575-46 315 25 495-54"></path>
      </svg>
      <svg class="thread" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <path d="M116 735c275-304 431 160 680-188S1284 324 1511 235"></path>
        <circle cx="116" cy="735" r="5"></circle><circle cx="796" cy="547" r="4"></circle><circle cx="1511" cy="235" r="5"></circle>
      </svg>
      <span class="margin-note note-two">PRACTICE / 01</span>
      <span class="soft-star star-one"></span><span class="soft-star star-two"></span><span class="soft-star star-three"></span>
    </div>

    <div
      class="world"
      :style="{
        transform: 'translate(' + WorkspaceState.x + 'px,' + WorkspaceState.y + 'px) scale(' + WorkspaceState.zoom + ')'
      }"
    >
      <WorkspaceGrid />
      <WorkspaceNode
        v-for="(node, index) in visibleNodes"
        :key="node.id"
        :node="node"
        :index="index"
      />
    </div>

    <section v-if="WorkspaceState.nodes.nodes.length === 0" class="field-empty">
      <span class="empty-orbit" aria-hidden="true"><i></i></span>
      <span class="eyebrow">AN OPEN FIELD</span>
      <h1>Nothing is pretending<br />to be in motion.</h1>
      <p>Begin only when there is a real project, practice, or contribution you are ready to carry forward.</p>
      <button type="button" @click="startProject"><span>+</span> Begin a project</button>
    </section>

    <FieldDock />

    <div class="field-whisper" aria-hidden="true">
      <span>{{ WorkspaceState.nodes.nodes.length || '—' }}</span>
      <p>{{ WorkspaceState.nodes.nodes.length ? 'real\nprojects' : 'room for\na beginning' }}</p>
    </div>

    <div class="canvas-hint">
      <span class="hint-mark" aria-hidden="true"></span>
      <span>Drag the field to make room for what matters.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

import WorkspaceToolbar from "./WorkspaceToolbar.vue";
import FieldDock from "./FieldDock.vue";
import WorkspaceGrid from "./WorkspaceGrid.vue";
import WorkspaceNode from "./WorkspaceNode.vue";
import { WorkspaceState } from "./WorkspaceState";
import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceCamera } from "./WorkspaceCamera";

const canvas = ref<HTMLElement>();
let workspaceCamera: WorkspaceCamera | undefined;

const visibleNodes = computed(() => {
  const term = WorkspaceState.searchTerm.trim().toLowerCase();

  if (!term) return WorkspaceState.nodes.nodes;

  return WorkspaceState.nodes.nodes.filter((node) =>
    node.title.toLowerCase().includes(term) || node.description.toLowerCase().includes(term)
  );
});

function pointerMove(event: PointerEvent): void {
  workspaceEngine.drag(event.clientX, event.clientY);
}

function pointerUp(): void {
  workspaceEngine.dragEnd();
}

function startProject(): void {
  WorkspaceState.projectComposerOpen = true;
}

onMounted(() => {
  void workspaceEngine.load();
  window.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("pointercancel", pointerUp);

  if (canvas.value) workspaceCamera = new WorkspaceCamera(canvas.value);
});

onUnmounted(() => {
  window.removeEventListener("pointermove", pointerMove);
  window.removeEventListener("pointerup", pointerUp);
  window.removeEventListener("pointercancel", pointerUp);
  workspaceCamera?.dispose();
});
</script>

<style scoped>
.canvas { background:radial-gradient(ellipse 74% 84% at 54% 48%,rgba(72,55,34,.3),transparent 56%),radial-gradient(circle at 8% 90%,rgba(71,91,65,.16),transparent 30%),radial-gradient(circle at 91% 10%,rgba(161,91,59,.14),transparent 24%),#15120f; height:100dvh; isolation:isolate; min-height:680px; overflow:hidden; position:relative; width:100%; }
.atmosphere { inset:0; overflow:hidden; pointer-events:none; position:absolute; z-index:0; }.paper-noise { background-image:radial-gradient(rgba(255,238,207,.19) .55px,transparent .75px); background-size:5px 5px; inset:0; mask-image:linear-gradient(90deg,transparent,black 16%,black 84%,transparent); opacity:.09; position:absolute; }.sun-wash { border-radius:50%; filter:blur(18px); position:absolute; }.wash-one { animation:wander-one 20s ease-in-out infinite alternate; background:radial-gradient(circle,rgba(211,153,79,.12),transparent 67%); height:650px; left:-252px; top:-270px; width:650px; }.wash-two { animation:wander-two 23s ease-in-out infinite alternate; background:radial-gradient(circle,rgba(127,155,101,.11),transparent 67%); bottom:-300px; height:670px; right:-250px; width:670px; }
.terrain { animation:terrain-drift 36s ease-in-out infinite alternate; fill:none; height:100%; left:0; opacity:.48; position:absolute; top:0; width:100%; }.terrain path { stroke:rgba(229,193,138,.18); stroke-width:1; vector-effect:non-scaling-stroke; }.terrain path:nth-child(2),.terrain path:nth-child(4) { stroke:rgba(151,179,122,.18); }.thread { fill:none; height:100%; left:0; opacity:.7; position:absolute; stroke:#d49c59; stroke-width:1; top:0; width:100%; }.thread path { stroke-dasharray:2 8; }.thread circle { fill:#e7c17e; stroke:none; }
.margin-note { color:rgba(239,219,188,.28); font-family:Georgia,"Times New Roman",serif; font-size:9px; font-style:italic; letter-spacing:.16em; position:absolute; }.note-one { left:34px; top:132px; transform:rotate(-90deg); transform-origin:left top; }.note-two { bottom:66px; right:35px; }.soft-star { animation:glimmer 3.6s ease-in-out infinite alternate; background:#f3d4a1; border-radius:50%; box-shadow:0 0 12px rgba(242,186,105,.5); height:3px; position:absolute; width:3px; }.star-one{left:24%;top:24%}.star-two{animation-delay:1s;left:81%;top:46%}.star-three{animation-delay:2s;left:47%;top:83%}
.world { inset:0; position:absolute; transform-origin:center; transition:transform .05s linear; z-index:1; }.field-whisper { align-items:center; background:rgba(25,20,15,.5); border:1px solid rgba(233,204,159,.13); border-radius:50%; bottom:28px; color:#f0e3cf; display:flex; height:86px; justify-content:center; position:absolute; right:32px; text-align:center; width:86px; z-index:4; }.field-whisper::before { border:1px solid rgba(210,154,82,.25); border-radius:inherit; content:""; inset:5px; position:absolute; }.field-whisper span { color:#dfaa61; font-family:Georgia,serif; font-size:24px; font-style:italic; line-height:1; position:relative; }.field-whisper p { color:rgba(237,221,197,.64); font-size:7px; font-weight:750; letter-spacing:.08em; line-height:1.2; margin:0 0 0 5px; position:relative; text-align:left; text-transform:uppercase; }
.field-empty { align-items:flex-start; background:linear-gradient(145deg,rgba(47,37,25,.56),rgba(24,19,14,.34)); border:1px solid rgba(233,205,164,.16); border-radius:34px 34px 8px 34px; box-shadow:0 30px 90px rgba(0,0,0,.2),inset 0 1px rgba(255,244,224,.05); display:flex; flex-direction:column; left:50%; max-width:570px; padding:clamp(28px,5vw,54px); position:absolute; text-align:left; top:50%; transform:translate(-50%,-47%); width:calc(100% - 48px); z-index:4; }.empty-orbit { align-items:center; border:1px solid rgba(231,182,107,.5); border-radius:50%; display:flex; height:48px; justify-content:center; margin-bottom:26px; position:relative; width:48px; }.empty-orbit::before { border:1px solid rgba(156,184,125,.4); border-radius:50%; content:""; inset:8px; position:absolute; }.empty-orbit i { animation:orbit 5s linear infinite; background:#efbd73; border-radius:50%; box-shadow:0 0 12px rgba(239,189,115,.7); height:5px; left:4px; position:absolute; top:19px; transform-origin:20px 5px; width:5px; }.field-empty .eyebrow { color:#e6b269; font-size:9px; font-weight:850; letter-spacing:.18em; }.field-empty h1 { font-family:Georgia,"Times New Roman",serif; font-size:clamp(37px,5vw,61px); font-weight:500; letter-spacing:-.07em; line-height:.94; margin:13px 0; }.field-empty p { color:rgba(234,220,199,.64); font-size:14px; line-height:1.7; margin:0; max-width:430px; }.field-empty button { align-items:center; background:linear-gradient(135deg,#efd08d,#c68548); border:1px solid rgba(255,227,175,.42); border-radius:999px; box-shadow:0 14px 38px rgba(188,117,47,.27),inset 0 1px rgba(255,248,225,.56); color:#291a0e; cursor:pointer; display:flex; font-size:11px; font-weight:850; gap:9px; margin-top:29px; padding:13px 18px; transition:transform .2s ease,box-shadow .2s ease; }.field-empty button:hover { box-shadow:0 18px 44px rgba(188,117,47,.4),inset 0 1px rgba(255,248,225,.56); transform:translateY(-3px); }.field-empty button span { font-size:18px; font-weight:400; line-height:0; }.canvas-hint { align-items:center; bottom:29px; color:rgba(232,216,193,.45); display:flex; font-size:10px; gap:8px; left:30px; letter-spacing:.02em; pointer-events:none; position:absolute; z-index:4; }.hint-mark { border:1px solid rgba(218,169,97,.54); border-radius:50%; height:10px; position:relative; width:10px; }.hint-mark::after { background:#e5b46d; border-radius:50%; box-shadow:0 0 10px #e5b46d; content:""; height:3px; left:2.5px; position:absolute; top:2.5px; width:3px; }
@keyframes wander-one { to { transform:translate(82px,54px) scale(1.08); } } @keyframes wander-two { to { transform:translate(-62px,-41px) scale(1.1); } } @keyframes terrain-drift { to { transform:translate3d(13px,-8px,0) scale(1.02); } } @keyframes glimmer { to { opacity:.18; transform:scale(.55); } } @keyframes orbit { to { transform:rotate(360deg); } }
@media (max-width:700px) { .margin-note,.field-whisper { display:none; }.field-empty { padding:33px 25px; transform:translate(-50%,-43%); }.canvas-hint { bottom:23px; left:17px; }.star-two { display:none; } }
@media (prefers-reduced-motion:reduce) { .sun-wash,.terrain,.soft-star,.empty-orbit i { animation:none; } }

.canvas { background:radial-gradient(ellipse 74% 84% at 54% 48%,rgba(92,82,255,.18),transparent 56%),radial-gradient(circle at 8% 90%,rgba(65,224,255,.12),transparent 30%),radial-gradient(circle at 91% 10%,rgba(255,91,185,.12),transparent 24%),rgba(6,7,17,.55); backdrop-filter:blur(1.5px); }.paper-noise { opacity:.05; }.wash-one { background:radial-gradient(circle,rgba(133,104,255,.2),transparent 67%); }.wash-two { background:radial-gradient(circle,rgba(72,222,255,.16),transparent 67%); }.terrain path { stroke:rgba(126,158,255,.25); }.terrain path:nth-child(2),.terrain path:nth-child(4) { stroke:rgba(98,230,255,.2); }.thread { stroke:#74e9ff; }.thread circle { fill:#d9ff71; filter:drop-shadow(0 0 7px #d9ff71); }.margin-note { color:rgba(190,204,255,.38); font-family:var(--top-mono); font-style:normal; }.soft-star { background:#bca9ff; box-shadow:0 0 14px rgba(140,115,255,.7); }.field-empty { background:linear-gradient(145deg,rgba(22,29,67,.78),rgba(8,11,28,.62)); border-color:rgba(125,157,255,.3); box-shadow:0 34px 100px rgba(0,0,0,.4),inset 0 1px rgba(220,232,255,.1); }.field-empty::before { background:linear-gradient(90deg,var(--top-cyan),var(--top-violet),var(--top-pink)); content:""; height:2px; left:26px; opacity:.9; position:absolute; right:26px; top:0; }.empty-orbit { border-color:rgba(98,230,255,.62); }.empty-orbit::before { border-color:rgba(156,124,255,.55); }.empty-orbit i { background:var(--top-lime); box-shadow:0 0 14px var(--top-lime); }.field-empty .eyebrow { color:var(--top-cyan); font-family:var(--top-mono); }.field-empty h1 { font-family:var(--top-display); font-weight:700; letter-spacing:-.075em; }.field-empty p { color:var(--top-muted); }.field-empty button { background:linear-gradient(110deg,var(--top-cyan),#9e8aff 52%,var(--top-pink)); box-shadow:0 16px 38px rgba(84,108,255,.32),inset 0 1px rgba(255,255,255,.6); color:#07101d; }.field-whisper { background:rgba(11,15,35,.72); border-color:rgba(111,153,255,.28); }.field-whisper::before { border-color:rgba(98,230,255,.3); }.field-whisper span { color:var(--top-cyan); font-family:var(--top-display); font-style:normal; }.field-whisper p,.canvas-hint { color:rgba(190,205,244,.54); font-family:var(--top-mono); }.hint-mark { border-color:var(--top-violet); }.hint-mark::after { background:var(--top-cyan); box-shadow:0 0 10px var(--top-cyan); }
</style>
