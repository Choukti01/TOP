<template>
  <section class="studio">
    <header class="studio-header">
      <div><span class="eyebrow">FREEFORM CRAFT</span><h2>Your hand is the first tool.</h2><p>Draw with a mouse, pen, or finger. This is your own field—not a template and not a feed.</p></div>
      <div class="studio-status"><span></span><small>{{ saveMessage || 'LOCAL CANVAS / READY' }}</small></div>
    </header>

    <div class="studio-shell">
      <aside class="studio-tools" aria-label="Studio tools">
        <div class="tool-group"><span>MODE</span><button :class="{ active: tool === 'brush' }" type="button" @click="tool = 'brush'">✦ Brush</button><button :class="{ active: tool === 'eraser' }" type="button" @click="tool = 'eraser'">◌ Erase</button></div>
        <div class="tool-group"><span>INK</span><div class="swatches"><button v-for="swatch in swatches" :key="swatch" :class="{ active: brushColor === swatch }" :style="{ '--swatch': swatch }" type="button" :aria-label="`Use ${swatch} ink`" @click="selectColor(swatch)"></button></div><input v-model="brushColor" type="color" aria-label="Choose custom ink color" /></div>
        <label class="size-control"><span>FLOW / {{ brushSize }}</span><input v-model.number="brushSize" type="range" min="2" max="36" /></label>
        <div class="tool-actions"><button type="button" :disabled="history.length === 0" @click="undo">Undo</button><button type="button" @click="clearCanvas">Clear</button></div>
      </aside>

      <div class="canvas-stage">
        <div class="canvas-signal" aria-hidden="true"><i></i><i></i><i></i></div>
        <canvas ref="canvas" aria-label="TOP drawing canvas" @pointerdown="beginStroke" @pointermove="drawStroke" @pointerup="finishStroke" @pointercancel="finishStroke" @pointerleave="finishStroke"></canvas>
        <p v-if="!hasMarks" class="canvas-empty">Begin anywhere.<br /><span>The field remembers the trace.</span></p>
        <span class="canvas-corner top-left">TOP / STUDIO</span><span class="canvas-corner bottom-right">{{ tool === 'brush' ? 'DRAWING' : 'ERASING' }}</span>
      </div>
    </div>

    <footer class="studio-footer"><p>Your canvas preview stays on this device; linking it records the work in your chosen project’s permanent evidence trail.</p><div><button type="button" @click="saveCanvas">Keep in my field</button><button class="export" type="button" @click="exportCanvas">Export PNG ↗</button></div></footer>
    <ProjectEvidenceCapture kind="canvas" default-title="Studio canvas" default-note="A visual sketch made in TOP Studio." :disabled="!hasMarks" description="Link this exact canvas to a project. Its project evidence stays permanent; the visual snapshot is kept privately on this device." @recorded="storeProjectCanvas" />
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

import type { ProjectArtifact } from "../../lib/api";
import { saveLocalArtifactPreview } from "../../lib/artifactVault";
import ProjectEvidenceCapture from "./ProjectEvidenceCapture.vue";

const canvas = ref<HTMLCanvasElement>();
const brushColor = ref("#62e6ff");
const brushSize = ref(9);
const tool = ref<"brush" | "eraser">("brush");
const hasMarks = ref(false);
const saveMessage = ref("");
const history = ref<string[]>([]);
const swatches = ["#62e6ff", "#9c7cff", "#ff72bd", "#d9ff71", "#ffffff", "#ff9b54"];

let context: CanvasRenderingContext2D | null = null;
let drawing = false;
let lastPoint = { x: 0, y: 0 };
let resizeObserver: ResizeObserver | undefined;

function selectColor(color: string): void { brushColor.value = color; tool.value = "brush"; }

function prepareCanvas(): void {
  if (!canvas.value) return;
  const previous = hasMarks.value ? canvas.value.toDataURL("image/png") : "";
  const bounds = canvas.value.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.value.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.value.height = Math.max(1, Math.round(bounds.height * ratio));
  context = canvas.value.getContext("2d");
  context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (previous) restoreImage(previous);
}

