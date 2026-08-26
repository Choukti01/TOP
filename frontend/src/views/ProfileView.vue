<template>
  <section class="profile-view">
    <ThreeField mode="identity" />
    <header class="profile-header"><button class="profile-brand" type="button" aria-label="Back to TOP Page" @click="router.push('/top')"><img :src="topLogoUrl" alt="TOP" /></button><button class="profile-back" type="button" @click="router.push('/top')">← Back to TOP Page</button></header>
    <main class="profile-shell">
      <section class="profile-intro"><span>YOUR TOP PROFILE</span><h1>Let your work speak first.</h1><p>This is not a polished résumé. It is a living orientation for the people and projects you will choose to meet.</p><div class="profile-signal"><i></i><div><small>YOUR FIELD</small><strong>{{ fieldName || 'Name your private Field' }}</strong></div></div><nav class="profile-nav" aria-label="Profile dashboard"><button v-for="panel in panels" :key="panel.id" type="button" :class="{ active: activePanel === panel.id }" @click="activePanel = panel.id"><i>{{ panel.mark }}</i>{{ panel.label }}</button></nav></section>
      <section class="profile-card">
        <div class="profile-card-top"><span>{{ panelHeading }}</span><small>{{ activePanel === 'overview' ? 'YOUR SIGNAL' : 'EDITABLE' }}</small></div>

        <template v-if="activePanel === 'overview'">
          <input ref="avatarInput" class="avatar-input" type="file" accept="image/png,image/jpeg,image/webp" @change="chooseAvatar" />
          <button class="profile-portrait" type="button" aria-label="Choose profile photo" @click="avatarInput?.click()"><img v-if="profileVisualState.avatarDataUrl" :src="profileVisualState.avatarDataUrl" alt="Your profile" /><span v-else>{{ initials }}</span><i></i><b>Change</b></button><h2>{{ authState.user?.displayName }}</h2><p class="profile-bio">{{ biography || 'Your profile begins with the work you choose to bring into the world.' }}</p><dl class="profile-facts"><div><dt>FIELD NAME</dt><dd>{{ fieldName || 'TOP' }}</dd></div><div><dt>LOCATION</dt><dd>{{ location || 'Not named yet' }}</dd></div><div><dt>MEMBER SINCE</dt><dd>{{ joinedAt }}</dd></div><div><dt>VISIBILITY</dt><dd>Private by default</dd></div></dl>
          <div class="profile-stats"><div><strong>{{ profileSummary.projectCount }}</strong><span>projects begun</span></div><div><strong>{{ profileSummary.completedMilestoneCount }}</strong><span>milestones honoured</span></div><div><strong>{{ profileSummary.evidenceCount }}</strong><span>pieces made visible</span></div></div>
          <section class="profile-record"><div class="record-heading"><span>YOUR OPEN COMMITMENTS</span><button type="button" @click="router.push('/profile?panel=field')">Open private Field ↗</button></div><p v-if="openActions.length === 0" class="record-empty">No project is demanding your attention yet. Begin when something real is ready.</p><ul v-else><li v-for="item in openActions.slice(0, 3)" :key="item.projectId"><button class="commitment-link" type="button" @click="openProject(item.projectId)"><i></i><div><small>{{ item.projectTitle }} · {{ item.progress }}%</small><strong>{{ item.action }}</strong></div><em>↗</em></button></li></ul></section>
          <section class="profile-record"><div class="record-heading"><span>RECENT REAL MOVEMENT</span><button type="button" @click="router.push('/field')">See private Field ↗</button></div><p v-if="recentActivity.length === 0" class="record-empty">When you take an action in TOP, its truthful trace appears here.</p><ul v-else><li v-for="activity in recentActivity.slice(0, 3)" :key="activity.id"><i class="activity-mark"></i><div><small>{{ formatActivityTime(activity.createdAt) }}</small><strong>{{ activity.title }}</strong><em v-if="activity.detail">{{ activity.detail }}</em></div></li></ul></section>
          <button class="profile-save" type="button" @click="activePanel = 'identity'">Shape my identity <span>↗</span></button>
        </template>

        <form v-else-if="activePanel === 'identity'" class="profile-form" @submit.prevent="save">
          <h2>Identity, not performance.</h2><p>Give people a truthful starting point—not a finished version of you.</p>
          <label><span>NAME</span><input v-model.trim="displayName" autocomplete="name" maxlength="48" /></label>
          <label><span>PLACE / CONTEXT <em>optional</em></span><input v-model.trim="location" autocomplete="address-level2" maxlength="80" placeholder="Where are you building from?" /></label>
          <label><span>WHAT ARE YOU HERE TO GROW? <em>optional</em></span><textarea v-model.trim="biography" maxlength="500" placeholder="A craft, question, contribution, or direction that matters to you right now."></textarea><small class="count">{{ biography.length }}/500</small></label>
          <p v-if="message" :class="{ error: isError }" class="profile-message">{{ message }}</p>
          <div class="profile-actions"><button class="profile-save" type="submit" :disabled="saving || displayName.length < 2">{{ saving ? 'Saving…' : 'Save identity' }} <span>↗</span></button></div>
        </form>

        <form v-else-if="activePanel === 'field'" class="profile-form" @submit.prevent="saveField">
          <h2>Your private Field.</h2><p>This is where your workspace lives: projects, tools, evidence, collaboration, and reflection. Nothing here appears on the TOP Page unless you explicitly share a new public signal.</p>
          <section class="field-console" aria-label="Private Field projects"><div class="field-console-heading"><span>YOUR PRIVATE WORKSPACE</span><strong>{{ privateProjects.length }} projects</strong></div><p v-if="privateProjects.length === 0">No commitments live here yet. Begin one when something real deserves a place.</p><ul v-else><li v-for="project in privateProjects.slice(0, 4)" :key="project.id"><button type="button" @click="openProject(project.id)"><i></i><div><small>{{ project.direction }} · {{ project.progress }}%</small><strong>{{ project.title }}</strong><em>{{ project.nextAction || 'Choose the next honest move.' }}</em></div><span>↗</span></button></li></ul><button class="field-console-open" type="button" @click="router.push('/field')">Open focused Field <span>↗</span></button></section>
          <label><span>FIELD NAME</span><input v-model.trim="fieldName" maxlength="48" placeholder="Example: A more deliberate life" /></label>
          <label><span>CURRENT INTENTION <em>optional</em></span><textarea v-model.trim="fieldIntention" maxlength="280" placeholder="What do you want your attention to serve this season?"></textarea><small class="count">{{ fieldIntention.length }}/280</small></label>
          <p v-if="fieldMessage" class="profile-message">{{ fieldMessage }}</p>
          <div class="profile-actions"><button class="profile-save" type="submit" :disabled="savingField || fieldName.length < 2">{{ savingField ? 'Saving…' : 'Save field settings' }} <span>↗</span></button><button class="profile-leave" type="button" @click="router.push('/field')">Enter private Field</button></div>
        </form>

        <div v-else-if="activePanel === 'signals'" class="profile-signals"><CollaborationInbox /></div>

        <div v-else-if="activePanel === 'messages'" class="profile-signals"><DirectMessagesInbox /></div>

        <section v-else class="profile-account">
          <h2>Your account, kept quiet.</h2><p>TOP does not sell your attention or make your profile public by default.</p><div class="account-row"><span>EMAIL</span><strong>{{ authState.user?.email }}</strong></div><div class="account-row"><span>SESSION</span><strong>Secure on this browser</strong></div><div class="account-row"><span>PUBLIC PROFILE</span><strong>Only deliberate basics</strong></div><div class="account-note"><i>✓</i><p>Your projects, evidence, project circles, messages, and Field tools remain private. The TOP Page is a separate public layer.</p></div><div class="profile-actions"><button class="profile-save" type="button" @click="router.push('/top')">Open TOP Page <span>↗</span></button><button class="profile-leave" type="button" @click="signOut">Sign out securely</button></div></section>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, watchEffect } from "vue";
