<template>
  <section class="blueprint">
    <header class="blueprint-header">
      <div><span class="eyebrow">SPATIAL ROADMAP</span><h2>Make the path<br />visible.</h2><p>Build a map for a project, a learning journey, or a question. Every node is yours to move, reshape, and connect.</p></div>
      <div class="map-count"><span>{{ nodes.length }}</span><small>{{ nodes.length === 1 ? 'NODE' : 'NODES' }}</small></div>
    </header>

    <div class="blueprint-shell">
      <aside class="blueprint-maker">
        <label>MAP NAME<input v-model.trim="mapName" maxlength="60" placeholder="A project worth mapping" @change="persist('MAP NAME HELD')" /></label>
        <label>ADD A STEP<input v-model.trim="draftLabel" maxlength="80" placeholder="What needs to happen next?" @keydown.enter.prevent="addNode" /></label>
        <label>STEP MODE<select v-model="draftKind"><option value="learn">Learn</option><option value="make">Make</option><option value="test">Test</option><option value="share">Share</option></select></label>
        <button class="add-step" type="button" @click="addNode"><span>+</span> Add to map</button>
        <div class="map-legend"><span><i class="learn"></i> Learn</span><span><i class="make"></i> Make</span><span><i class="test"></i> Test</span><span><i class="share"></i> Share</span></div>
        <div class="maker-actions"><button type="button" :disabled="!selectedNode" @click="removeSelected">Remove step</button><button type="button" :disabled="nodes.length === 0" @click="clearMap">Clear map</button></div>
      </aside>

      <div ref="board" class="map-board" @pointermove="dragNode" @pointerup="finishDrag" @pointercancel="finishDrag">
        <svg class="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><marker id="blueprint-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="6" refY="3"><path d="M0,0 L0,6 L6,3 z"></path></marker></defs>
          <line v-for="pair in connectionPairs" :key="pair.to.id" :x1="pair.from.x" :y1="pair.from.y" :x2="pair.to.x" :y2="pair.to.y" marker-end="url(#blueprint-arrow)"></line>
        </svg>
        <div class="map-horizon" aria-hidden="true"></div>
        <button v-for="node in nodes" :key="node.id" :class="['map-node', `node-${node.kind}`, { selected: node.id === selectedId }]" :style="{ left: `${node.x}%`, top: `${node.y}%` }" type="button" @pointerdown.stop="beginDrag(node, $event)" @click="selectedId = node.id">
          <span class="node-pin">{{ nodeGlyph(node.kind) }}</span><span><small>{{ node.kind }}</small><strong>{{ node.label }}</strong></span><i aria-hidden="true">⋮</i>
        </button>
        <div v-if="nodes.length === 0" class="map-empty"><span>⌘</span><strong>There is no borrowed path.</strong><p>Add the first thing you need to learn, make, test, or share.</p></div>
        <span class="map-axis axis-x">MAKE →</span><span class="map-axis axis-y">DEPTH ↑</span>
      </div>
    </div>

    <footer class="blueprint-footer"><p>{{ saveMessage || 'Drag any node to give the path a truer shape.' }}</p><button type="button" @click="persist('BLUEPRINT HELD LOCALLY')">Keep this blueprint <span>↗</span></button></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type NodeKind = "learn" | "make" | "test" | "share";
type BlueprintNode = { id: string; label: string; kind: NodeKind; x: number; y: number };

const storageKey = "top-blueprint-v1";
const board = ref<HTMLElement>();
const mapName = ref("");
const draftLabel = ref("");
const draftKind = ref<NodeKind>("learn");
const nodes = ref<BlueprintNode[]>(readBlueprint());
const selectedId = ref<string | null>(null);
const saveMessage = ref("");
let draggingId: string | null = null;

const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedId.value) ?? null);
const connectionPairs = computed(() => nodes.value.slice(1).map((node, index) => ({ from: nodes.value[index]!, to: node })));

