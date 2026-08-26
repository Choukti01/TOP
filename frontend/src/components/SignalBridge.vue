<template>
  <section class="signal-bridge" :class="{ owner: isOwner, open: post.bridge.circleOpen }">
    <header><span>{{ isOwner ? "YOUR SIGNAL'S NEXT FORM" : "TURN ATTENTION INTO ACTION" }}</span><small v-if="post.bridge.circleOpen">◌ Project circle open</small><small v-else>Private by default</small></header>

    <template v-if="isOwner">
      <div v-if="post.bridge.projectId" class="bridge-ready">
        <div><strong>This signal now has a protected project circle.</strong><p>{{ post.bridge.pendingOfferCount ? `${post.bridge.pendingOfferCount} offer${post.bridge.pendingOfferCount === 1 ? '' : 's'} waiting in your Signals.` : 'Invite deliberately, set the path, and keep the work moving.' }}</p></div>
        <div class="owner-actions"><button v-if="post.bridge.pendingOfferCount" class="quiet" type="button" @click="router.push('/profile?panel=signals')">Review offers <span>◌</span></button><button type="button" @click="openProject">Open project circle <span>↗</span></button></div>
      </div>
      <div v-else-if="!circleOpen" class="bridge-call">
        <div><strong>Not just a post.</strong><p>Give this signal a private home where people, milestones, evidence, and reflection can grow.</p></div>
        <button type="button" @click="circleOpen = true">Start a project circle <span>△</span></button>
      </div>
      <form v-else class="circle-form" @submit.prevent="startCircle">
        <div class="circle-form-heading"><div><strong>Open the private circle.</strong><p>Choose the first honest move and the first milestone. The public post stays public; the work stays protected.</p></div><button type="button" aria-label="Close project circle form" @click="circleOpen = false">×</button></div>
        <label><span>LIVING DIRECTION</span><select v-model="direction"><option value="personal">Personal practice</option><option value="creative">Creative work</option><option value="learning">Learning journey</option><option value="community">Community contribution</option><option value="venture">Venture or service</option><option value="other">Own direction</option></select></label>
        <label><span>FIRST NEXT ACTION</span><input v-model.trim="nextAction" maxlength="180" placeholder="One move you can actually begin" /></label>
        <label><span>FIRST MILESTONE</span><input v-model.trim="firstMilestone" maxlength="160" placeholder="A moment the circle can honour" /></label>
        <footer><small>TOP creates the project privately, protects the origin, and opens its evidence trail.</small><button type="submit" :disabled="Boolean(working) || nextAction.length < 3 || firstMilestone.length < 3">{{ working ? 'Opening…' : 'Open circle' }} <span>↗</span></button></footer>
      </form>
    </template>

    <template v-else>
      <div class="bridge-actions">
        <button v-if="!post.bridge.seedId" type="button" :disabled="Boolean(working)" @click="bringToField">{{ working === 'seed' ? 'Bringing it in…' : 'Turn into a seed' }} <span>↗</span></button>
        <button v-else type="button" @click="router.push('/profile?panel=field')">In your private Field <span>✓</span></button>
        <button v-if="!post.bridge.offerStatus || post.bridge.offerStatus === 'declined'" class="quiet" type="button" @click="offerOpen = !offerOpen">{{ offerOpen ? 'Close offer' : 'Offer help or a skill' }} <span>{{ offerOpen ? '×' : '+' }}</span></button>
        <p v-else class="offer-state">{{ post.bridge.offerStatus === 'accepted' ? '✓ Your offer was welcomed into the project circle.' : '◌ Your offer is waiting for the signal author.' }}</p>
      </div>
      <p v-if="post.bridge.circleOpen" class="circle-state">A project circle is forming around this signal. Your offer will reach its owner privately.</p>
      <form v-if="offerOpen" class="offer-form" @submit.prevent="sendOffer">
        <label><span>WHAT CAN YOU BRING?</span><select v-model="offerKind"><option value="help">Practical help</option><option value="skill">A skill or craft</option><option value="collaboration">A collaboration idea</option></select></label>
        <label><span>YOUR USEFUL NOTE</span><textarea v-model.trim="offerNote" maxlength="600" placeholder="Be specific about what you could contribute and why it matters."></textarea></label>
        <footer><small>This reaches the author privately. They decide whether and when to open a circle.</small><button type="submit" :disabled="Boolean(working) || offerNote.length < 3">{{ working === 'offer' ? 'Sending…' : 'Send offer' }} <span>↗</span></button></footer>
      </form>
    </template>
    <p v-if="message" class="bridge-message">{{ message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import { bringSignalIntoField, offerToSignal, startSignalProjectCircle, type ProjectDirection, type PublicPost, type SignalOfferKind } from "../lib/api";
import { authState } from "../lib/auth";

const props = defineProps<{ post: PublicPost }>();
const emit = defineEmits<{ updated: [post: PublicPost] }>();
const router = useRouter();
const isOwner = computed(() => props.post.author.id === authState.user?.id);
const circleOpen = ref(false);
const offerOpen = ref(false);
const working = ref<"" | "seed" | "offer" | "circle">("");
const message = ref("");
const direction = ref<ProjectDirection>("community");
const nextAction = ref("");
const firstMilestone = ref("");
const offerKind = ref<SignalOfferKind>("help");
const offerNote = ref("");

async function bringToField(): Promise<void> {
  working.value = "seed";
  message.value = "";
  try {
    const result = await bringSignalIntoField(props.post.id);
    emit("updated", result.post);
    message.value = "This signal now has a private seed in your Field. Tend it before you turn it into a project.";
  } catch (error) { message.value = error instanceof Error ? error.message : "TOP could not bring this signal into your Field."; } finally { working.value = ""; }
}

async function sendOffer(): Promise<void> {
  if (offerNote.value.length < 3) return;
  working.value = "offer";
  message.value = "";
  try {
    const { post } = await offerToSignal(props.post.id, { kind: offerKind.value, note: offerNote.value });
    emit("updated", post);
    offerOpen.value = false;
    offerNote.value = "";
    message.value = "Your offer reached the signal author privately. If they open a circle, they can welcome you with intention.";
  } catch (error) { message.value = error instanceof Error ? error.message : "TOP could not send that offer."; } finally { working.value = ""; }
}

async function startCircle(): Promise<void> {
  if (nextAction.value.length < 3 || firstMilestone.value.length < 3) return;
  working.value = "circle";
  message.value = "";
  try {
    const result = await startSignalProjectCircle(props.post.id, { direction: direction.value, nextAction: nextAction.value, firstMilestone: firstMilestone.value });
    emit("updated", result.post);
    await router.push({ path: "/field", query: { project: result.projectId } });
  } catch (error) { message.value = error instanceof Error ? error.message : "TOP could not open this project circle."; } finally { working.value = ""; }
}

function openProject(): void {
  if (props.post.bridge.projectId) void router.push({ path: "/field", query: { project: props.post.bridge.projectId } });
}
</script>

<style scoped>
.signal-bridge { background:linear-gradient(135deg,rgba(98,230,255,.07),rgba(156,124,255,.09)); border:1px solid rgba(98,230,255,.2); border-radius:15px 15px 5px 15px; display:grid; gap:12px; margin-top:16px; padding:14px; }.signal-bridge.open { border-color:rgba(156,236,153,.35); }.signal-bridge > header,.circle-form-heading,.bridge-ready,.bridge-call,.bridge-actions,.owner-actions,.offer-form footer,.circle-form footer { align-items:center; display:flex; gap:12px; justify-content:space-between; }.signal-bridge header > span,.offer-form label > span,.circle-form label > span { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; font-weight:800; letter-spacing:.13em; }.signal-bridge header small { color:var(--top-lime); font-family:var(--top-mono); font-size:7px; }.bridge-ready strong,.bridge-call strong,.circle-form strong { color:var(--top-ink); display:block; font-size:11px; }.bridge-ready p,.bridge-call p,.circle-form p,.circle-state,.offer-state { color:var(--top-muted); font-size:10px; line-height:1.55; margin:5px 0 0; }.owner-actions > button,.bridge-ready > button,.bridge-call > button,.bridge-actions > button,.offer-form footer button,.circle-form footer button { align-items:center; background:linear-gradient(110deg,var(--top-cyan),var(--top-violet),var(--top-pink)); border:1px solid rgba(255,255,255,.35); border-radius:999px; color:#07101d; cursor:pointer; display:inline-flex; flex:0 0 auto; font-size:8px; font-weight:900; gap:8px; padding:9px 11px; }.bridge-actions { align-items:stretch; justify-content:flex-start; }.owner-actions > button.quiet,.bridge-actions > button.quiet { background:transparent; border-color:rgba(98,230,255,.36); color:var(--top-cyan); }.bridge-actions > button:disabled,.offer-form footer button:disabled,.circle-form footer button:disabled { cursor:wait; opacity:.55; }.bridge-actions span,.bridge-ready span,.bridge-call span,.offer-form footer span,.circle-form footer span { font-size:11px; }.offer-state { color:var(--top-lime); }.circle-state { border-left:1px solid var(--top-lime); padding-left:8px; }.offer-form,.circle-form { display:grid; gap:10px; }.offer-form label,.circle-form label { display:grid; gap:6px; }.offer-form select,.offer-form textarea,.circle-form select,.circle-form input { background:rgba(3,5,17,.64); border:1px solid rgba(126,156,255,.28); border-radius:10px 10px 3px 10px; box-sizing:border-box; color:var(--top-ink); font:inherit; font-size:10px; outline:0; padding:10px; width:100%; }.offer-form textarea { min-height:78px; resize:vertical; }.offer-form select:focus,.offer-form textarea:focus,.circle-form select:focus,.circle-form input:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.circle-form-heading > button { background:transparent; border:0; color:var(--top-muted); cursor:pointer; font-size:17px; }.offer-form footer small,.circle-form footer small { color:var(--top-muted); font-family:var(--top-mono); font-size:7px; line-height:1.45; max-width:280px; }.bridge-message { border-left:2px solid var(--top-lime); color:#d8fad4; font-family:var(--top-mono); font-size:8px; line-height:1.55; margin:0; padding:7px 9px; } @media (max-width:620px) { .bridge-ready,.bridge-call,.circle-form-heading,.offer-form footer,.circle-form footer { align-items:flex-start; flex-direction:column; }.owner-actions,.bridge-ready > button,.bridge-call > button,.offer-form footer button,.circle-form footer button { justify-content:center; width:100%; }.owner-actions button { justify-content:center; width:100%; }.bridge-actions { flex-direction:column; }.bridge-actions > button { justify-content:center; } }
</style>
