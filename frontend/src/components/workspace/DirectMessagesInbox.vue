<template>
  <article class="direct-messages">
    <section class="messages-hero">
      <div><span>YOUR PRIVATE MESSAGES</span><h2>Talk with people, not an audience.</h2><p>Messages open only after a connection is accepted. They are never part of the public TOP Page.</p></div>
      <button type="button" :disabled="loading" @click="load">{{ loading ? "Refreshing…" : "Refresh" }}</button>
    </section>

    <section class="messages-layout">
      <aside class="conversation-list"><div class="list-heading"><span>CONNECTIONS</span><small>{{ conversations.length }}</small></div><p v-if="!loading && conversations.length === 0" class="quiet">When a connection is accepted, they will appear here—ready for a private conversation.</p><button v-for="conversation in conversations" :key="conversation.person.id" type="button" :class="{ active: activePerson?.id === conversation.person.id }" @click="openConversation(conversation.person)"><i><img v-if="conversation.person.avatarDataUrl" :src="conversation.person.avatarDataUrl" :alt="`${conversation.person.displayName}'s profile`" /><b v-else>{{ initialsFor(conversation.person.displayName) }}</b></i><div><strong>{{ conversation.person.displayName }}</strong><small>{{ conversation.lastMessage }}</small></div><em v-if="conversation.unreadCount">{{ conversation.unreadCount }}</em></button></aside>

      <section class="thread"><template v-if="activePerson"><header><i><img v-if="activePerson.avatarDataUrl" :src="activePerson.avatarDataUrl" :alt="`${activePerson.displayName}'s profile`" /><b v-else>{{ initialsFor(activePerson.displayName) }}</b></i><div><span>PRIVATE CONVERSATION</span><h3>{{ activePerson.displayName }}</h3><small>{{ activePerson.fieldName || 'TOP connection' }}</small></div></header><div v-if="threadLoading" class="thread-state">Opening your conversation…</div><div v-else-if="messages.length === 0" class="thread-state">No messages yet. Begin with something useful, kind, or concrete.</div><ol v-else class="message-list"><li v-for="message in messages" :key="message.id" :class="{ own: message.senderId === authState.user?.id }"><small>{{ message.sender.displayName }} · {{ formatTime(message.createdAt) }}</small><p>{{ message.body }}</p></li></ol><form @submit.prevent="send"><textarea v-model.trim="draft" maxlength="2000" placeholder="Write a private message…"></textarea><footer><small>{{ draft.length }}/2000 · Only you two can read this.</small><button type="submit" :disabled="sending || draft.length < 1">{{ sending ? 'Sending…' : 'Send message' }} <span>↗</span></button></footer></form></template><div v-else class="thread-state"><i>◌</i><h3>Choose a conversation.</h3><p>Visit a connected person’s public profile to begin a new private conversation.</p></div></section>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { getDirectConversations, getDirectMessages, getPublicProfile, sendDirectMessage, subscribeToTopSignals, type DirectConversation, type DirectMessage, type PublicPersonSummary } from "../../lib/api";
import { authState } from "../../lib/auth";

const route = useRoute();
const conversations = ref<DirectConversation[]>([]);
const activePerson = ref<PublicPersonSummary | null>(null);
const messages = ref<DirectMessage[]>([]);
const loading = ref(false);
const threadLoading = ref(false);
const sending = ref(false);
const draft = ref("");
const requestedPersonId = computed(() => typeof route.query.with === "string" ? route.query.with : "");