function readBlueprint(): BlueprintNode[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as { name?: string; nodes?: unknown };
    if (typeof parsed.name === "string") mapName.value = parsed.name;
    if (!Array.isArray(parsed.nodes)) return [];
    return parsed.nodes.filter(isBlueprintNode);
  } catch { return []; }
}

function isBlueprintNode(value: unknown): value is BlueprintNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<BlueprintNode>;
  return typeof node.id === "string" && typeof node.label === "string" && ["learn", "make", "test", "share"].includes(node.kind ?? "") && typeof node.x === "number" && typeof node.y === "number";
}

function addNode(): void {
  const label = draftLabel.value.trim();
  if (!label) { saveMessage.value = "NAME THE STEP FIRST"; return; }
  const index = nodes.value.length;
  const node: BlueprintNode = { id: crypto.randomUUID(), label, kind: draftKind.value, x: 17 + (index % 3) * 31, y: 22 + Math.floor(index / 3) * 25 };
  nodes.value = [...nodes.value, node];
  selectedId.value = node.id;
  draftLabel.value = "";
  persist("STEP ADDED TO THE PATH");
}

function beginDrag(node: BlueprintNode, event: PointerEvent): void {
  draggingId = node.id;
  selectedId.value = node.id;
  board.value?.setPointerCapture?.(event.pointerId);
}

function dragNode(event: PointerEvent): void {
  if (!draggingId || !board.value) return;
  const bounds = board.value.getBoundingClientRect();
  const x = Math.min(90, Math.max(8, ((event.clientX - bounds.left) / bounds.width) * 100));
  const y = Math.min(88, Math.max(10, ((event.clientY - bounds.top) / bounds.height) * 100));
  nodes.value = nodes.value.map((node) => node.id === draggingId ? { ...node, x, y } : node);
}

function finishDrag(): void { if (!draggingId) return; draggingId = null; persist("PATH SHIFTED"); }
function removeSelected(): void { if (!selectedId.value) return; nodes.value = nodes.value.filter((node) => node.id !== selectedId.value); selectedId.value = null; persist("STEP REMOVED"); }
function clearMap(): void { nodes.value = []; selectedId.value = null; persist("MAP CLEARED"); }
function persist(message: string): void { try { localStorage.setItem(storageKey, JSON.stringify({ name: mapName.value, nodes: nodes.value })); saveMessage.value = message; } catch { saveMessage.value = "LOCAL STORAGE IS FULL"; } }
function nodeGlyph(kind: NodeKind): string { return { learn: "◌", make: "✦", test: "△", share: "↗" }[kind]; }
</script>

