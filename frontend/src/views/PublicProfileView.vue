<template>
  <main class="person-view">
    <header><button class="person-brand" type="button" aria-label="Back to TOP Page" @click="router.push('/top')"><img :src="topLogoUrl" alt="TOP" /></button><button class="back" type="button" @click="router.push('/top')">← Back to TOP Page</button><button class="my-profile" type="button" @click="router.push('/profile')">My profile ↗</button></header>
    <section v-if="loading" class="person-state">Opening this public field…</section>
    <section v-else-if="profile" class="person-card">
      <div class="person-identity"><span class="person-mark"><img v-if="profile.avatarDataUrl" :src="profile.avatarDataUrl" :alt="`${profile.displayName}'s profile`" /><b v-else>{{ initials }}</b></span><div><span>PUBLIC TOP PROFILE</span><h1>{{ profile.displayName }}</h1><p>{{ profile.biography || 'Building a field with intention.' }}</p></div></div>
      <dl class="public-facts"><div><dt>FIELD NAME</dt><dd>{{ profile.fieldName || 'Not named yet' }}</dd></div><div><dt>LOCATION</dt><dd>{{ profile.location || 'Not named yet' }}</dd></div><div><dt>MEMBER SINCE</dt><dd>{{ memberSince }}</dd></div><div><dt>CONNECTIONS</dt><dd>{{ profile.stats.connectionCount }}</dd></div></dl>
      <section class="public-stats"><div><strong>{{ profile.stats.projectCount }}</strong><span>projects begun</span></div><div><strong>{{ profile.stats.completedMilestoneCount }}</strong><span>milestones honoured</span></div><div><strong>{{ profile.stats.evidenceCount }}</strong><span>pieces made visible</span></div></section>
      <aside class="privacy-note"><i>◌</i><p>This is a public orientation, not their private workspace. Projects, evidence, conversations, circles, and Field tools remain private.</p></aside>
      <div v-if="profile.connectionStatus !== 'self'" class="connection-action"><button v-if="profile.connectionStatus === 'none'" type="button" :disabled="connecting" @click="connect">{{ connecting ? 'Sending…' : 'Invite to connect' }} <span>↗</span></button><p v-else-if="profile.connectionStatus === 'pending-sent'">Connection invitation sent. Their answer stays private.</p><p v-else-if="profile.connectionStatus === 'pending-received'">This person invited you to connect. Review it in your Profile → Signals.</p><div v-else class="connected-actions"><p>◌ You are connected in TOP.</p><button type="button" @click="openMessage">Message privately <span>↗</span></button></div></div>
      <button v-else class="self-return" type="button" @click="router.push('/profile')">Open my private profile ↗</button>
    </section>
    <section v-else class="person-state"><h1>This public field is unavailable.</h1><button type="button" @click="router.push('/top')">Return to TOP Page</button></section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getPublicProfile, sendConnectionRequest, type PublicProfile } from "../lib/api";
import { topLogoUrl } from "../lib/brand";

const route = useRoute();
const router = useRouter();
const profile = ref<PublicProfile | null>(null);
const loading = ref(true);
const connecting = ref(false);
const initials = computed(() => (profile.value?.displayName ?? "TOP").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase());
const memberSince = computed(() => profile.value ? new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(profile.value.memberSince)) : "—");

async function load(): Promise<void> {
  const id = typeof route.params.personId === "string" ? route.params.personId : "";
  if (!id) return;
  loading.value = true;
  try { profile.value = (await getPublicProfile(id)).profile; } catch { profile.value = null; } finally { loading.value = false; }
}

async function connect(): Promise<void> {
  if (!profile.value) return;
  connecting.value = true;
  try { await sendConnectionRequest(profile.value.id); profile.value = { ...profile.value, connectionStatus: "pending-sent" }; } finally { connecting.value = false; }
}

function openMessage(): void {
  if (!profile.value) return;
  void router.push({ path: "/profile", query: { panel: "messages", with: profile.value.id } });
}

onMounted(() => { void load(); });
</script>