import { useRoute, useRouter } from "vue-router";

import ThreeField from "../components/ThreeField.vue";
import CollaborationInbox from "../components/workspace/CollaborationInbox.vue";
import DirectMessagesInbox from "../components/workspace/DirectMessagesInbox.vue";
import { authState, leaveTop, profileVisualState, refineTopProfile, saveTopAvatar } from "../lib/auth";
import { topLogoUrl } from "../lib/brand";
import { getDirectConversations, getPersonalDashboard, getTopNotifications, subscribeToTopSignals, type PersonalDashboard } from "../lib/api";

const router = useRouter();
const route = useRoute();
const displayName = ref("");
const location = ref("");
const biography = ref("");
const message = ref("");
const isError = ref(false);
const saving = ref(false);
const activePanel = ref<"overview" | "identity" | "field" | "signals" | "messages" | "account">("overview");
const fieldName = ref("");
const fieldIntention = ref("");
const fieldMessage = ref("");
const savingField = ref(false);
const dashboard = ref<PersonalDashboard | null>(null);
const avatarInput = ref<HTMLInputElement>();
const unreadSignals = ref(0);
const unreadMessages = ref(0);
const panels = computed(() => [
  { id: "overview" as const, label: "Overview", mark: "◌" },
  { id: "identity" as const, label: "Identity", mark: "✦" },
  { id: "field" as const, label: "Field", mark: "△" },
  { id: "signals" as const, label: unreadSignals.value ? `Signals · ${unreadSignals.value}` : "Signals", mark: "◌" },
  { id: "messages" as const, label: unreadMessages.value ? `Messages · ${unreadMessages.value}` : "Messages", mark: "✉" },
  { id: "account" as const, label: "Account", mark: "⌘" }
]);
const panelHeading = computed(() => ({ overview: "YOUR TOP SIGNAL", identity: "IDENTITY, NOT PERFORMANCE", field: "YOUR PRIVATE FIELD", signals: "YOUR PRIVATE SIGNALS", messages: "YOUR PRIVATE MESSAGES", account: "PRIVACY & ACCESS" })[activePanel.value]);
const initials = computed(() => (authState.user?.displayName ?? "TOP").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase());
const joinedAt = computed(() => authState.user?.createdAt ? new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(authState.user.createdAt)) : "Today");
const profileSummary = computed(() => dashboard.value?.summary ?? { projectCount: 0, activeProjectCount: 0, completedMilestoneCount: 0, milestoneCount: 0, evidenceCount: 0, reflectionCount: 0 });
const openActions = computed(() => dashboard.value?.openActions ?? []);
const recentActivity = computed(() => dashboard.value?.recentActivity ?? []);
const privateProjects = computed(() => dashboard.value?.projects ?? []);

