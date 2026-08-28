<template>
  <main class="public-profile-page">
    <div class="profile-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="profile-rail">
      <button class="profile-brand" type="button" aria-label="Back to TOP Page" @click="router.push('/top')"><img :src="topLogoUrl" alt="TOP" /></button>
      <button class="back-to-top" type="button" @click="router.push('/top')">← Shared TOP Page</button>
      <button class="my-profile" type="button" @click="router.push('/profile')">My profile <span>↗</span></button>
    </header>

    <section v-if="loading" class="profile-state">Opening this public field…</section>

    <section v-else-if="profile" class="public-profile-shell">
      <section class="profile-hero">
        <div class="profile-person">
          <span class="profile-mark"><img v-if="profile.avatarDataUrl" :src="profile.avatarDataUrl" :alt="`${profile.displayName}'s profile`" /><b v-else>{{ initials }}</b></span>
          <div>
            <span class="eyebrow">PUBLIC TOP PROFILE</span>
            <h1>{{ profile.displayName }}</h1>
            <p>{{ profile.biography || 'Building a field with intention.' }}</p>
            <dl class="identity-line"><div><dt>FIELD</dt><dd>{{ profile.fieldName || 'Still taking shape' }}</dd></div><div><dt>FROM</dt><dd>{{ profile.location || 'Not named yet' }}</dd></div><div><dt>SINCE</dt><dd>{{ memberSince }}</dd></div></dl>
          </div>
        </div>

        <aside class="connection-panel">
          <template v-if="profile.connectionStatus === 'self'"><span>THIS IS YOUR PUBLIC VIEW</span><p>Your Field, projects, messages, and circles remain private.</p><button type="button" @click="router.push('/profile')">Open my profile <b>↗</b></button></template>
          <template v-else-if="profile.connectionStatus === 'none'"><span>OPEN A CONNECTION</span><p>Invite {{ profile.displayName }} to connect before private messages become available.</p><button type="button" :disabled="connecting" @click="connect">{{ connecting ? 'Sending invitation…' : 'Invite to connect' }} <b>↗</b></button></template>
          <template v-else-if="profile.connectionStatus === 'pending-sent'"><span>CONNECTION WAITING</span><p>Your invitation is in their private Signals. Nothing else is needed from you.</p></template>
          <template v-else-if="profile.connectionStatus === 'pending-received'"><span>THEY INVITED YOU</span><p>Review this connection invitation in your private Signals.</p><button type="button" @click="router.push('/profile?panel=signals')">Open Signals <b>↗</b></button></template>
          <template v-else><span>YOU ARE CONNECTED</span><p>Private conversation is now available to both of you.</p><button type="button" @click="openMessage">Message privately <b>↗</b></button></template>
          <small v-if="connectionMessage" class="connection-message">{{ connectionMessage }}</small>
          <details class="safety-tools"><summary>Safety tools</summary><p>Use this only when something crosses a line. Blocking removes this public field and private contact from your TOP experience.</p><label><span>REASON</span><select v-model="safetyReason"><option value="harassment">Harassment or unwanted contact</option><option value="spam">Spam or manipulation</option><option value="hate">Hate or abuse</option><option value="privacy">Privacy concern</option><option value="other">Something else</option></select></label><textarea v-model.trim="safetyNote" maxlength="800" placeholder="Optional context for review"></textarea><div><button type="button" :disabled="safetyWorking" @click="reportProfile">Report profile</button><button class="block-person" type="button" :disabled="safetyWorking" @click="blockProfile">Block person</button></div><small v-if="safetyMessage" class="connection-message">{{ safetyMessage }}</small></details>
        </aside>
      </section>

      <section class="profile-content">
        <aside class="profile-summary">
          <section class="summary-card"><span class="eyebrow">REAL MOVEMENT</span><div class="public-stats"><div><strong>{{ profile.stats.projectCount }}</strong><span>projects begun</span></div><div><strong>{{ profile.stats.completedMilestoneCount }}</strong><span>milestones honoured</span></div><div><strong>{{ profile.stats.evidenceCount }}</strong><span>pieces made visible</span></div></div></section>
          <section class="summary-card facts-card"><span class="eyebrow">AT A GLANCE</span><dl><div><dt>FIELD NAME</dt><dd>{{ profile.fieldName || 'Not named yet' }}</dd></div><div><dt>LOCATION</dt><dd>{{ profile.location || 'Not named yet' }}</dd></div><div><dt>CONNECTIONS</dt><dd>{{ profile.stats.connectionCount }}</dd></div></dl></section>
          <aside class="privacy-note"><i>◌</i><p>Only deliberate public signals are visible here. Their projects, evidence, conversations, circles, and Field tools stay private.</p></aside>
        </aside>

        <section class="shared-signals">
          <header><div><span class="eyebrow">SHARED FROM THIS FIELD</span><h2>Public signals</h2><p>Ideas, questions, offers, and useful work this person chose to make visible.</p></div><small>{{ profile.sharedPosts.length }} visible</small></header>
          <div v-if="profile.sharedPosts.length === 0" class="shared-empty"><i>◌</i><p>No public signals yet. When they choose to share an idea, offer, need, or question, it will appear here.</p></div>
          <ol v-else class="shared-post-list"><li v-for="post in profile.sharedPosts" :key="post.id" class="shared-post-card"><button class="shared-signal-open" type="button" @click="openSignal(post.id)"><small>{{ post.kind }} · {{ formatDate(post.createdAt) }}</small><strong>{{ post.title }}</strong><span>Open shared conversation <b>↗</b></span></button><p>{{ post.body }}</p><div class="shared-counts"><span v-for="reaction in reactionSummary(post.reactions)" :key="reaction.label">{{ reaction.label }} <b>{{ reaction.count }}</b></span><button type="button" @click="openSignal(post.id)">{{ post.commentCount }} {{ post.commentCount === 1 ? 'response' : 'responses' }} <b>↗</b></button></div><div v-if="post.reactionPeople.length" class="shared-people"><small>PEOPLE WHO MOVED THIS</small><div><button v-for="entry in post.reactionPeople" :key="`${entry.reaction}-${entry.person.id}`" type="button" @click="openPerson(entry.person.id)"><i><img v-if="entry.person.avatarDataUrl" :src="entry.person.avatarDataUrl" :alt="`${entry.person.displayName}'s profile`" /><b v-else>{{ initialsFor(entry.person.displayName) }}</b></i><span>{{ entry.person.displayName }}</span><em>{{ reactionLabel(entry.reaction) }}</em></button></div></div><ol v-if="post.comments.length" class="shared-comments"><li v-for="comment in post.comments" :key="comment.id"><button type="button" @click="openPerson(comment.author.id)">{{ comment.author.displayName }}</button><span>{{ comment.body }}</span><button class="reply-link" type="button" @click="openSignal(post.id, comment.id)">Reply <b>↗</b></button></li></ol></li></ol>
        </section>
      </section>
    </section>

    <section v-else class="profile-state"><h1>This public field is unavailable.</h1><button type="button" @click="router.push('/top')">Return to TOP Page</button></section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { blockTopPerson, getPublicProfile, reportTopSafety, sendConnectionRequest, type PublicProfile, type SafetyReportReason } from "../lib/api";