function pointFrom(event: PointerEvent): { x: number; y: number } {
  const bounds = canvas.value!.getBoundingClientRect();
  return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
}

function snapshot(): void {
  if (!canvas.value || !hasMarks.value) return;
  history.value = [...history.value.slice(-11), canvas.value.toDataURL("image/png")];
}

function beginStroke(event: PointerEvent): void {
  if (!canvas.value || !context) return;
  event.preventDefault();
  snapshot();
  drawing = true;
  lastPoint = pointFrom(event);
  canvas.value.setPointerCapture?.(event.pointerId);
  drawLine(lastPoint, { x: lastPoint.x + .1, y: lastPoint.y + .1 });
  hasMarks.value = true;
}

function drawStroke(event: PointerEvent): void {
  if (!drawing || !context) return;
  event.preventDefault();
  const nextPoint = pointFrom(event);
  drawLine(lastPoint, nextPoint);
  lastPoint = nextPoint;
}

function finishStroke(): void { drawing = false; }

function drawLine(from: { x: number; y: number }, to: { x: number; y: number }): void {
  if (!context) return;
  context.save();
  context.globalCompositeOperation = tool.value === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = brushColor.value;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = brushSize.value;
  context.shadowBlur = tool.value === "brush" ? brushSize.value * 1.25 : 0;
  context.shadowColor = brushColor.value;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

function restoreImage(data: string): void {
  if (!context || !canvas.value || !data) return;
  const image = new Image();
  image.onload = () => {
    if (!context || !canvas.value) return;
    const bounds = canvas.value.getBoundingClientRect();
    context.drawImage(image, 0, 0, bounds.width, bounds.height);
    hasMarks.value = true;
  };
  image.src = data;
}

function undo(): void {
  if (!canvas.value || !context || history.value.length === 0) return;
  const previous = history.value[history.value.length - 1]!;
  history.value = history.value.slice(0, -1);
  const bounds = canvas.value.getBoundingClientRect();
  context.clearRect(0, 0, bounds.width, bounds.height);
  hasMarks.value = false;
  restoreImage(previous);
}

function clearCanvas(): void {
  if (!canvas.value || !context) return;
  snapshot();
  const bounds = canvas.value.getBoundingClientRect();
  context.clearRect(0, 0, bounds.width, bounds.height);
  hasMarks.value = false;
  try {
    localStorage.removeItem("top-studio-canvas");
    saveMessage.value = "CANVAS CLEARED";
  } catch { saveMessage.value = "CANVAS CLEARED FROM THIS VIEW"; }
}

function saveCanvas(): void {
  if (!canvas.value || !hasMarks.value) { saveMessage.value = "MAKE A MARK FIRST"; return; }
  try {
    localStorage.setItem("top-studio-canvas", canvas.value.toDataURL("image/png"));
    saveMessage.value = "CANVAS HELD LOCALLY";
  } catch { saveMessage.value = "LOCAL STORAGE IS FULL"; }
}

function exportCanvas(): void {
  if (!canvas.value || !hasMarks.value) { saveMessage.value = "MAKE A MARK FIRST"; return; }
  const link = document.createElement("a");
  link.href = canvas.value.toDataURL("image/png");
  link.download = "top-studio.png";
  link.click();
  saveMessage.value = "PNG EXPORTED";
}

function createCanvasPreview(): string | null {
  if (!canvas.value) return null;
  const source = canvas.value;
  const longestSide = Math.max(source.width, source.height);
  const scale = Math.min(1, 1200 / Math.max(longestSide, 1));
  const preview = document.createElement("canvas");
  preview.width = Math.max(1, Math.round(source.width * scale));
  preview.height = Math.max(1, Math.round(source.height * scale));
  const previewContext = preview.getContext("2d");
  if (!previewContext) return null;
  previewContext.fillStyle = "#060711";
  previewContext.fillRect(0, 0, preview.width, preview.height);
  previewContext.drawImage(source, 0, 0, preview.width, preview.height);
  return preview.toDataURL("image/jpeg", .84);
}

function storeProjectCanvas(artifact: ProjectArtifact): void {
  const preview = createCanvasPreview();
  if (preview && saveLocalArtifactPreview(artifact.id, preview)) {
    saveMessage.value = "CANVAS LINKED TO PROJECT";
    return;
  }
  saveMessage.value = "EVIDENCE LINKED / PREVIEW STAYS IN STUDIO";
}

onMounted(() => {
  prepareCanvas();
  const saved = localStorage.getItem("top-studio-canvas");
  if (saved) restoreImage(saved);
  if (canvas.value) { resizeObserver = new ResizeObserver(prepareCanvas); resizeObserver.observe(canvas.value); }
});

onUnmounted(() => resizeObserver?.disconnect());
</script>

<style scoped>
.studio { background:linear-gradient(145deg,rgba(15,21,56,.84),rgba(5,7,21,.9)); border:1px solid rgba(128,157,255,.3); border-radius:30px 30px 8px 30px; box-shadow:inset 0 1px rgba(229,241,255,.08),0 35px 100px rgba(0,0,0,.25); grid-column:span 3; overflow:hidden; padding:clamp(24px,4vw,48px); position:relative; }.studio::before { background:radial-gradient(circle,rgba(255,114,189,.17),transparent 68%); content:""; height:440px; position:absolute; right:-210px; top:-220px; width:440px; }.studio-header { align-items:flex-start; display:flex; gap:24px; justify-content:space-between; position:relative; }.eyebrow { color:var(--top-pink); font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.18em; }.studio h2 { font-family:var(--top-display); font-size:clamp(33px,4.2vw,59px); font-weight:750; letter-spacing:-.08em; line-height:.9; margin:13px 0; }.studio-header p { color:var(--top-muted); line-height:1.65; max-width:620px; }.studio-status { align-items:center; color:rgba(205,217,255,.58); display:flex; flex:0 0 auto; font-family:var(--top-mono); font-size:8px; gap:7px; letter-spacing:.1em; padding-top:4px; }.studio-status span { animation:signal 2.5s ease-in-out infinite; background:var(--top-lime); border-radius:50%; box-shadow:0 0 12px var(--top-lime); height:6px; width:6px; }.studio-shell { display:grid; gap:13px; grid-template-columns:174px minmax(0,1fr); margin-top:31px; position:relative; }.studio-tools { background:rgba(5,8,25,.7); border:1px solid rgba(127,157,255,.22); border-radius:18px 18px 5px 18px; display:flex; flex-direction:column; gap:24px; padding:17px; }.tool-group > span,.size-control > span { color:rgba(191,207,250,.5); display:block; font-family:var(--top-mono); font-size:8px; letter-spacing:.15em; margin-bottom:9px; }.tool-group > button { background:transparent; border:1px solid rgba(129,156,255,.2); border-radius:10px 10px 3px 10px; color:rgba(222,231,255,.7); cursor:pointer; display:block; font-family:var(--top-mono); font-size:9px; margin-top:6px; padding:9px; text-align:left; transition:.2s ease; width:100%; }.tool-group > button:hover,.tool-group > button.active { background:rgba(99,89,255,.2); border-color:var(--top-pink); color:var(--top-ink); }.swatches { display:flex; flex-wrap:wrap; gap:7px; }.swatches button { background:var(--swatch); border:2px solid transparent; border-radius:50%; box-shadow:0 0 11px var(--swatch); cursor:pointer; height:20px; padding:0; width:20px; }.swatches button.active { border-color:#fff; transform:scale(1.16); }.tool-group input[type="color"] { background:transparent; border:0; cursor:pointer; height:28px; margin-top:10px; padding:0; width:100%; }.size-control input { accent-color:var(--top-pink); cursor:pointer; width:100%; }.tool-actions { display:grid; gap:7px; grid-template-columns:1fr 1fr; margin-top:auto; }.tool-actions button { background:rgba(127,152,255,.09); border:1px solid rgba(127,152,255,.22); border-radius:9px; color:rgba(220,230,255,.8); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:9px 4px; }.tool-actions button:disabled { cursor:not-allowed; opacity:.35; }.canvas-stage { background:radial-gradient(circle at 50% 48%,rgba(90,75,230,.16),transparent 35%),rgba(3,5,15,.76); border:1px solid rgba(132,160,255,.25); border-radius:22px 22px 5px 22px; min-height:520px; overflow:hidden; position:relative; }.canvas-stage::before { background-image:linear-gradient(rgba(135,158,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(135,158,255,.09) 1px,transparent 1px); background-size:42px 42px; content:""; inset:0; mask-image:radial-gradient(circle at center,black,transparent 78%); opacity:.3; pointer-events:none; position:absolute; }.canvas-signal { border:1px solid rgba(156,124,255,.18); border-radius:50%; height:260px; left:50%; pointer-events:none; position:absolute; top:50%; transform:translate(-50%,-50%); width:260px; }.canvas-signal i { background:var(--top-pink); border-radius:50%; box-shadow:0 0 16px var(--top-pink); height:5px; position:absolute; width:5px; }.canvas-signal i:nth-child(1) { left:23px; top:70px; }.canvas-signal i:nth-child(2) { bottom:41px; right:48px; }.canvas-signal i:nth-child(3) { background:var(--top-cyan); left:119px; top:-3px; }.canvas-stage canvas { cursor:crosshair; height:100%; inset:0; position:absolute; touch-action:none; width:100%; z-index:2; }.canvas-empty { color:rgba(211,221,255,.62); font-family:var(--top-display); font-size:clamp(24px,3vw,40px); font-weight:700; left:50%; letter-spacing:-.06em; line-height:.96; pointer-events:none; position:absolute; text-align:center; top:50%; transform:translate(-50%,-50%); z-index:1; }.canvas-empty span { color:var(--top-pink); font-family:var(--top-mono); font-size:9px; font-weight:500; letter-spacing:.12em; }.canvas-corner { color:rgba(189,205,248,.42); font-family:var(--top-mono); font-size:8px; letter-spacing:.13em; pointer-events:none; position:absolute; z-index:3; }.top-left { left:18px; top:16px; }.bottom-right { bottom:16px; right:18px; }.studio-footer { align-items:center; border-top:1px solid rgba(127,157,255,.17); display:flex; gap:20px; justify-content:space-between; margin-top:17px; padding-top:17px; position:relative; }.studio-footer p { color:rgba(191,207,250,.48); font-size:11px; max-width:510px; }.studio-footer div { display:flex; gap:9px; }.studio-footer button { background:rgba(127,154,255,.11); border:1px solid rgba(128,157,255,.28); border-radius:999px; color:var(--top-ink); cursor:pointer; font-family:var(--top-mono); font-size:9px; padding:11px 13px; transition:.2s ease; }.studio-footer button:hover { border-color:var(--top-cyan); transform:translateY(-2px); }.studio-footer .export { background:linear-gradient(110deg,var(--top-cyan),var(--top-violet)); color:#06101c; } @keyframes signal { 50% { box-shadow:0 0 0 5px rgba(217,255,113,0),0 0 12px var(--top-lime); } }
@media (max-width:800px) { .studio { grid-column:span 1; padding:24px; }.studio-header,.studio-footer { align-items:flex-start; flex-direction:column; }.studio-status { padding:0; }.studio-shell { grid-template-columns:1fr; }.studio-tools { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }.tool-actions { margin-top:0; }.canvas-stage { min-height:420px; }.studio-footer div { width:100%; }.studio-footer button { flex:1; } }
@media (max-width:520px) { .studio-tools { grid-template-columns:1fr; }.canvas-stage { min-height:340px; }.studio-footer div { flex-direction:column; }.studio-footer button { width:100%; } }
</style>