watch(() => route.query.panel, (panel) => {
  if (panel === "overview" || panel === "identity" || panel === "field" || panel === "signals" || panel === "messages" || panel === "account") activePanel.value = panel;
}, { immediate: true });

watchEffect(() => {
  displayName.value = authState.user?.displayName ?? "";
  location.value = authState.user?.location ?? "";
  biography.value = authState.user?.biography ?? "";
  fieldName.value = authState.user?.fieldName ?? fieldName.value;
});

try {
  fieldName.value = localStorage.getItem("top-world-name") ?? "";
  fieldIntention.value = localStorage.getItem("top-field-intention") ?? "";
} catch { /* Private browser settings may block local storage. */ }

onMounted(() => { void loadDashboard(); void loadUnreadSignals(); void loadUnreadMessages(); });
const stopLiveSignals = subscribeToTopSignals(() => { void loadUnreadSignals(); void loadUnreadMessages(); });
onUnmounted(stopLiveSignals);

async function save(): Promise<void> {
  if (displayName.value.length < 2) return;
  saving.value = true;
  message.value = "";
  try {
    await refineTopProfile({ displayName: displayName.value, location: location.value || null, biography: biography.value || null });
    isError.value = false;
    message.value = "Profile saved. Let the work keep changing you.";
  } catch (reason) {
    isError.value = true;
    message.value = reason instanceof Error ? reason.message : "Your profile could not be saved.";
  } finally { saving.value = false; }
}

async function signOut(): Promise<void> { await leaveTop(); await router.replace("/"); }

async function loadDashboard(): Promise<void> {
  try { dashboard.value = await getPersonalDashboard(); } catch { dashboard.value = null; }
}

async function loadUnreadSignals(): Promise<void> {
  try { unreadSignals.value = (await getTopNotifications()).notifications.filter((notification) => !notification.readAt).length; } catch { unreadSignals.value = 0; }
}