import { topLogoUrl } from "../lib/brand";

const route = useRoute();
const router = useRouter();
const profile = ref<PublicProfile | null>(null);
const loading = ref(true);
const connecting = ref(false);
const connectionMessage = ref("");
const safetyReason = ref<SafetyReportReason>("harassment");
const safetyNote = ref("");
const safetyWorking = ref(false);
const safetyMessage = ref("");
let profileRequest = 0;
const initials = computed(() => initialsFor(profile.value?.displayName ?? "TOP"));
const memberSince = computed(() => profile.value ? new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(profile.value.memberSince)) : "—");

async function load(): Promise<void> {
  const personId = typeof route.params.personId === "string" ? route.params.personId : "";
  if (!personId) return;
  const request = ++profileRequest;
  loading.value = true;
  connectionMessage.value = "";
  try { const result = await getPublicProfile(personId); if (request === profileRequest) profile.value = result.profile; } catch { if (request === profileRequest) profile.value = null; } finally { if (request === profileRequest) loading.value = false; }
}

async function connect(): Promise<void> {
  if (!profile.value) return;
  connecting.value = true;
  connectionMessage.value = "";
  try { await sendConnectionRequest(profile.value.id); profile.value = { ...profile.value, connectionStatus: "pending-sent" }; connectionMessage.value = "Connection invitation sent to their private Signals."; } catch (error) { connectionMessage.value = error instanceof Error ? error.message : "TOP could not send that connection invitation."; } finally { connecting.value = false; }
}

