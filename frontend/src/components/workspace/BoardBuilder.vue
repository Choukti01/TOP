<template>
  <section class="board-tool" :style="{ '--accent': config.color }">
    <header><div><span>{{ config.kicker }}</span><h3>{{ config.title }}</h3><p>{{ config.description }}</p></div><b>{{ nodes.length }}<small>{{ nodes.length === 1 ? ' PIECE' : ' PIECES' }}</small></b></header>
    <div class="board-shell">
      <aside>
        <label>NAME THIS SPACE<input v-model.trim="boardName" maxlength="60" :placeholder="config.namePlaceholder" @change="persist('NAME HELD')" /></label>
        <label>{{ config.inputLabel }}<input v-model.trim="draftLabel" maxlength="80" :placeholder="config.inputPlaceholder" @keydown.enter.prevent="addNode" /></label>
        <label>TYPE<select v-model="draftType"><option v-for="type in config.types" :key="type" :value="type">{{ type }}</option></select></label>
        <button class="add" type="button" @click="addNode"><i>+</i> Add to space</button>
        <button class="remove" :disabled="!selectedNode" type="button" @click="removeSelected">Remove selected</button>
      </aside>
      <div ref="board" class="board" @pointermove="drag" @pointerup="finishDrag" @pointercancel="finishDrag">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="board-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="6" refY="3"><path d="M0,0 L0,6 L6,3 z"></path></marker></defs><line v-for="pair in connections" :key="pair.to.id" :x1="pair.from.x" :y1="pair.from.y" :x2="pair.to.x" :y2="pair.to.y" marker-end="url(#board-arrow)" /></svg>
        <button v-for="node in nodes" :key="node.id" :class="{ selected: node.id === selectedId }" :style="{ left: `${node.x}%`, top: `${node.y}%` }" type="button" @pointerdown.stop="beginDrag(node, $event)" @click="selectedId = node.id"><i>{{ glyph(node.type) }}</i><span><small>{{ node.type }}</small><strong>{{ node.label }}</strong></span></button>
        <div v-if="nodes.length === 0" class="empty"><i>{{ config.emptyGlyph }}</i><strong>{{ config.emptyTitle }}</strong><p>{{ config.emptyCopy }}</p></div>
        <em>DRAG TO REARRANGE</em>
      </div>
    </div>
    <footer><span>{{ saveMessage || config.footer }}</span><button type="button" @click="persist('SPACE HELD LOCALLY')">Keep this space ↗</button></footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

type BoardMode = "forge" | "quest" | "prototype" | "circle";
type BoardNode = { id: string; label: string; type: string; x: number; y: number };

const props = defineProps<{ mode: BoardMode }>();

const configurations: Record<BoardMode, { kicker: string; title: string; description: string; namePlaceholder: string; inputLabel: string; inputPlaceholder: string; types: string[]; emptyGlyph: string; emptyTitle: string; emptyCopy: string; footer: string; color: string }> = {
  forge: { kicker: "IDEA FORGE", title: "Let ideas collide.", description: "Capture fragments, move them together, and discover the project hiding between them.", namePlaceholder: "A question worth shaping", inputLabel: "PLANT A SEED", inputPlaceholder: "An idea, image, problem, or possibility", types: ["Seed", "Spark", "Tension", "Possibility"], emptyGlyph: "✧", emptyTitle: "No seed is pretending to exist.", emptyCopy: "Plant a fragment you genuinely want to explore.", footer: "The forge is a place for unfinished thoughts.", color: "#ff72bd" },
  quest: { kicker: "LEARNING QUEST", title: "Learn by crossing terrain.", description: "Make a skill path that includes study, practice, proof, and the moment you share what you know.", namePlaceholder: "A skill I want to earn", inputLabel: "ADD A QUEST", inputPlaceholder: "A concept, exercise, or proof of skill", types: ["Study", "Practice", "Challenge", "Proof"], emptyGlyph: "△", emptyTitle: "Your quest has open terrain.", emptyCopy: "Add the first thing you need to understand or practice.", footer: "A quest becomes real when it produces proof.", color: "#62e6ff" },
  prototype: { kicker: "PROTOTYPE TABLE", title: "Make the first imperfect version.", description: "Arrange screens, flows, moments, and questions until the shape of a real product begins to appear.", namePlaceholder: "A thing I want to prototype", inputLabel: "ADD A PIECE", inputPlaceholder: "A screen, interaction, or user moment", types: ["Screen", "Flow", "Interaction", "Question"], emptyGlyph: "▣", emptyTitle: "Nothing has been faked here.", emptyCopy: "Add the first piece of the thing you want to test.", footer: "Prototypes become clearer when you can move the pieces.", color: "#d9ff71" },
  circle: { kicker: "CIRCLE BUILDER", title: "Shape a place for people.", description: "Draft a circle’s purpose, roles, agreements, and first shared action before inviting anyone in.", namePlaceholder: "A circle worth gathering", inputLabel: "ADD A FOUNDATION", inputPlaceholder: "A role, agreement, or shared action", types: ["Purpose", "Role", "Agreement", "Action"], emptyGlyph: "◎", emptyTitle: "No circle without a reason.", emptyCopy: "Start with the purpose that could genuinely bring people together.", footer: "This is a private circle draft; live collaboration comes with accounts.", color: "#9c7cff" }
};

const config = computed(() => configurations[props.mode]);
const storageKey = computed(() => `top-board-${props.mode}-v1`);
const board = ref<HTMLElement>();
const boardName = ref("");
const draftLabel = ref("");
const draftType = ref("");
const nodes = ref<BoardNode[]>([]);
const selectedId = ref<string | null>(null);
const saveMessage = ref("");
let draggingId: string | null = null;

const selectedNode = computed(() => nodes.value.find((node) => node.id === selectedId.value) ?? null);
const connections = computed(() => nodes.value.slice(1).map((to, index) => ({ from: nodes.value[index]!, to })));

function load(): void {
  boardName.value = "";
  draftLabel.value = "";
  draftType.value = config.value.types[0]!;
  selectedId.value = null;
  try {
    const saved = localStorage.getItem(storageKey.value);
    if (!saved) { nodes.value = []; return; }
    const parsed = JSON.parse(saved) as { name?: string; nodes?: unknown };
    boardName.value = typeof parsed.name === "string" ? parsed.name : "";
    nodes.value = Array.isArray(parsed.nodes) ? parsed.nodes.filter(isBoardNode) : [];
  } catch { nodes.value = []; }
}

function isBoardNode(value: unknown): value is BoardNode {
  if (!value || typeof value !== "object") return false;
  const node = value as Partial<BoardNode>;
  return typeof node.id === "string" && typeof node.label === "string" && typeof node.type === "string" && typeof node.x === "number" && typeof node.y === "number";
}

function addNode(): void {
  const label = draftLabel.value.trim();
  if (!label) { saveMessage.value = "NAME THE PIECE FIRST"; return; }
  const index = nodes.value.length;
  const node: BoardNode = { id: crypto.randomUUID(), label, type: draftType.value, x: 18 + (index % 3) * 31, y: 23 + Math.floor(index / 3) * 25 };
  nodes.value = [...nodes.value, node];
  selectedId.value = node.id;
  draftLabel.value = "";
  persist("PIECE ADDED");
}

function beginDrag(node: BoardNode, event: PointerEvent): void { draggingId = node.id; selectedId.value = node.id; board.value?.setPointerCapture?.(event.pointerId); }
function drag(event: PointerEvent): void { if (!draggingId || !board.value) return; const bounds = board.value.getBoundingClientRect(); const x = Math.min(90, Math.max(8, ((event.clientX - bounds.left) / bounds.width) * 100)); const y = Math.min(88, Math.max(10, ((event.clientY - bounds.top) / bounds.height) * 100)); nodes.value = nodes.value.map((node) => node.id === draggingId ? { ...node, x, y } : node); }
function finishDrag(): void { if (!draggingId) return; draggingId = null; persist("SPACE SHIFTED"); }
function removeSelected(): void { if (!selectedId.value) return; nodes.value = nodes.value.filter((node) => node.id !== selectedId.value); selectedId.value = null; persist("PIECE REMOVED"); }
function persist(message: string): void { try { localStorage.setItem(storageKey.value, JSON.stringify({ name: boardName.value, nodes: nodes.value })); saveMessage.value = message; } catch { saveMessage.value = "LOCAL STORAGE IS FULL"; } }
function glyph(type: string): string { return { Seed: "✧", Spark: "✦", Tension: "⌁", Possibility: "↗", Study: "◌", Practice: "△", Challenge: "⚑", Proof: "✓", Screen: "▣", Flow: "→", Interaction: "✦", Question: "?", Purpose: "◎", Role: "◒", Agreement: "≋", Action: "↗" }[type] ?? "•"; }

watch(() => props.mode, load, { immediate: true });
</script>

<style scoped>
.board-tool { background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 13%,#111a41),rgba(5,8,22,.93)); border:1px solid color-mix(in srgb,var(--accent) 42%,transparent); border-radius:26px 26px 7px 26px; box-shadow:inset 0 1px rgba(238,246,255,.08),0 25px 75px rgba(0,0,0,.25); color:var(--top-ink); grid-column:span 3; overflow:hidden; padding:28px; position:relative; }.board-tool header { align-items:flex-start; display:flex; justify-content:space-between; }.board-tool header > div > span,.board-tool label { color:var(--accent); display:block; font-family:var(--top-mono); font-size:8px; letter-spacing:.15em; }.board-tool h3 { font-family:var(--top-display); font-size:clamp(28px,3vw,43px); font-weight:750; letter-spacing:-.075em; margin:10px 0; }.board-tool header p { color:var(--top-muted); line-height:1.6; max-width:600px; }.board-tool header > b { align-items:center; border:1px solid color-mix(in srgb,var(--accent) 55%,transparent); border-radius:50%; color:var(--accent); display:flex; flex:0 0 auto; flex-direction:column; font-family:var(--top-display); font-size:23px; height:61px; justify-content:center; width:61px; }.board-tool header > b small { font-family:var(--top-mono); font-size:6px; letter-spacing:.12em; margin-top:3px; }.board-shell { display:grid; gap:13px; grid-template-columns:196px minmax(0,1fr); margin-top:24px; }.board-shell aside { background:rgba(3,6,18,.72); border:1px solid color-mix(in srgb,var(--accent) 27%,transparent); border-radius:15px 15px 4px 15px; display:flex; flex-direction:column; gap:14px; padding:15px; }.board-shell input,.board-shell select { background:rgba(2,4,14,.65); border:1px solid color-mix(in srgb,var(--accent) 31%,transparent); border-radius:9px 9px 3px 9px; color:var(--top-ink); display:block; font:inherit; font-size:11px; margin-top:7px; outline:0; padding:10px; width:100%; }.board-shell input:focus,.board-shell select:focus { border-color:var(--accent); box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 12%,transparent); }.add { background:linear-gradient(110deg,var(--accent),var(--top-cyan)); border:0; border-radius:10px 10px 3px 10px; color:#06101c; cursor:pointer; font-family:var(--top-display); font-size:13px; font-weight:800; padding:12px; }.add i { font-size:17px; font-style:normal; margin-right:5px; }.remove { background:transparent; border:1px solid color-mix(in srgb,var(--accent) 25%,transparent); border-radius:8px; color:rgba(229,238,255,.68); cursor:pointer; font-family:var(--top-mono); font-size:8px; margin-top:auto; padding:9px; }.remove:disabled { cursor:not-allowed; opacity:.32; }.board { background:radial-gradient(circle at 53% 48%,color-mix(in srgb,var(--accent) 13%,transparent),transparent 35%),rgba(3,6,17,.76); border:1px solid color-mix(in srgb,var(--accent) 28%,transparent); border-radius:18px 18px 4px 18px; min-height:420px; overflow:hidden; position:relative; touch-action:none; }.board::before { background-image:linear-gradient(color-mix(in srgb,var(--accent) 10%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--accent) 10%,transparent) 1px,transparent 1px); background-size:38px 38px; content:""; inset:0; mask-image:radial-gradient(circle at center,black,transparent 82%); opacity:.45; pointer-events:none; position:absolute; }.board svg { inset:0; overflow:visible; pointer-events:none; position:absolute; }.board line { stroke:color-mix(in srgb,var(--accent) 64%,transparent); stroke-dasharray:1.5 1.2; stroke-width:.35; }.board marker path { fill:var(--accent); }.board > button { align-items:flex-start; background:linear-gradient(145deg,color-mix(in srgb,var(--accent) 16%,#14243b),rgba(4,10,25,.96)); border:1px solid color-mix(in srgb,var(--accent) 58%,transparent); border-radius:12px 12px 3px 12px; box-shadow:0 12px 28px rgba(0,0,0,.34); color:var(--top-ink); cursor:grab; display:flex; gap:8px; max-width:157px; min-width:115px; padding:10px; position:absolute; text-align:left; transform:translate(-50%,-50%); transition:.2s ease; z-index:2; }.board > button:active { cursor:grabbing; }.board > button:hover,.board > button.selected { border-color:var(--accent); box-shadow:0 0 26px color-mix(in srgb,var(--accent) 25%,transparent),0 15px 32px rgba(0,0,0,.36); scale:1.04; }.board > button > i { color:var(--accent); font-size:14px; font-style:normal; }.board > button small,.board > button strong { display:block; }.board > button small { color:var(--accent); font-family:var(--top-mono); font-size:6px; letter-spacing:.11em; text-transform:uppercase; }.board > button strong { font-family:var(--top-body); font-size:9px; line-height:1.35; margin-top:3px; }.empty { left:50%; max-width:280px; position:absolute; text-align:center; top:50%; transform:translate(-50%,-50%); }.empty > i { color:var(--accent); display:block; font-family:var(--top-display); font-size:41px; font-style:normal; }.empty strong { display:block; font-family:var(--top-display); font-size:22px; letter-spacing:-.06em; margin-top:9px; }.empty p { color:var(--top-muted); font-size:11px; line-height:1.55; margin-top:8px; }.board > em { bottom:14px; color:rgba(205,218,250,.35); font-family:var(--top-mono); font-size:7px; font-style:normal; letter-spacing:.14em; position:absolute; right:15px; }.board-tool footer { align-items:center; border-top:1px solid color-mix(in srgb,var(--accent) 18%,transparent); color:rgba(210,222,250,.54); display:flex; font-size:11px; justify-content:space-between; margin-top:15px; padding-top:15px; }.board-tool footer button { background:transparent; border:0; color:var(--accent); cursor:pointer; font-family:var(--top-mono); font-size:9px; }.board-tool footer button:hover { transform:translateX(3px); }
@media (max-width:800px) { .board-tool { grid-column:span 1; padding:23px; }.board-shell { grid-template-columns:1fr; }.board-shell aside { display:grid; grid-template-columns:1fr 1fr; }.add,.remove { margin-top:0; }.board { min-height:380px; } }.board-tool footer { align-items:flex-start; flex-direction:column; gap:9px; }
@media (max-width:520px) { .board-shell aside { display:flex; }.board-tool header > b { display:none; }.board > button { max-width:130px; min-width:98px; }.board { min-height:340px; } }
</style>
