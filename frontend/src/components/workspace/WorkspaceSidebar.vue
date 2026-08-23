<template>
  <aside class="atlas-layer">
    <button class="brand" type="button" aria-label="Return to TOP universe" @click="returnToUniverse">
      <img class="brand-logo" src="/top-logo-transparent.png" alt="TOP" />
    </button>

    <button
      class="atlas-trigger"
      type="button"
      :aria-expanded="isAtlasOpen"
      aria-controls="top-atlas"
      @click="isAtlasOpen = !isAtlasOpen"
    >
      <span class="trigger-symbol" aria-hidden="true"><i></i><i></i><i></i></span>
      <span><small>TOP ATLAS</small><strong>{{ activeTitle }}</strong></span>
      <b aria-hidden="true">{{ isAtlasOpen ? '×' : '↗' }}</b>
    </button>

    <button class="reflection-orbit" type="button" title="Weekly reflection" @click="navigate('Reflection')">
      <span aria-hidden="true"><i></i></span>
      <small>Reflect</small>
    </button>

    <Transition name="veil">
      <div v-if="isAtlasOpen" class="atlas-backdrop" @click.self="isAtlasOpen = false">
        <section id="top-atlas" class="atlas" role="dialog" aria-modal="true" aria-label="TOP atlas navigation">
          <header>
            <div>
              <span>THE TOP ATLAS</span>
              <h2>Choose a direction,<br />then make it real.</h2>
            </div>
            <button type="button" aria-label="Close TOP atlas" @click="isAtlasOpen = false">×</button>
          </header>

          <p class="atlas-intro">TOP is not a feed. It is a field for the projects, questions, people, and practices that move your real life forward.</p>

          <nav aria-label="Workspace sections">
            <button
              v-for="(item, index) in navigation"
              :key="item.name"
              type="button"
              :class="{ active: WorkspaceState.activeSection === item.name }"
              :style="{ '--atlas-delay': index * 45 + 'ms' }"
              @click="navigate(item.name)"
            >
              <span class="atlas-icon" aria-hidden="true">{{ item.icon }}</span>
              <span><small>{{ item.kicker }}</small><strong>{{ item.name }}</strong></span>
              <i aria-hidden="true">↗</i>
            </button>
          </nav>

          <footer>
            <span class="connection" :class="WorkspaceState.syncStatus"></span>
            <span>{{ syncCopy }}</span>
            <button v-if="WorkspaceState.activeSection !== 'Overview'" type="button" @click="returnToUniverse">Back to universe</button>
          </footer>
        </section>
      </div>
    </Transition>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";

import { WorkspaceState, type WorkspaceSection } from "./WorkspaceState";
import { workspaceEngine } from "./WorkspaceEngine";

const isAtlasOpen = ref(false);

const navigation: Array<{ name: WorkspaceSection; icon: string; kicker: string }> = [
  { name: "Overview", icon: "◉", kicker: "YOUR FIELD" },
  { name: "Projects", icon: "△", kicker: "MAKE" },
  { name: "Atelier", icon: "✧", kicker: "ATELIER" },
  { name: "Studio", icon: "✦", kicker: "CREATE" },
  { name: "Blueprint", icon: "⌘", kicker: "MAP" },
  { name: "AI", icon: "✦", kicker: "CLARIFY" },
  { name: "Reflection", icon: "◒", kicker: "NOTICE" }
];

const activeTitle = computed(() => WorkspaceState.activeSection === "Overview" ? "Your universe" : WorkspaceState.activeSection);
const syncCopy = computed(() => {
  if (WorkspaceState.syncStatus === "synced") return "Your field is connected";
  if (WorkspaceState.syncStatus === "offline") return "Your field is available locally";
  return "Finding your field";
});

function navigate(section: WorkspaceSection): void {
  workspaceEngine.openSection(section);
  isAtlasOpen.value = false;
}

function returnToUniverse(): void {
  workspaceEngine.openSection("Overview");
  isAtlasOpen.value = false;
}

function closeOnEscape(event: KeyboardEvent): void {
  if (event.key === "Escape") isAtlasOpen.value = false;
}

onMounted(() => window.addEventListener("keydown", closeOnEscape));
onUnmounted(() => window.removeEventListener("keydown", closeOnEscape));
</script>