async function reportProfile(): Promise<void> {
  if (!profile.value) return;
  safetyWorking.value = true;
  safetyMessage.value = "";
  try {
    const result = await reportTopSafety({ targetType: "person", targetId: profile.value.id, reason: safetyReason.value, note: safetyNote.value || null });
    safetyMessage.value = result.message;
    safetyNote.value = "";
  } catch (error) {
    safetyMessage.value = error instanceof Error ? error.message : "TOP could not receive that report right now.";
  } finally { safetyWorking.value = false; }
}

async function blockProfile(): Promise<void> {
  if (!profile.value) return;
  safetyWorking.value = true;
  try {
    await blockTopPerson(profile.value.id);
    await router.replace("/top");
  } catch (error) {
    safetyMessage.value = error instanceof Error ? error.message : "TOP could not block this person right now.";
  } finally { safetyWorking.value = false; }
}

function openMessage(): void { if (profile.value) void router.push({ path: "/profile", query: { panel: "messages", with: profile.value.id } }); }
function openPerson(personId: string): void { if (personId !== profile.value?.id) void router.push(`/people/${personId}`); }
function openSignal(postId: string, commentId?: string): void { void router.push({ path: "/top", query: { signal: postId, ...(commentId ? { comment: commentId } : {}) } }); }
function initialsFor(name: string): string { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "T"; }
function reactionLabel(reaction: string): string { return ({ spark: "Spark", build: "Build", help: "Help", question: "Question", respect: "Respect" } as Record<string, string>)[reaction] ?? reaction; }
function reactionSummary(reactions: Record<string, number>): Array<{ label: string; count: number }> { return Object.entries(reactions).filter(([, count]) => count > 0).map(([reaction, count]) => ({ label: reactionLabel(reaction), count })); }
function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Now" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date); }

onMounted(() => { void load(); });
watch(() => route.params.personId, () => { void load(); });
</script>

