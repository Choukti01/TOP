<template>
  <aside class="sidebar">
    <div class="brand">
      <span class="brand-mark"></span>
      <span>TOP</span>
    </div>

    <div class="world-card">
      <span class="eyebrow">YOUR UNIVERSE</span>
      <strong>{{ WorkspaceState.worldName }}</strong>
      <p>Make today count.</p>
    </div>

    <nav aria-label="Workspace sections">
      <button
        v-for="item in navigation"
        :key="item.name"
        type="button"
        :class="{ active: WorkspaceState.activeSection === item.name }"
        @click="navigate(item.name)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        {{ item.name }}
        <small v-if="item.count">{{ item.count }}</small>
      </button>
    </nav>

    <section class="weekly-prompt">
      <span class="eyebrow">WEEKLY REFLECTION</span>
      <p>What are you proud of building this week?</p>
      <button type="button" @click="WorkspaceState.activeSection = 'Reflection'">Reflect now <span>→</span></button>
    </section>

    <footer>
      <span class="connection" :class="WorkspaceState.syncStatus"></span>
      <div>
        <strong>{{ syncTitle }}</strong>
        <span>{{ syncDetail }}</span>
      </div>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { WorkspaceState, type WorkspaceSection } from "./WorkspaceState";

const navigation = computed<Array<{ name: Exclude<WorkspaceSection, "Reflection">; icon: string; count?: number }>>(() => [
  { name: "Overview", icon: "◈" },
  { name: "Projects", icon: "◇", count: WorkspaceState.nodes.nodes.length },
  { name: "Knowledge", icon: "◌" },
  { name: "Research", icon: "⌁" },
  { name: "AI", icon: "✦" },
  { name: "Assets", icon: "▦" },
  { name: "Worlds", icon: "◎" }
]);

function navigate(section: WorkspaceSection): void {
  WorkspaceState.activeSection = section;
}

const syncTitle = computed(() => {
  if (WorkspaceState.syncStatus === "synced") return "Connected";
  if (WorkspaceState.syncStatus === "offline") return "Local mode";
  return "Connecting";
});

const syncDetail = computed(() => {
  if (WorkspaceState.syncStatus === "synced") return "TOP API online";
  if (WorkspaceState.syncStatus === "offline") return "Changes saved here";
  return "Checking your world";
});
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #090f1c, #060a13 74%);
  border-right: 1px solid rgba(163, 197, 240, 0.07);
  box-sizing: border-box;
  color: #eff6ff;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 29px 20px 23px;
}

.brand { align-items: center; color: #dceeff; display: flex; font-size: 27px; font-weight: 300; gap: 10px; letter-spacing: 0.28em; padding-left: 10px; }
.brand-mark { background: #78baff; border-radius: 5px; box-shadow: 0 0 21px rgba(112, 184, 255, 0.58); height: 11px; transform: rotate(45deg); width: 11px; }

.world-card { background: radial-gradient(circle at top right, rgba(103, 177, 255, 0.18), transparent 55%), rgba(19, 32, 54, 0.56); border: 1px solid rgba(163, 197, 240, 0.1); border-radius: 14px; margin: 38px 0 26px; padding: 17px; }
.eyebrow { color: #78baff; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; }
.world-card strong { display: block; font-size: 17px; font-weight: 500; margin-top: 8px; }
.world-card p { color: rgba(210, 226, 247, 0.55); font-size: 11px; margin: 5px 0 0; }

nav { display: flex; flex-direction: column; gap: 4px; }
nav button { align-items: center; background: transparent; border: 1px solid transparent; border-radius: 9px; color: rgba(210, 225, 246, 0.57); cursor: pointer; display: flex; font: inherit; font-size: 13px; gap: 10px; height: 42px; padding: 0 10px; text-align: left; transition: background 170ms ease, color 170ms ease, transform 170ms ease; width: 100%; }
nav button:hover { color: #dceeff; transform: translateX(3px); }
nav button.active { background: rgba(112, 184, 255, 0.11); border-color: rgba(112, 184, 255, 0.16); color: #a8d5ff; }
.nav-icon { color: #8ebdf0; font-size: 16px; width: 16px; }
small { background: rgba(143, 190, 241, 0.12); border-radius: 99px; color: #a8d5ff; font-size: 10px; margin-left: auto; padding: 2px 7px; }

.weekly-prompt { background: rgba(255, 255, 255, 0.026); border: 1px solid rgba(163, 197, 240, 0.07); border-radius: 13px; margin-top: auto; padding: 16px; }
.weekly-prompt .eyebrow { color: rgba(174, 204, 240, 0.52); }
.weekly-prompt p { color: rgba(218, 231, 249, 0.74); font-size: 12px; line-height: 1.55; margin: 10px 0 13px; }
.weekly-prompt button { background: transparent; border: 0; color: #7bbcff; cursor: pointer; font: inherit; font-size: 11px; font-weight: 650; padding: 0; }
.weekly-prompt button span { font-size: 15px; margin-left: 3px; }

footer { align-items: center; border-top: 1px solid rgba(163, 197, 240, 0.07); display: flex; gap: 9px; margin-top: 20px; padding: 17px 8px 0; }
.connection { border-radius: 50%; height: 7px; width: 7px; }
.connection.loading { background: #f3b35b; }
.connection.synced { background: #62d7ae; box-shadow: 0 0 12px rgba(98, 215, 174, 0.5); }
.connection.offline { background: #eb7f8f; }
footer strong, footer span { display: block; }
footer strong { color: rgba(227, 238, 252, 0.74); font-size: 10px; font-weight: 650; }
footer div span { color: rgba(192, 211, 237, 0.42); font-size: 10px; margin-top: 2px; }
</style>