<style scoped>
.atlas-layer { inset:0; pointer-events:none; position:absolute; z-index:100; }
.brand { align-items:center; background:transparent; border:0; color:#f3ecdf; cursor:pointer; display:flex; gap:10px; left:30px; padding:0; pointer-events:auto; position:absolute; top:27px; }
.brand-seal { align-items:center; border:1px solid rgba(221,183,119,.7); border-radius:50%; box-shadow:inset 0 0 0 4px rgba(217,175,102,.07),0 0 26px rgba(202,139,67,.13); display:flex; height:31px; justify-content:center; position:relative; width:31px; }.brand-seal::before,.brand-seal::after { background:rgba(237,197,125,.55); content:""; height:1px; position:absolute; width:19px; }.brand-seal::after { transform:rotate(90deg); }.brand-seal i { border:1px solid rgba(238,192,119,.74); border-radius:50%; height:9px; position:absolute; width:9px; }.brand-seal i:first-child { transform:translate(6px,-6px); }.brand-seal i:nth-child(2) { border-color:rgba(181,209,160,.7); transform:translate(-6px,6px); }.brand-seal b { background:#f5dbab; border-radius:50%; box-shadow:0 0 11px #eeb66d; height:4px; width:4px; }
.brand-word { font-family:Georgia,"Times New Roman",serif; font-size:23px; font-weight:700; letter-spacing:.16em; line-height:1; }.brand-rule { background:linear-gradient(90deg,#d89d54,transparent); height:1px; margin-left:2px; opacity:.55; width:25px; }.brand small { color:rgba(238,224,199,.5); font-size:7px; font-weight:800; letter-spacing:.16em; white-space:nowrap; }
.atlas-trigger { align-items:center; background:rgba(25,20,16,.66); border:1px solid rgba(227,196,145,.22); border-radius:999px; box-shadow:0 12px 34px rgba(0,0,0,.2),inset 0 1px rgba(255,243,223,.06); color:#f7eee0; cursor:pointer; display:flex; gap:10px; padding:8px 9px 8px 11px; pointer-events:auto; position:absolute; right:29px; top:24px; transition:background .25s ease,border-color .25s ease,transform .25s ease; }.atlas-trigger:hover { background:rgba(52,40,29,.84); border-color:rgba(237,194,121,.48); transform:translateY(-2px); }.trigger-symbol { border:1px solid rgba(228,188,120,.48); border-radius:50%; display:flex; height:27px; overflow:hidden; position:relative; width:27px; }.trigger-symbol i { background:#d99e55; border-radius:50%; box-shadow:0 0 9px rgba(222,167,91,.7); height:3px; position:absolute; width:3px; }.trigger-symbol i:nth-child(1){left:5px;top:7px}.trigger-symbol i:nth-child(2){right:5px;top:13px}.trigger-symbol i:nth-child(3){bottom:5px;left:11px}.atlas-trigger small { color:rgba(231,211,178,.51); display:block; font-size:7px; font-weight:800; letter-spacing:.15em; text-align:left; }.atlas-trigger strong { display:block; font-size:10px; font-weight:650; margin-top:2px; text-align:left; }.atlas-trigger b { border-left:1px solid rgba(233,205,157,.14); color:#e7b876; font-size:15px; font-weight:400; margin-left:3px; padding-left:8px; }
.reflection-orbit { align-items:center; background:rgba(27,19,28,.74); border:1px solid rgba(203,148,165,.3); border-radius:999px; bottom:26px; color:#f3e8dc; cursor:pointer; display:flex; gap:8px; padding:7px 11px 7px 7px; pointer-events:auto; position:absolute; right:30px; transition:transform .22s ease,border-color .22s ease; }.reflection-orbit:hover { border-color:rgba(229,164,188,.65); transform:translateY(-2px); }.reflection-orbit > span { align-items:center; border:1px solid rgba(221,159,181,.52); border-radius:50%; display:flex; height:24px; justify-content:center; position:relative; width:24px; }.reflection-orbit > span::before { border:1px solid rgba(221,159,181,.35); border-radius:50%; content:""; inset:4px; position:absolute; }.reflection-orbit i { animation:orbit 4s linear infinite; background:#e5adc0; border-radius:50%; box-shadow:0 0 9px rgba(230,169,194,.62); height:4px; left:2px; position:absolute; top:9px; transform-origin:10px 3px; width:4px; }.reflection-orbit small { font-size:9px; font-weight:750; letter-spacing:.04em; }
.atlas-backdrop { align-items:center; background:rgba(11,9,7,.58); backdrop-filter:blur(13px); display:flex; inset:0; justify-content:center; pointer-events:auto; position:fixed; }.atlas { background:radial-gradient(circle at 86% 13%,rgba(195,127,66,.17),transparent 24%),radial-gradient(circle at 16% 84%,rgba(111,139,88,.14),transparent 22%),rgba(24,19,15,.96); border:1px solid rgba(230,195,140,.24); border-radius:30px; box-shadow:0 35px 110px rgba(0,0,0,.58),inset 0 1px rgba(255,244,226,.08); color:#f6eee1; max-width:820px; overflow:hidden; padding:clamp(28px,5vw,56px); position:relative; width:min(88vw,820px); }.atlas::before { border:1px solid rgba(233,192,126,.12); border-radius:50%; content:""; height:430px; position:absolute; right:-167px; top:-238px; width:430px; }.atlas header { align-items:flex-start; display:flex; justify-content:space-between; position:relative; z-index:1; }.atlas header span { color:#e4af66; font-size:9px; font-weight:800; letter-spacing:.18em; }.atlas h2 { font-family:Georgia,"Times New Roman",serif; font-size:clamp(31px,4.4vw,52px); font-weight:500; letter-spacing:-.065em; line-height:.96; margin:14px 0 0; }.atlas header button { align-items:center; background:rgba(246,226,194,.06); border:1px solid rgba(241,214,171,.18); border-radius:50%; color:#f8eedf; cursor:pointer; display:flex; font-size:22px; height:34px; justify-content:center; line-height:1; padding:0 0 3px; width:34px; }.atlas-intro { color:rgba(235,222,203,.62); font-size:13px; line-height:1.7; margin:20px 0 27px; max-width:570px; position:relative; z-index:1; }.atlas nav { display:grid; gap:10px; grid-template-columns:repeat(2,minmax(0,1fr)); position:relative; z-index:1; }.atlas nav button { align-items:center; animation:atlas-arrival .45s var(--atlas-delay) both cubic-bezier(.2,.8,.3,1); background:rgba(255,247,233,.035); border:1px solid rgba(239,215,179,.1); border-radius:15px; color:#eee4d6; cursor:pointer; display:flex; gap:12px; min-height:68px; padding:11px 13px; text-align:left; transition:background .2s ease,border-color .2s ease,transform .2s ease; }.atlas nav button:hover,.atlas nav button.active { background:linear-gradient(100deg,rgba(206,151,83,.18),rgba(92,110,73,.12)); border-color:rgba(231,180,107,.45); transform:translateY(-2px); }.atlas-icon { align-items:center; border:1px solid rgba(229,181,111,.35); border-radius:50%; color:#f2c174; display:flex; flex:0 0 auto; font-size:16px; height:34px; justify-content:center; width:34px; }.atlas nav button small,.atlas nav button strong { display:block; }.atlas nav button small { color:rgba(227,209,178,.48); font-size:8px; font-weight:750; letter-spacing:.13em; }.atlas nav button strong { font-size:14px; font-weight:560; margin-top:3px; }.atlas nav button i { color:#eab775; font-size:15px; font-style:normal; margin-left:auto; }
.atlas footer { align-items:center; border-top:1px solid rgba(235,211,172,.11); color:rgba(232,218,197,.53); display:flex; font-size:10px; gap:7px; margin-top:24px; padding-top:19px; position:relative; z-index:1; }.connection { border-radius:50%; height:6px; width:6px; }.connection.loading { background:#eab05d; }.connection.synced { animation:signal 2s ease-in-out infinite; background:#93b484; box-shadow:0 0 12px rgba(147,180,132,.6); }.connection.offline { background:#ce7869; }.atlas footer button { background:transparent; border:0; color:#edba77; cursor:pointer; font-size:10px; font-weight:700; margin-left:auto; padding:3px; }
.veil-enter-active,.veil-leave-active { transition:opacity .28s ease; }.veil-enter-active .atlas,.veil-leave-active .atlas { transition:transform .35s cubic-bezier(.2,.9,.3,1),opacity .25s ease; }.veil-enter-from,.veil-leave-to { opacity:0; }.veil-enter-from .atlas,.veil-leave-to .atlas { opacity:0; transform:translateY(22px) scale(.98); }
@keyframes orbit { to { transform:rotate(360deg); } } @keyframes signal { 50% { box-shadow:0 0 0 5px rgba(147,180,132,0),0 0 12px rgba(147,180,132,.6); } } @keyframes atlas-arrival { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
@media (max-width:700px) { .brand { left:17px; top:20px; }.brand-rule,.brand small { display:none; }.atlas-trigger { right:16px; top:17px; }.reflection-orbit { bottom:17px; right:16px; }.atlas { border-radius:23px; padding:28px 22px; width:calc(100vw - 28px); }.atlas nav { grid-template-columns:1fr; }.atlas nav button { min-height:52px; }.atlas h2 { font-size:36px; } }
@media (prefers-reduced-motion:reduce) { .reflection-orbit i,.connection.synced,.atlas nav button { animation:none; } }

.brand { color:var(--top-ink); }.brand-seal { border-color:rgba(98,230,255,.75); box-shadow:inset 0 0 0 4px rgba(98,230,255,.06),0 0 28px rgba(98,230,255,.15); }.brand-seal::before,.brand-seal::after { background:rgba(156,124,255,.75); }.brand-seal i { border-color:rgba(98,230,255,.8); }.brand-seal i:nth-child(2) { border-color:rgba(217,255,113,.75); }.brand-seal b { background:var(--top-lime); box-shadow:0 0 11px var(--top-lime); }.brand-word { font-family:var(--top-display); font-weight:800; letter-spacing:.1em; }.brand-rule { background:linear-gradient(90deg,var(--top-cyan),var(--top-violet),transparent); }.brand small { color:rgba(193,207,248,.54); font-family:var(--top-mono); }.atlas-trigger { background:rgba(9,13,31,.78); border-color:rgba(107,143,255,.32); }.atlas-trigger:hover { background:rgba(23,32,74,.88); border-color:var(--top-cyan); }.trigger-symbol { border-color:rgba(98,230,255,.62); }.trigger-symbol i { background:var(--top-cyan); box-shadow:0 0 9px var(--top-cyan); }.atlas-trigger small { color:rgba(193,207,248,.52); font-family:var(--top-mono); }.atlas-trigger b { color:var(--top-cyan); }.reflection-orbit { background:rgba(12,17,40,.78); border-color:rgba(156,124,255,.42); }.reflection-orbit > span { border-color:rgba(98,230,255,.58); }.reflection-orbit > span::before { border-color:rgba(156,124,255,.43); }.reflection-orbit i { background:var(--top-lime); box-shadow:0 0 9px var(--top-lime); }.atlas-backdrop { background:rgba(3,5,15,.7); }.atlas { background:radial-gradient(circle at 86% 13%,rgba(99,94,255,.23),transparent 25%),radial-gradient(circle at 16% 84%,rgba(49,219,255,.14),transparent 25%),rgba(8,11,28,.98); border-color:rgba(126,157,255,.34); }.atlas::before { border-color:rgba(98,230,255,.14); }.atlas header span,.atlas-icon,.atlas nav button i,.atlas footer button { color:var(--top-cyan); font-family:var(--top-mono); }.atlas h2 { font-family:var(--top-display); font-weight:700; letter-spacing:-.075em; }.atlas-intro { color:var(--top-muted); }.atlas nav button { background:rgba(131,154,255,.05); border-color:rgba(130,160,255,.16); }.atlas nav button:hover,.atlas nav button.active { background:linear-gradient(100deg,rgba(98,230,255,.14),rgba(156,124,255,.18)); border-color:rgba(98,230,255,.62); }.atlas-icon { border-color:rgba(98,230,255,.42); }.atlas nav button small { color:rgba(193,207,248,.48); font-family:var(--top-mono); }.atlas footer { border-color:rgba(130,160,255,.14); color:var(--top-muted); }.connection.loading { background:var(--top-cyan); }.connection.synced { background:var(--top-lime); box-shadow:0 0 12px var(--top-lime); }.connection.offline { background:var(--top-pink); }
.brand-mark { display:block; filter:drop-shadow(0 0 8px rgba(98,230,255,.34)); height:34px; object-fit:contain; width:52px; }
.brand-logo { display:block; filter:drop-shadow(0 0 11px rgba(98,230,255,.32)); height:68px; object-fit:contain; width:68px; }
</style>