<style scoped>
.public-profile-page { background:radial-gradient(circle at 11% 14%,rgba(98,230,255,.16),transparent 24%),radial-gradient(circle at 86% 22%,rgba(156,124,255,.17),transparent 27%),#050611; color:var(--top-ink); min-height:100dvh; overflow:hidden; padding:23px clamp(18px,5vw,70px) 72px; position:relative; }.profile-atmosphere i { border:1px solid rgba(98,230,255,.11); border-radius:50%; pointer-events:none; position:absolute; }.profile-atmosphere i:first-child { height:580px; left:-390px; top:210px; width:580px; }.profile-atmosphere i:nth-child(2) { height:720px; right:-470px; top:-340px; width:720px; }.profile-atmosphere i:last-child { animation:orbit-drift 15s ease-in-out infinite alternate; border-color:rgba(156,124,255,.18); bottom:-310px; height:570px; left:38%; width:570px; }.profile-rail { align-items:center; display:grid; grid-template-columns:auto 1fr auto; margin:0 auto; max-width:1280px; position:relative; z-index:1; }.profile-brand { background:transparent; border:0; cursor:pointer; padding:0; }.profile-brand img { display:block; filter:drop-shadow(0 0 15px rgba(98,230,255,.45)); height:64px; width:64px; }.back-to-top,.my-profile { background:transparent; border:0; cursor:pointer; font-family:var(--top-mono); font-size:9px; }.back-to-top { color:var(--top-muted); justify-self:start; margin-left:20px; }.back-to-top:hover { color:var(--top-cyan); }.my-profile { border:1px solid rgba(98,230,255,.32); border-radius:999px; color:var(--top-cyan); padding:9px 12px; }.my-profile:hover { background:rgba(98,230,255,.09); }.my-profile span { margin-left:5px; }.public-profile-shell { display:grid; gap:24px; margin:clamp(42px,7vw,90px) auto 0; max-width:1280px; position:relative; z-index:1; }.profile-hero { background:radial-gradient(circle at 92% 14%,rgba(156,124,255,.21),transparent 33%),linear-gradient(135deg,rgba(24,34,83,.91),rgba(7,10,30,.97)); border:1px solid rgba(126,156,255,.31); border-radius:30px 30px 8px 30px; box-shadow:inset 0 1px rgba(232,242,255,.1),0 35px 95px rgba(0,0,0,.31); display:grid; gap:32px; grid-template-columns:minmax(0,1fr) minmax(260px,.42fr); padding:clamp(25px,4.6vw,53px); }.profile-person { align-items:flex-start; display:flex; gap:22px; min-width:0; }.profile-mark { align-items:center; background:radial-gradient(circle at 30% 22%,rgba(220,255,120,.85),transparent 18%),linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border:1px solid rgba(255,255,255,.25); border-radius:27px 27px 8px 27px; box-shadow:0 18px 43px rgba(76,91,255,.25); color:#07101d; display:flex; flex:0 0 auto; font-family:var(--top-display); font-size:46px; font-weight:800; height:112px; justify-content:center; letter-spacing:-.11em; overflow:hidden; width:112px; }.profile-mark img { height:100%; object-fit:cover; width:100%; }.profile-mark b { font:inherit; }.eyebrow,.connection-panel > span,.shared-people > small { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.15em; }.profile-person h1 { color:var(--top-ink); font-family:var(--top-display); font-size:clamp(45px,6vw,78px); font-weight:700; letter-spacing:-.09em; line-height:.86; margin:12px 0; overflow-wrap:anywhere; }.profile-person > div > p { color:var(--top-muted); font-size:13px; line-height:1.65; margin:0; max-width:690px; }.identity-line { display:flex; flex-wrap:wrap; gap:13px 29px; margin:24px 0 0; }.identity-line div { min-width:115px; }.identity-line dt,.facts-card dt { color:rgba(189,207,255,.55); font-family:var(--top-mono); font-size:7px; font-weight:800; letter-spacing:.12em; }.identity-line dd,.facts-card dd { color:rgba(239,244,255,.9); font-size:10px; margin:6px 0 0; overflow-wrap:anywhere; }.connection-panel { align-self:stretch; background:rgba(3,6,21,.35); border:1px solid rgba(126,156,255,.18); border-radius:19px 19px 5px 19px; display:flex; flex-direction:column; justify-content:center; padding:22px; }.connection-panel p { color:var(--top-muted); font-size:11px; line-height:1.65; margin:11px 0 18px; }.connection-panel button { align-items:center; background:linear-gradient(110deg,var(--top-cyan),var(--top-violet),var(--top-pink)); border:1px solid rgba(255,255,255,.35); border-radius:999px; color:#07101d; cursor:pointer; display:flex; font-size:9px; font-weight:900; gap:9px; justify-content:space-between; padding:12px 14px; width:100%; }.connection-panel button:disabled { cursor:wait; opacity:.58; }.connection-panel button b { font-size:13px; }.connection-message { color:var(--top-lime); font-family:var(--top-mono); font-size:8px; line-height:1.5; margin-top:11px; }.profile-content { align-items:start; display:grid; gap:24px; grid-template-columns:minmax(250px,.37fr) minmax(0,1fr); }.profile-summary { display:grid; gap:14px; position:sticky; top:20px; }.summary-card,.privacy-note,.shared-signals { background:linear-gradient(145deg,rgba(18,27,67,.78),rgba(6,9,28,.92)); border:1px solid rgba(126,156,255,.22); border-radius:21px 21px 6px 21px; box-shadow:inset 0 1px rgba(231,241,255,.07),0 22px 55px rgba(0,0,0,.17); }.summary-card { display:grid; gap:17px; padding:20px; }.public-stats { border-top:1px solid rgba(126,156,255,.14); display:grid; gap:1px; grid-template-columns:repeat(3,minmax(0,1fr)); padding-top:14px; }.public-stats div { min-width:0; padding-right:9px; }.public-stats div + div { border-left:1px solid rgba(126,156,255,.15); padding-left:10px; }.public-stats strong { color:var(--top-ink); display:block; font-family:var(--top-display); font-size:32px; letter-spacing:-.08em; }.public-stats span { color:var(--top-muted); display:block; font-size:8px; line-height:1.4; margin-top:4px; }.facts-card dl { display:grid; gap:13px; margin:0; }.facts-card dd { font-size:11px; }.privacy-note { align-items:flex-start; background:rgba(98,230,255,.055); border-left:2px solid var(--top-cyan); display:flex; gap:10px; padding:16px; }.privacy-note i { color:var(--top-cyan); font-style:normal; }.privacy-note p { color:var(--top-muted); font-size:10px; line-height:1.65; margin:0; }.shared-signals { display:grid; gap:18px; padding:clamp(20px,3.5vw,35px); }.shared-signals > header { align-items:start; border-bottom:1px solid rgba(126,156,255,.16); display:flex; gap:20px; justify-content:space-between; padding-bottom:19px; }.shared-signals h2 { color:var(--top-ink); font-family:var(--top-display); font-size:clamp(31px,4vw,49px); font-weight:700; letter-spacing:-.08em; line-height:.92; margin:10px 0; }.shared-signals header p { color:var(--top-muted); font-size:11px; line-height:1.6; margin:0; max-width:560px; }.shared-signals header > small { color:var(--top-lime); font-family:var(--top-mono); font-size:8px; padding-top:4px; white-space:nowrap; }.shared-empty { align-items:flex-start; background:rgba(3,6,19,.32); border:1px dashed rgba(126,156,255,.28); display:flex; gap:11px; padding:19px; }.shared-empty i { color:var(--top-cyan); font-size:18px; font-style:normal; }.shared-empty p { color:var(--top-muted); font-size:11px; line-height:1.65; margin:0; }.shared-post-list { display:grid; gap:15px; list-style:none; margin:0; padding:0; }.shared-post-card { background:rgba(3,6,19,.35); border:1px solid rgba(126,156,255,.16); border-radius:17px 17px 5px 17px; display:grid; gap:13px; padding:18px; transition:border-color .2s ease,transform .2s ease; }.shared-post-card:hover { border-color:rgba(98,230,255,.38); transform:translateY(-2px); }.shared-signal-open { background:transparent; border:0; color:inherit; cursor:pointer; display:grid; gap:6px; padding:0; text-align:left; }.shared-signal-open small { color:var(--top-violet); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }.shared-signal-open strong { color:var(--top-ink); font-family:var(--top-display); font-size:25px; letter-spacing:-.06em; line-height:.97; }.shared-signal-open span { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.shared-signal-open:hover strong,.shared-signal-open:hover span { color:var(--top-cyan); }.shared-post-card > p { color:rgba(231,239,255,.8); font-size:11px; line-height:1.7; margin:0; white-space:pre-wrap; }.shared-counts { align-items:center; display:flex; flex-wrap:wrap; gap:7px; }.shared-counts span,.shared-counts button { background:rgba(98,230,255,.055); border:1px solid rgba(98,230,255,.19); border-radius:999px; color:var(--top-muted); font-family:var(--top-mono); font-size:8px; padding:6px 8px; }.shared-counts b { color:var(--top-cyan); font-weight:800; }.shared-counts button { cursor:pointer; }.shared-counts button:hover { border-color:var(--top-cyan); color:var(--top-cyan); }.shared-people { border-top:1px solid rgba(126,156,255,.13); display:grid; gap:8px; padding-top:11px; }.shared-people > div { display:flex; flex-wrap:wrap; gap:6px; }.shared-people button { align-items:center; background:rgba(12,18,48,.61); border:1px solid rgba(127,159,255,.2); border-radius:999px; color:var(--top-ink); cursor:pointer; display:flex; gap:6px; padding:4px 9px 4px 4px; transition:.2s ease; }.shared-people button:hover { border-color:var(--top-cyan); transform:translateY(-1px); }.shared-people i { align-items:center; background:linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border-radius:50%; color:#07101d; display:flex; font-family:var(--top-display); font-size:7px; font-style:normal; font-weight:800; height:20px; justify-content:center; overflow:hidden; width:20px; }.shared-people i img { height:100%; object-fit:cover; width:100%; }.shared-people button > span { font-size:9px; }.shared-people em { color:var(--top-lime); font-family:var(--top-mono); font-size:7px; font-style:normal; }.shared-comments { border-left:1px solid rgba(126,156,255,.22); display:grid; gap:8px; list-style:none; margin:0; padding:3px 0 3px 12px; }.shared-comments li { align-items:baseline; display:flex; flex-wrap:wrap; gap:5px; }.shared-comments button { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:0; }.shared-comments span { color:var(--top-muted); font-size:10px; line-height:1.5; }.shared-comments .reply-link { color:var(--top-lime); margin-left:auto; }.shared-comments .reply-link:hover { color:var(--top-cyan); }.profile-state { background:rgba(12,17,42,.78); border:1px solid rgba(126,156,255,.25); border-radius:22px 22px 6px 22px; color:var(--top-muted); font-size:13px; margin:130px auto 0; max-width:480px; padding:35px; position:relative; text-align:center; z-index:1; }.profile-state h1 { color:var(--top-ink); font-family:var(--top-display); font-size:35px; margin:0 0 13px; }.profile-state button { background:transparent; border:1px solid var(--top-cyan); border-radius:999px; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:9px; margin-top:13px; padding:10px 13px; } @keyframes orbit-drift { to { transform:translate(24px,-21px) scale(1.05); } } @media (max-width:880px) { .profile-hero { grid-template-columns:1fr; }.profile-content { grid-template-columns:1fr; }.profile-summary { grid-template-columns:repeat(2,minmax(0,1fr)); position:static; }.privacy-note { grid-column:span 2; } } @media (max-width:640px) { .public-profile-page { padding:16px 15px 52px; }.profile-rail { grid-template-columns:auto 1fr auto; }.profile-brand img { height:53px; width:53px; }.back-to-top { font-size:8px; margin-left:12px; }.my-profile { font-size:8px; padding:8px 9px; }.public-profile-shell { margin-top:38px; }.profile-hero { border-radius:23px 23px 6px 23px; gap:24px; padding:22px 18px; }.profile-person { flex-direction:column; gap:15px; }.profile-mark { font-size:35px; height:79px; width:79px; }.profile-person h1 { font-size:52px; }.identity-line { display:grid; gap:12px; grid-template-columns:repeat(2,minmax(0,1fr)); }.profile-summary { grid-template-columns:1fr; }.privacy-note { grid-column:auto; }.public-stats { grid-template-columns:repeat(3,minmax(0,1fr)); }.shared-signals { padding:21px 16px; }.shared-signals > header { flex-direction:column; gap:9px; }.shared-signals h2 { font-size:39px; }.shared-signal-open strong { font-size:22px; }.shared-comments .reply-link { margin-left:0; } } @media (prefers-reduced-motion:reduce) { .profile-atmosphere i:last-child { animation:none; }.shared-post-card,.shared-people button { transition:none; }.shared-post-card:hover,.shared-people button:hover { transform:none; } }
.safety-tools { border-top:1px solid rgba(126,156,255,.16); margin-top:17px; padding-top:13px; }.safety-tools summary { color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; letter-spacing:.08em; }.safety-tools p { color:var(--top-muted); font-size:9px; line-height:1.55; margin:10px 0; }.safety-tools label { display:grid; gap:5px; margin:10px 0; }.safety-tools label span { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; }.safety-tools select,.safety-tools textarea { background:rgba(3,6,21,.6); border:1px solid rgba(126,156,255,.24); border-radius:9px; color:var(--top-ink); font:inherit; font-size:10px; padding:8px; width:100%; }.safety-tools textarea { min-height:58px; resize:vertical; }.safety-tools > div { display:grid; gap:7px; grid-template-columns:1fr 1fr; }.safety-tools .block-person { background:transparent; border-color:rgba(255,113,171,.55); color:#ffd1e3; }
</style>