<style scoped>
.blueprint { background:linear-gradient(145deg,rgba(16,31,57,.84),rgba(5,10,20,.92)); border:1px solid rgba(151,194,116,.28); border-radius:30px 30px 8px 30px; box-shadow:inset 0 1px rgba(230,255,214,.07),0 35px 100px rgba(0,0,0,.25); grid-column:span 3; overflow:hidden; padding:clamp(24px,4vw,48px); position:relative; }.blueprint::after { background:radial-gradient(circle,rgba(217,255,113,.12),transparent 68%); content:""; height:470px; left:-220px; position:absolute; top:-230px; width:470px; }.blueprint-header { align-items:flex-start; display:flex; justify-content:space-between; position:relative; }.eyebrow { color:var(--top-lime); font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.18em; }.blueprint h2 { font-family:var(--top-display); font-size:clamp(33px,4.2vw,59px); font-weight:750; letter-spacing:-.08em; line-height:.9; margin:13px 0; }.blueprint-header p { color:var(--top-muted); line-height:1.65; max-width:620px; }.map-count { align-items:center; border:1px solid rgba(217,255,113,.33); border-radius:50%; color:var(--top-lime); display:flex; flex:0 0 auto; flex-direction:column; height:70px; justify-content:center; width:70px; }.map-count span { font-family:var(--top-display); font-size:26px; font-weight:700; line-height:.8; }.map-count small { font-family:var(--top-mono); font-size:7px; letter-spacing:.12em; margin-top:5px; }.blueprint-shell { display:grid; gap:13px; grid-template-columns:220px minmax(0,1fr); margin-top:31px; position:relative; }.blueprint-maker { background:rgba(4,10,18,.75); border:1px solid rgba(164,200,125,.21); border-radius:18px 18px 5px 18px; display:flex; flex-direction:column; gap:17px; padding:17px; }.blueprint-maker label { color:rgba(217,236,208,.83); display:block; font-family:var(--top-mono); font-size:8px; letter-spacing:.13em; }.blueprint-maker input,.blueprint-maker select { background:rgba(3,8,15,.68); border:1px solid rgba(159,197,125,.27); border-radius:10px 10px 3px 10px; color:var(--top-ink); display:block; font:inherit; font-size:12px; margin-top:8px; outline:0; padding:11px; width:100%; }.blueprint-maker input:focus,.blueprint-maker select:focus { border-color:var(--top-lime); box-shadow:0 0 0 3px rgba(217,255,113,.1); }.add-step { align-items:center; background:linear-gradient(110deg,var(--top-lime),var(--top-cyan)); border:0; border-radius:12px 12px 4px 12px; color:#07100d; cursor:pointer; display:flex; font-family:var(--top-display); font-size:14px; font-weight:800; gap:8px; justify-content:center; padding:13px; transition:.2s ease; }.add-step:hover { box-shadow:0 12px 32px rgba(217,255,113,.15); transform:translateY(-2px); }.add-step span { font-size:19px; font-weight:400; }.map-legend { border-top:1px solid rgba(161,194,124,.15); display:grid; gap:7px; grid-template-columns:1fr 1fr; padding-top:16px; }.map-legend span { align-items:center; color:rgba(210,228,206,.55); display:flex; font-family:var(--top-mono); font-size:8px; gap:6px; }.map-legend i { background:var(--node); border-radius:50%; box-shadow:0 0 8px var(--node); height:6px; width:6px; }.map-legend .learn { --node:var(--top-cyan); }.map-legend .make { --node:var(--top-pink); }.map-legend .test { --node:var(--top-lime); }.map-legend .share { --node:var(--top-violet); }.maker-actions { display:flex; gap:8px; margin-top:auto; }.maker-actions button { background:transparent; border:1px solid rgba(163,194,125,.2); border-radius:8px; color:rgba(215,233,208,.7); cursor:pointer; flex:1; font-family:var(--top-mono); font-size:8px; padding:9px 5px; }.maker-actions button:disabled { cursor:not-allowed; opacity:.32; }.map-board { background:radial-gradient(ellipse at 48% 50%,rgba(98,230,255,.1),transparent 35%),radial-gradient(circle at 83% 24%,rgba(217,255,113,.12),transparent 25%),rgba(3,8,16,.8); border:1px solid rgba(158,198,125,.25); border-radius:22px 22px 5px 22px; min-height:540px; overflow:hidden; perspective:900px; position:relative; touch-action:none; }.map-board::before { background-image:linear-gradient(rgba(156,195,124,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(156,195,124,.09) 1px,transparent 1px); background-size:48px 48px; content:""; inset:0; mask-image:linear-gradient(transparent,black 17%,black 83%,transparent); opacity:.35; pointer-events:none; position:absolute; transform:perspective(600px) rotateX(58deg) scale(1.5) translateY(20%); transform-origin:center bottom; }.connections { inset:0; overflow:visible; pointer-events:none; position:absolute; }.connections line { stroke:rgba(191,239,155,.48); stroke-dasharray:1.5 1.2; stroke-width:.35; }.connections marker path { fill:var(--top-lime); }.map-horizon { border-top:1px solid rgba(217,255,113,.26); left:0; position:absolute; right:0; top:50%; transform:perspective(500px) rotateX(56deg); }.map-node { --node-color:var(--top-cyan); align-items:flex-start; background:linear-gradient(145deg,rgba(20,42,63,.96),rgba(5,14,26,.94)); border:1px solid color-mix(in srgb,var(--node-color) 62%,transparent); border-radius:15px 15px 4px 15px; box-shadow:0 16px 34px rgba(0,0,0,.3),0 0 25px color-mix(in srgb,var(--node-color) 10%,transparent); color:var(--top-ink); cursor:grab; display:flex; gap:9px; max-width:174px; min-width:130px; padding:11px; position:absolute; text-align:left; transform:translate(-50%,-50%); transition:border-color .2s ease,box-shadow .2s ease,scale .2s ease; z-index:2; }.map-node:active { cursor:grabbing; }.map-node:hover,.map-node.selected { border-color:var(--node-color); box-shadow:0 18px 42px rgba(0,0,0,.4),0 0 32px color-mix(in srgb,var(--node-color) 25%,transparent); scale:1.04; }.node-learn { --node-color:var(--top-cyan); }.node-make { --node-color:var(--top-pink); }.node-test { --node-color:var(--top-lime); }.node-share { --node-color:var(--top-violet); }.node-pin { align-items:center; background:color-mix(in srgb,var(--node-color) 18%,transparent); border:1px solid color-mix(in srgb,var(--node-color) 50%,transparent); border-radius:8px 8px 2px 8px; color:var(--node-color); display:flex; flex:0 0 auto; font-size:13px; height:25px; justify-content:center; width:25px; }.map-node small,.map-node strong { display:block; }.map-node small { color:var(--node-color); font-family:var(--top-mono); font-size:7px; letter-spacing:.12em; text-transform:uppercase; }.map-node strong { font-family:var(--top-body); font-size:10px; line-height:1.3; margin-top:4px; }.map-node i { color:rgba(222,239,225,.44); font-style:normal; margin-left:auto; }.map-empty { left:50%; max-width:280px; position:absolute; text-align:center; top:50%; transform:translate(-50%,-50%); }.map-empty span { color:var(--top-lime); display:block; font-family:var(--top-display); font-size:42px; }.map-empty strong { color:var(--top-ink); display:block; font-family:var(--top-display); font-size:23px; letter-spacing:-.06em; margin-top:12px; }.map-empty p { color:var(--top-muted); font-size:12px; line-height:1.6; margin-top:9px; }.map-axis { color:rgba(206,235,191,.36); font-family:var(--top-mono); font-size:8px; letter-spacing:.16em; pointer-events:none; position:absolute; }.axis-x { bottom:17px; right:18px; }.axis-y { left:18px; top:17px; }.blueprint-footer { align-items:center; border-top:1px solid rgba(160,194,125,.16); display:flex; gap:20px; justify-content:space-between; margin-top:17px; padding-top:17px; position:relative; }.blueprint-footer p { color:rgba(206,228,198,.55); font-size:11px; }.blueprint-footer button { background:rgba(217,255,113,.1); border:1px solid rgba(217,255,113,.35); border-radius:999px; color:var(--top-lime); cursor:pointer; font-family:var(--top-mono); font-size:9px; padding:11px 13px; transition:.2s ease; }.blueprint-footer button:hover { transform:translateY(-2px); }.blueprint-footer span { font-size:14px; margin-left:5px; }
@media (max-width:800px) { .blueprint { grid-column:span 1; padding:24px; }.blueprint-header,.blueprint-footer { align-items:flex-start; flex-direction:column; }.blueprint-shell { grid-template-columns:1fr; }.blueprint-maker { display:grid; grid-template-columns:1fr 1fr; }.add-step,.map-legend,.maker-actions { grid-column:span 2; }.map-board { min-height:450px; } }
@media (max-width:520px) { .blueprint-maker { display:flex; }.map-board { min-height:380px; }.map-node { max-width:135px; min-width:108px; }.map-node strong { font-size:9px; }.blueprint-footer button { width:100%; } }
</style>
