<template>
  <Transition name="lens">
    <aside v-if="selectedNode" class="inspector">
      <header>
        <div>
          <span class="eyebrow">IN FOCUS</span>
          <h2>{{ selectedNode.title }}</h2>
        </div>
        <button class="close" type="button" aria-label="Return to the field" @click="closeInspector">×</button>
      </header>

      <p>{{ selectedNode.description }}</p>

      <div class="momentum">
        <div><span>Momentum</span><strong>{{ selectedNode.progress }}%</strong></div>
        <div class="track"><i :style="{ width: selectedNode.progress + '%' }"></i></div>
      </div>

      <footer>
        <span><i></i>{{ selectedNode.status }}</span>
        <button type="button" @click="saveWorkspace">{{ saveLabel }}</button>
      </footer>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { workspaceEngine } from "./WorkspaceEngine";
import { WorkspaceState } from "./WorkspaceState";

const selectedNode = computed(() =>
  WorkspaceState.nodes.nodes.find((node) => node.id === WorkspaceState.selectedNodeId)
);
const saveLabel = ref("Remember place");

function saveWorkspace(): void {
  saveLabel.value = workspaceEngine.save() ? "Place remembered" : "Could not save";
  window.setTimeout(() => { saveLabel.value = "Remember place"; }, 1_800);
}

function closeInspector(): void {
  workspaceEngine.clearSelection();
}
</script>

<style scoped>
.inspector { background:linear-gradient(135deg,rgba(36,28,20,.9),rgba(21,17,13,.94)); border:1px solid rgba(239,211,164,.2); border-radius:20px 20px 20px 5px; bottom:73px; box-shadow:0 28px 75px rgba(0,0,0,.42),inset 0 1px rgba(255,243,220,.06); color:#f3eadd; left:31px; max-width:340px; padding:20px; position:absolute; width:calc(100% - 62px); z-index:30; }.inspector::before { background:radial-gradient(circle,rgba(223,166,88,.18),transparent 68%); content:""; height:130px; pointer-events:none; position:absolute; right:-48px; top:-61px; width:130px; }
header { align-items:flex-start; display:flex; justify-content:space-between; position:relative; z-index:1; }.eyebrow { color:#e2ad65; font-size:8px; font-weight:800; letter-spacing:.17em; }.inspector h2 { font-family:Georgia,"Times New Roman",serif; font-size:25px; font-weight:500; letter-spacing:-.04em; margin:7px 0 0; }.close { align-items:center; background:rgba(247,228,199,.06); border:1px solid rgba(247,228,199,.15); border-radius:50%; color:#f2e2ca; cursor:pointer; display:flex; font-size:20px; height:29px; justify-content:center; line-height:1; padding:0 0 3px; width:29px; }.close:hover { background:rgba(229,177,101,.17); }
p { color:rgba(233,219,199,.62); font-size:12px; line-height:1.6; margin:14px 0 19px; max-width:274px; position:relative; z-index:1; }.momentum { border-top:1px solid rgba(235,216,186,.11); padding-top:13px; position:relative; z-index:1; }.momentum > div:first-child { color:rgba(235,219,194,.5); display:flex; font-size:10px; justify-content:space-between; }.momentum strong { color:#f2e2c7; font-weight:700; }.track { background:rgba(233,215,182,.12); border-radius:99px; height:3px; margin-top:9px; overflow:hidden; }.track i { background:linear-gradient(90deg,#cc8950,#e5bd77); border-radius:inherit; display:block; height:100%; }
footer { align-items:center; display:flex; justify-content:space-between; margin-top:18px; position:relative; z-index:1; } footer > span { color:rgba(235,218,193,.5); font-size:10px; text-transform:capitalize; } footer > span i { background:#9ab487; border-radius:50%; box-shadow:0 0 9px rgba(154,180,135,.55); display:inline-block; height:5px; margin-right:5px; width:5px; } footer button { background:transparent; border:0; color:#ebba78; cursor:pointer; font-size:10px; font-weight:750; padding:3px; }
.lens-enter-active,.lens-leave-active { transition:opacity .23s ease,transform .28s cubic-bezier(.2,.8,.3,1); }.lens-enter-from,.lens-leave-to { opacity:0; transform:translateY(14px) scale(.97); }
@media (max-width:700px) { .inspector { bottom:62px; left:16px; width:calc(100% - 32px); }.inspector p { max-width:85%; } }
</style>