async function loadUnreadMessages(): Promise<void> {
  try { unreadMessages.value = (await getDirectConversations()).conversations.reduce((total, conversation) => total + conversation.unreadCount, 0); } catch { unreadMessages.value = 0; }
}

async function chooseAvatar(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
    message.value = "Choose a PNG, JPG, or WebP image under 2 MB.";
    isError.value = true;
    return;
  }

  try {
    const dataUrl = await prepareAvatar(file);
    await refineTopProfile({ avatarDataUrl: dataUrl });
    saveTopAvatar(dataUrl);
    isError.value = false;
    message.value = "Profile photo updated across your TOP presence.";
  } catch (reason) {
    isError.value = true;
    message.value = reason instanceof Error ? reason.message : "Your profile photo could not be saved.";
  }
}

async function prepareAvatar(file: File): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image could not be read.")));
    reader.addEventListener("error", () => reject(new Error("Image could not be read.")));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.addEventListener("load", () => resolve(element));
    element.addEventListener("error", () => reject(new Error("This image could not be prepared.")));
    element.src = source;
  });
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longestSide > 512 ? 512 / longestSide : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the profile photo.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const compressed = canvas.toDataURL("image/webp", 0.82);
  if (compressed.length <= 450_000) return compressed;
  const fallback = canvas.toDataURL("image/jpeg", 0.7);
  if (fallback.length <= 450_000) return fallback;
  throw new Error("Choose a simpler image under 2 MB so TOP can keep it sharp everywhere.");
}

function formatActivityTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Now" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

function openProject(projectId: string): void {
  void router.push({ path: "/field", query: { project: projectId } });
}

async function saveField(): Promise<void> {
  if (fieldName.value.length < 2) return;
  savingField.value = true;
  try {
    await refineTopProfile({ fieldName: fieldName.value });
    localStorage.setItem("top-world-name", fieldName.value);
    localStorage.setItem("top-field-intention", fieldIntention.value);
    fieldMessage.value = "Field settings saved. Your next return will begin here.";
  } catch {
    fieldMessage.value = "TOP could not save this Field name right now.";
  } finally { savingField.value = false; }
}
</script>