<style scoped>
.person-view { align-items:center; background:radial-gradient(circle at 12% 17%,rgba(98,230,255,.15),transparent 26%),radial-gradient(circle at 87% 83%,rgba(156,124,255,.18),transparent 28%),#050611; color:var(--top-ink); display:flex; justify-content:center; min-height:100dvh; padding:128px 25px 65px; position:relative; }.person-view::before { border:1px solid rgba(98,230,255,.12); border-radius:50%; content:""; height:660px; position:absolute; right:-320px; top:-310px; width:660px; }.person-view header { align-items:center; display:flex; justify-content:space-between; left:clamp(17px,5vw,66px); position:absolute; right:clamp(17px,5vw,66px); top:23px; z-index:1; }.person-brand,.back,.my-profile { background:transparent; border:0; cursor:pointer; }.person-brand img { display:block; filter:drop-shadow(0 0 14px rgba(98,230,255,.35)); height:64px; width:64px; }.back,.my-profile { color:var(--top-muted); font-family:var(--top-mono); font-size:9px; }.my-profile { color:var(--top-cyan); }.person-card { background:linear-gradient(145deg,rgba(21,29,73,.9),rgba(6,9,27,.96)); border:1px solid rgba(127,159,255,.32); border-radius:29px 29px 8px 29px; box-shadow:0 35px 100px rgba(0,0,0,.44),inset 0 1px rgba(235,244,255,.09); display:grid; gap:23px; max-width:720px; padding:clamp(25px,5vw,55px); position:relative; width:100%; z-index:1; }.person-identity { align-items:center; display:flex; gap:18px; }.person-mark { align-items:center; background:radial-gradient(circle at 30% 24%,rgba(217,255,113,.9),transparent 18%),linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border-radius:23px 23px 7px 23px; color:#07101d; display:flex; flex:0 0 auto; font-family:var(--top-display); font-size:38px; font-weight:800; height:92px; justify-content:center; letter-spacing:-.1em; width:92px; }.person-identity > div > span,.public-facts dt { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.15em; }.person-identity h1 { font-family:var(--top-display); font-size:clamp(39px,6vw,61px); font-weight:700; letter-spacing:-.08em; line-height:.9; margin:10px 0; }.person-identity p { color:var(--top-muted); font-size:12px; line-height:1.6; margin:0; }.public-facts { display:grid; gap:1px; grid-template-columns:repeat(2,minmax(0,1fr)); margin:0; overflow:hidden; border:1px solid rgba(127,159,255,.16); border-radius:16px 16px 5px 16px; }.public-facts div { background:rgba(3,5,17,.35); min-height:78px; padding:13px; }.public-facts div:nth-child(odd) { border-right:1px solid rgba(127,159,255,.16); }.public-facts div:nth-child(n+3) { border-top:1px solid rgba(127,159,255,.16); }.public-facts dd { color:rgba(235,241,255,.87); font-size:11px; margin:8px 0 0; }.public-stats { display:grid; gap:1px; grid-template-columns:repeat(3,minmax(0,1fr)); overflow:hidden; border:1px solid rgba(127,159,255,.16); border-radius:16px 16px 5px 16px; }.public-stats div { background:rgba(3,5,17,.35); min-height:80px; padding:13px; }.public-stats div + div { border-left:1px solid rgba(127,159,255,.16); }.public-stats strong { color:var(--top-ink); display:block; font-family:var(--top-display); font-size:31px; letter-spacing:-.08em; }.public-stats span { color:var(--top-muted); display:block; font-size:9px; line-height:1.35; margin-top:4px; }.privacy-note { align-items:flex-start; background:rgba(98,230,255,.06); border-left:2px solid var(--top-cyan); display:flex; gap:10px; padding:13px; }.privacy-note i { color:var(--top-cyan); font-style:normal; }.privacy-note p { color:var(--top-muted); font-size:11px; line-height:1.6; margin:0; }.connection-action { text-align:center; }.connection-action button,.self-return { align-items:center; background:linear-gradient(110deg,var(--top-cyan),var(--top-violet),var(--top-pink)); border:1px solid rgba(255,255,255,.37); border-radius:999px; color:#07101d; cursor:pointer; display:inline-flex; font-size:10px; font-weight:900; gap:12px; padding:13px 17px; }.connection-action button:disabled { cursor:wait; opacity:.6; }.connection-action p { color:var(--top-lime); font-family:var(--top-mono); font-size:9px; line-height:1.6; margin:0; }.person-state { background:rgba(12,17,42,.72); border:1px solid rgba(126,156,255,.23); border-radius:22px 22px 6px 22px; color:var(--top-muted); font-size:13px; padding:35px; position:relative; text-align:center; z-index:1; }.person-state h1 { color:var(--top-ink); font-family:var(--top-display); font-size:35px; margin:0 0 13px; }.person-state button { background:transparent; border:1px solid var(--top-cyan); border-radius:999px; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:9px; margin-top:13px; padding:10px 13px; } @media (max-width:640px) { .person-view { align-items:flex-start; padding:111px 16px 48px; }.person-view header { left:16px; right:16px; top:16px; }.person-brand img { height:53px; width:53px; }.back { display:none; }.person-card { padding:25px 19px; }.person-identity { align-items:flex-start; flex-direction:column; }.public-facts,.public-stats { grid-template-columns:1fr; }.public-facts div:nth-child(odd),.public-stats div + div { border-left:0; }.public-facts div + div,.public-stats div + div { border-top:1px solid rgba(127,159,255,.16); }.public-facts div:nth-child(n+3) { border-top:1px solid rgba(127,159,255,.16); } }
.person-mark { overflow:hidden; }.person-mark img { height:100%; object-fit:cover; width:100%; }.person-mark b { font:inherit; }
</style>