function initialsFor(name: string): string { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "T"; }
function formatTime(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Now" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date); }

async function load(): Promise<void> {
  loading.value = true;
  try {
    const result = await getDirectConversations();
    conversations.value = result.conversations;
    const target = requestedPersonId.value || activePerson.value?.id || conversations.value[0]?.person.id;
    if (target) await openConversationById(target);
  } finally { loading.value = false; }
}

async function openConversation(person: PublicPersonSummary): Promise<void> {
  activePerson.value = person;
  await loadThread(person.id);
}

async function openConversationById(personId: string): Promise<void> {
  const existing = conversations.value.find((conversation) => conversation.person.id === personId)?.person;
  if (existing) return openConversation(existing);
  const { profile } = await getPublicProfile(personId);
  await openConversation(profile);
}

async function loadThread(personId: string): Promise<void> {
  threadLoading.value = true;
  try { messages.value = (await getDirectMessages(personId)).messages; } catch { messages.value = []; } finally { threadLoading.value = false; }
}

async function send(): Promise<void> {
  if (!activePerson.value || !draft.value) return;
  sending.value = true;
  try {
    const { message } = await sendDirectMessage(activePerson.value.id, draft.value);
    messages.value = [...messages.value, message];
    draft.value = "";
    await load();
  } finally { sending.value = false; }
}

const stopLiveSignals = subscribeToTopSignals(() => { void load(); });
onMounted(() => { void load(); });
onUnmounted(stopLiveSignals);
watch(requestedPersonId, (personId) => { if (personId) void openConversationById(personId); });
</script>

<style scoped>
.direct-messages { display:grid; gap:17px; }.messages-hero,.messages-layout { background:linear-gradient(145deg,rgba(22,31,77,.8),rgba(6,10,28,.92)); border:1px solid rgba(125,153,255,.24); border-radius:23px 23px 8px 23px; box-shadow:inset 0 1px rgba(219,237,255,.07),0 22px 55px rgba(0,0,0,.18); padding:21px; }.messages-hero { align-items:end; background:radial-gradient(circle at 84% 18%,rgba(98,230,255,.18),transparent 30%),linear-gradient(145deg,rgba(23,31,84,.84),rgba(6,9,27,.94)); display:flex; gap:22px; justify-content:space-between; }.messages-hero span,.list-heading span,.thread header span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.15em; }.messages-hero h2 { color:var(--top-ink); font-family:var(--top-display); font-size:34px; font-weight:700; letter-spacing:-.075em; line-height:.92; margin:13px 0; }.messages-hero p { color:var(--top-muted); font-size:12px; line-height:1.65; margin:0; max-width:570px; }.messages-hero button { background:rgba(98,230,255,.1); border:1px solid rgba(98,230,255,.55); border-radius:999px; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:9px; font-weight:800; padding:11px 14px; }.messages-layout { display:grid; gap:16px; grid-template-columns:minmax(170px,.65fr) minmax(0,1.35fr); padding:14px; }.conversation-list { border-right:1px solid rgba(126,156,255,.15); display:grid; align-content:start; gap:7px; min-height:340px; padding:8px; }.list-heading { align-items:center; display:flex; justify-content:space-between; padding:5px 4px 10px; }.list-heading small { color:var(--top-lime); font-family:var(--top-mono); font-size:8px; }.conversation-list > button { align-items:center; background:transparent; border:1px solid transparent; border-radius:12px 12px 4px 12px; color:inherit; cursor:pointer; display:grid; gap:8px; grid-template-columns:29px minmax(0,1fr) auto; padding:9px; text-align:left; }.conversation-list > button:hover,.conversation-list > button.active { background:rgba(98,230,255,.08); border-color:rgba(98,230,255,.33); }.conversation-list i,.thread header i { align-items:center; background:linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border-radius:9px 9px 3px 9px; color:#07101d; display:flex; font-family:var(--top-display); font-size:10px; font-style:normal; font-weight:800; height:29px; justify-content:center; overflow:hidden; width:29px; }.conversation-list i img,.thread header i img { height:100%; object-fit:cover; width:100%; }.conversation-list strong,.conversation-list small { display:block; }.conversation-list strong { color:var(--top-ink); font-size:10px; }.conversation-list small { color:var(--top-muted); font-size:8px; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.conversation-list em { align-items:center; background:var(--top-pink); border-radius:999px; color:#07101d; display:flex; font-family:var(--top-mono); font-size:7px; font-style:normal; font-weight:900; height:17px; justify-content:center; min-width:17px; }.quiet,.thread-state { color:var(--top-muted); font-size:11px; line-height:1.6; }.quiet { padding:4px; }.thread { display:grid; min-height:340px; padding:10px; }.thread header { align-items:center; border-bottom:1px solid rgba(126,156,255,.15); display:flex; gap:10px; padding-bottom:13px; }.thread header i { height:35px; width:35px; }.thread header h3 { color:var(--top-ink); font-family:var(--top-display); font-size:23px; letter-spacing:-.05em; margin:4px 0; }.thread header small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.thread-state { align-self:center; justify-self:center; max-width:310px; text-align:center; }.thread-state i { color:var(--top-cyan); font-size:24px; font-style:normal; }.thread-state h3 { color:var(--top-ink); font-family:var(--top-display); font-size:27px; margin:10px 0 5px; }.thread-state p { margin:0; }.message-list { align-content:start; display:grid; gap:9px; list-style:none; margin:15px 0; padding:0; }.message-list li { background:rgba(3,5,17,.35); border-left:1px solid var(--top-violet); padding:10px; }.message-list li.own { background:rgba(98,230,255,.07); border-left-color:var(--top-cyan); }.message-list small { color:var(--top-muted); font-family:var(--top-mono); font-size:7px; }.message-list p { color:rgba(232,239,255,.88); font-size:11px; line-height:1.6; margin:7px 0 0; white-space:pre-wrap; }.thread form { align-self:end; border-top:1px solid rgba(126,156,255,.15); display:grid; gap:8px; padding-top:12px; }.thread textarea { background:rgba(3,5,17,.65); border:1px solid rgba(126,156,255,.28); border-radius:12px 12px 4px 12px; color:var(--top-ink); font:inherit; min-height:78px; outline:0; padding:11px; resize:vertical; }.thread textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.thread footer { align-items:center; display:flex; justify-content:space-between; }.thread footer small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.thread footer button { background:linear-gradient(110deg,var(--top-cyan),var(--top-violet),var(--top-pink)); border:1px solid rgba(255,255,255,.35); border-radius:999px; color:#07101d; cursor:pointer; font-size:9px; font-weight:900; padding:10px 12px; }.thread footer button:disabled { cursor:wait; opacity:.55; } @media (max-width:720px) { .messages-hero { align-items:flex-start; flex-direction:column; }.messages-hero button { width:100%; }.messages-layout { grid-template-columns:1fr; }.conversation-list { border-bottom:1px solid rgba(126,156,255,.15); border-right:0; min-height:0; }.thread { min-height:390px; }.thread footer { align-items:flex-start; flex-direction:column; gap:9px; }.thread footer button { width:100%; } }
</style>