<style scoped>
.profile-view { align-items:center; background:radial-gradient(circle at 14% 20%,rgba(98,230,255,.12),transparent 28%),radial-gradient(circle at 86% 82%,rgba(156,124,255,.18),transparent 30%),#050611; color:var(--top-ink); display:flex; justify-content:center; min-height:100dvh; padding:120px 32px 64px; position:relative; }.profile-header { align-items:center; display:flex; justify-content:space-between; left:clamp(18px,5vw,65px); position:absolute; right:clamp(18px,5vw,65px); top:25px; z-index:2; }.profile-brand,.profile-back { background:transparent; border:0; cursor:pointer; }.profile-brand img { display:block; filter:drop-shadow(0 0 14px rgba(98,230,255,.32)); height:64px; width:64px; }.profile-back { color:var(--top-muted); font-family:var(--top-mono); font-size:9px; letter-spacing:.07em; }.profile-back:hover { color:var(--top-cyan); }.profile-shell { align-items:center; display:grid; gap:clamp(45px,10vw,150px); grid-template-columns:minmax(0,1fr) minmax(350px,460px); max-width:1140px; position:relative; width:100%; z-index:1; }.profile-intro > span,.profile-card-top span,.profile-card label > span { color:var(--top-cyan); font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.15em; }.profile-intro h1 { font-family:var(--top-display); font-size:clamp(52px,6vw,79px); font-weight:700; letter-spacing:-.085em; line-height:.89; margin:17px 0; max-width:530px; }.profile-intro > p { color:var(--top-muted); font-size:15px; line-height:1.75; max-width:500px; }.profile-signal { align-items:center; display:flex; gap:13px; margin-top:32px; }.profile-signal > i { background:var(--top-lime); border-radius:50%; box-shadow:0 0 0 6px rgba(156,236,153,.07),0 0 18px rgba(156,236,153,.55); height:8px; width:8px; }.profile-signal small,.profile-signal strong { display:block; }.profile-signal small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; letter-spacing:.13em; }.profile-signal strong { font-family:var(--top-display); font-size:21px; font-weight:700; margin-top:3px; }.profile-card { background:linear-gradient(145deg,rgba(19,27,67,.9),rgba(7,9,26,.95)); border:1px solid rgba(128,160,255,.3); border-radius:27px 27px 8px 27px; box-shadow:0 30px 90px rgba(0,0,0,.43),inset 0 1px rgba(235,244,255,.09); display:grid; gap:17px; padding:clamp(27px,4vw,42px); position:relative; }.profile-card-top { border-bottom:1px solid rgba(127,159,255,.16); display:flex; justify-content:space-between; padding-bottom:17px; }.profile-card-top small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.profile-card label { display:grid; gap:8px; position:relative; }.profile-card label em { color:var(--top-muted); font-style:normal; font-weight:400; letter-spacing:0; text-transform:none; }.profile-card input,.profile-card textarea { background:rgba(3,5,17,.66); border:1px solid rgba(127,159,255,.27); border-radius:13px 13px 4px 13px; color:var(--top-ink); font:inherit; outline:0; padding:13px; transition:.2s ease; }.profile-card textarea { min-height:132px; resize:vertical; }.profile-card input:focus,.profile-card textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.count { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; justify-self:end; margin-top:-3px; }.profile-message { border-left:2px solid var(--top-lime); color:#d9fad5; font-size:11px; line-height:1.5; margin:0; padding:9px 10px; }.profile-message.error { border-color:var(--top-pink); color:#ffd6e7; }.profile-actions { align-items:center; display:flex; justify-content:space-between; margin-top:4px; }.profile-save { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#a08aff 55%,var(--top-pink)); border:1px solid rgba(255,255,255,.4); border-radius:999px; color:#07101d; cursor:pointer; display:flex; font-size:10px; font-weight:900; gap:15px; padding:13px 13px 13px 18px; }.profile-save:disabled { cursor:wait; opacity:.6; }.profile-save span { align-items:center; background:rgba(4,8,24,.13); border-radius:50%; display:flex; font-size:14px; height:22px; justify-content:center; width:22px; }.profile-leave { background:transparent; border:0; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:9px; }.profile-leave:hover { color:var(--top-pink); } @media (max-width:820px) { .profile-view { align-items:flex-start; overflow:auto; padding:116px 20px 46px; }.profile-shell { grid-template-columns:1fr; max-width:560px; }.profile-header { left:16px; right:16px; top:16px; }.profile-brand img { height:53px; width:53px; }.profile-intro h1 { font-size:clamp(48px,12vw,66px); }.profile-card { padding:28px 23px; } }
.profile-nav { display:grid; gap:7px; grid-template-columns:repeat(2,minmax(0,1fr)); margin-top:33px; max-width:390px; }.profile-nav button { background:rgba(120,148,255,.05); border:1px solid rgba(124,156,255,.16); border-radius:999px; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; letter-spacing:.05em; padding:10px; text-align:left; transition:.2s ease; }.profile-nav button:hover,.profile-nav button.active { background:rgba(98,230,255,.1); border-color:rgba(98,230,255,.55); color:var(--top-ink); }.profile-nav i { color:var(--top-cyan); font-size:11px; font-style:normal; margin-right:7px; }.profile-card h2 { font-family:var(--top-display); font-size:34px; font-weight:700; letter-spacing:-.07em; line-height:.92; margin:2px 0 0; }.profile-form { display:grid; gap:17px; }.profile-form > p:not(.profile-message) { color:var(--top-muted); font-size:12px; line-height:1.65; margin:0 0 4px; }.profile-portrait { align-items:center; background:radial-gradient(circle at 33% 26%,rgba(98,230,255,.4),transparent 26%),linear-gradient(145deg,rgba(98,230,255,.14),rgba(156,124,255,.22)); border:1px solid rgba(98,230,255,.48); border-radius:22px 22px 6px 22px; display:flex; height:98px; justify-content:center; overflow:hidden; position:relative; width:98px; }.profile-portrait span { color:#e9f5ff; font-family:var(--top-display); font-size:37px; font-weight:700; letter-spacing:-.09em; position:relative; }.profile-portrait i { animation:avatar-orbit 5s linear infinite; border:1px solid rgba(217,255,113,.7); border-radius:50%; height:8px; left:5px; position:absolute; top:44px; transform-origin:44px 5px; width:8px; }.profile-bio { color:var(--top-muted); font-size:13px; line-height:1.68; margin:0; }.profile-facts { display:grid; gap:1px; grid-template-columns:repeat(2,minmax(0,1fr)); margin:5px 0; overflow:hidden; border:1px solid rgba(126,158,255,.16); border-radius:16px 16px 5px 16px; }.profile-facts div { background:rgba(3,5,17,.36); min-height:76px; padding:13px; }.profile-facts div:nth-child(odd) { border-right:1px solid rgba(126,158,255,.16); }.profile-facts div:nth-child(n+3) { border-top:1px solid rgba(126,158,255,.16); }.profile-facts dt { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; font-weight:800; letter-spacing:.12em; }.profile-facts dd { color:rgba(232,239,255,.87); font-size:11px; line-height:1.4; margin:8px 0 0; }.profile-account { display:grid; gap:17px; }.profile-account > p { color:var(--top-muted); font-size:12px; line-height:1.65; margin:0; }.account-row { align-items:center; border-top:1px solid rgba(126,158,255,.16); display:flex; gap:12px; justify-content:space-between; padding:13px 0; }.account-row span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; letter-spacing:.11em; }.account-row strong { color:rgba(232,239,255,.86); font-size:11px; font-weight:500; text-align:right; }.account-note { align-items:flex-start; background:rgba(156,236,153,.06); border-left:2px solid var(--top-lime); display:flex; gap:9px; padding:11px; }.account-note i { color:var(--top-lime); font-style:normal; }.account-note p { color:var(--top-muted); font-size:10px; line-height:1.55; margin:0; } @keyframes avatar-orbit { to { transform:rotate(360deg); } } @media (max-width:820px) { .profile-nav { max-width:none; }.profile-facts { grid-template-columns:1fr; }.profile-facts div:nth-child(odd) { border-right:0; }.profile-facts div + div { border-top:1px solid rgba(126,158,255,.16); }.profile-facts div:nth-child(n+3) { border-top:1px solid rgba(126,158,255,.16); } }
.avatar-input { display:none; }.profile-portrait { cursor:pointer; padding:0; }.profile-portrait img { height:100%; object-fit:cover; position:absolute; width:100%; }.profile-portrait b { background:rgba(4,8,24,.68); bottom:7px; border:1px solid rgba(255,255,255,.18); border-radius:999px; color:var(--top-ink); font-family:var(--top-mono); font-size:7px; font-weight:700; opacity:0; padding:4px 7px; position:absolute; transition:.2s ease; z-index:2; }.profile-portrait:hover b,.profile-portrait:focus-visible b { opacity:1; }.profile-stats { display:grid; gap:1px; grid-template-columns:repeat(3,minmax(0,1fr)); overflow:hidden; border:1px solid rgba(126,158,255,.16); border-radius:16px 16px 5px 16px; }.profile-stats div { background:rgba(3,5,17,.34); min-height:81px; padding:12px; }.profile-stats div + div { border-left:1px solid rgba(126,158,255,.16); }.profile-stats strong { display:block; font-family:var(--top-display); font-size:30px; font-weight:700; letter-spacing:-.07em; }.profile-stats span { color:var(--top-muted); display:block; font-size:9px; line-height:1.35; margin-top:4px; }.profile-record { border-top:1px solid rgba(126,158,255,.16); margin-top:2px; padding-top:16px; }.record-heading { align-items:center; display:flex; justify-content:space-between; }.record-heading span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.12em; }.record-heading button { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:8px; }.profile-record ul { display:grid; gap:10px; list-style:none; margin:14px 0 0; padding:0; }.profile-record li { align-items:flex-start; background:rgba(3,5,17,.34); border-left:1px solid var(--top-violet); display:flex; gap:10px; padding:10px; }.profile-record li > i { background:var(--top-lime); border-radius:50%; box-shadow:0 0 9px rgba(156,236,153,.6); flex:0 0 auto; height:6px; margin-top:5px; width:6px; }.profile-record li > i.activity-mark { background:var(--top-cyan); box-shadow:0 0 9px rgba(98,230,255,.6); }.profile-record small,.profile-record strong,.profile-record em { display:block; }.profile-record small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.profile-record strong { color:rgba(235,241,255,.9); font-size:11px; line-height:1.45; margin-top:4px; }.profile-record em { color:var(--top-muted); font-size:10px; font-style:normal; line-height:1.45; margin-top:3px; }.record-empty { color:var(--top-muted); font-size:11px; line-height:1.6; margin:14px 0 0; } @media (max-width:500px) { .profile-stats { grid-template-columns:1fr; }.profile-stats div + div { border-left:0; border-top:1px solid rgba(126,158,255,.16); } }
.commitment-link { align-items:flex-start; background:transparent; border:0; color:inherit; cursor:pointer; display:grid; gap:10px; grid-template-columns:6px minmax(0,1fr) auto; padding:0; text-align:left; width:100%; }.commitment-link > i { background:var(--top-lime); border-radius:50%; box-shadow:0 0 9px rgba(156,236,153,.6); height:6px; margin-top:5px; width:6px; }.commitment-link > em { color:var(--top-cyan); font-size:14px; margin-top:4px; opacity:.6; transition:.2s ease; }.profile-record li:has(.commitment-link) { padding:10px; transition:.2s ease; }.profile-record li:has(.commitment-link):hover { background:rgba(98,230,255,.08); border-left-color:var(--top-cyan); }.profile-record li:has(.commitment-link):hover .commitment-link > em { opacity:1; transform:translate(2px,-2px); }
.field-console { background:linear-gradient(145deg,rgba(3,7,23,.56),rgba(19,31,76,.48)); border:1px solid rgba(98,230,255,.23); border-radius:17px 17px 5px 17px; display:grid; gap:12px; overflow:hidden; padding:15px; }.field-console-heading { align-items:center; display:flex; justify-content:space-between; }.field-console-heading span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.12em; }.field-console-heading strong { color:var(--top-lime); font-family:var(--top-mono); font-size:8px; font-weight:700; }.field-console > p { color:var(--top-muted); font-size:11px; line-height:1.55; margin:0; }.field-console ul { display:grid; gap:7px; list-style:none; margin:0; padding:0; }.field-console li { border:1px solid rgba(126,158,255,.13); border-radius:11px 11px 3px 11px; overflow:hidden; }.field-console li button { align-items:flex-start; background:rgba(3,5,17,.3); border:0; color:inherit; cursor:pointer; display:grid; gap:9px; grid-template-columns:6px minmax(0,1fr) auto; padding:11px; text-align:left; width:100%; }.field-console li button:hover { background:rgba(98,230,255,.07); }.field-console li i { background:var(--top-lime); border-radius:50%; box-shadow:0 0 10px rgba(156,236,153,.5); height:6px; margin-top:5px; width:6px; }.field-console li small,.field-console li strong,.field-console li em { display:block; }.field-console li small { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; letter-spacing:.08em; text-transform:uppercase; }.field-console li strong { color:var(--top-ink); font-size:11px; margin-top:4px; }.field-console li em { color:var(--top-muted); font-size:9px; font-style:normal; line-height:1.45; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.field-console li > button > span { color:var(--top-cyan); font-size:13px; }.field-console-open { background:transparent; border:1px solid rgba(98,230,255,.38); border-radius:999px; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:8px; justify-self:start; padding:9px 11px; }.field-console-open span { font-size:12px; }.profile-signals { min-width:0; }.profile-signals :deep(.signals) { grid-column:auto; }.profile-signals :deep(.signals-hero),.profile-signals :deep(.signal-panel),.profile-signals :deep(.messages-hero),.profile-signals :deep(.messages-layout) { border-radius:17px 17px 5px 17px; padding:21px; }.profile-signals :deep(.signals-hero),.profile-signals :deep(.messages-hero) { align-items:flex-start; flex-direction:column; }.profile-signals :deep(.signals-hero h2),.profile-signals :deep(.messages-hero h2) { font-size:34px; }.profile-signals :deep(.signals-hero button),.profile-signals :deep(.messages-hero button) { width:100%; }
</style>
