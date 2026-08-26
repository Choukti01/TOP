<template>
  <article class="signals">
    <section class="signals-hero">
      <div>
        <span>YOUR PRIVATE SIGNALS</span>
        <h2>Collaboration is a choice, not a feed.</h2>
        <p>Project invitations, connection requests, role changes, and meaningful updates live here. Nothing is amplified for attention.</p>
      </div>
      <button type="button" :disabled="loading" @click="load">{{ loading ? "Refreshing…" : "Refresh signals" }}</button>
    </section>

    <section class="signal-panel invitation-panel">
      <div class="panel-heading"><span>PROJECT INVITATIONS</span><strong>{{ invitations.length }}</strong></div>
      <div v-if="loading && invitations.length === 0" class="quiet-state">Listening for your project circle…</div>
      <div v-else-if="invitations.length === 0" class="quiet-state">No invitations waiting. Your circles stay deliberately small.</div>
      <ul v-else class="invitation-list">
        <li v-for="invitation in invitations" :id="`project-invitation-${invitation.id}`" :key="invitation.id" :class="{ highlighted: highlightedInvitationId === invitation.id }">
          <div><small>{{ invitation.role === "mentor" ? "MENTOR INVITATION" : "CONTRIBUTOR INVITATION" }}</small><h3>{{ invitation.projectTitle }}</h3><p>{{ invitation.inviterName }} invited you to help shape this project.</p><time :datetime="invitation.createdAt">{{ formatTime(invitation.createdAt) }}</time></div>
          <div class="invitation-actions"><button class="accept" type="button" :disabled="respondingId === invitation.id" @click="respond(invitation.id, 'accepted')">{{ respondingId === invitation.id ? "Joining…" : "Accept" }}</button><button class="decline" type="button" :disabled="respondingId === invitation.id" @click="respond(invitation.id, 'declined')">Decline</button></div>
        </li>
      </ul>
    </section>

    <section class="signal-panel invitation-panel">
      <div class="panel-heading"><span>CONNECTION INVITATIONS</span><strong>{{ connectionRequests.length }}</strong></div>
      <div v-if="loading && connectionRequests.length === 0" class="quiet-state">Listening for people who want to meet with intention…</div>
      <div v-else-if="connectionRequests.length === 0" class="quiet-state">No connection invitations waiting. A connection is a deliberate opening—not a follower count.</div>
      <ul v-else class="invitation-list connection-list">
        <li v-for="request in connectionRequests" :id="`connection-request-${request.id}`" :key="request.id" :class="{ highlighted: highlightedConnectionId === request.id }">
          <div><small>CONNECTION INVITATION</small><h3>{{ request.sender.displayName }}</h3><p>{{ request.sender.fieldName || 'A shared field still taking shape' }}<template v-if="request.sender.location"> · {{ request.sender.location }}</template></p><time :datetime="request.createdAt">{{ formatTime(request.createdAt) }}</time></div>
          <div class="invitation-actions"><button class="accept" type="button" :disabled="respondingConnectionId === request.id" @click="respondToConnection(request.id, 'accepted')">{{ respondingConnectionId === request.id ? 'Connecting…' : 'Accept' }}</button><button class="decline" type="button" :disabled="respondingConnectionId === request.id" @click="respondToConnection(request.id, 'declined')">Decline</button></div>
        </li>
      </ul>
    </section>

    <section class="signal-panel invitation-panel">
      <div class="panel-heading"><span>OFFERS TO BUILD</span><strong>{{ signalOffers.length }}</strong></div>
      <div v-if="loading && signalOffers.length === 0" class="quiet-state">Listening for people who want to make a real contribution…</div>
      <div v-else-if="signalOffers.length === 0" class="quiet-state">When someone offers help, a skill, or a collaboration around your public signal, it arrives here. You decide if and when it belongs in a project circle.</div>
      <ul v-else class="invitation-list signal-offer-list">
        <li v-for="offer in signalOffers" :key="offer.id">
          <div><small>{{ offer.kind === 'skill' ? 'SKILL OFFER' : offer.kind === 'collaboration' ? 'COLLABORATION OFFER' : 'HELP OFFER' }}</small><h3>{{ offer.sender.displayName }}</h3><p><b>For:</b> {{ offer.postTitle }}</p><p class="offer-note">{{ offer.note }}</p><time :datetime="offer.createdAt">{{ formatTime(offer.createdAt) }}</time></div>
          <div class="invitation-actions offer-actions"><template v-if="offer.projectId"><label><span class="sr-only">Role for {{ offer.sender.displayName }}</span><select v-model="offerRoles[offer.id]"><option value="contributor">Contributor</option><option value="mentor">Mentor</option></select></label><button class="accept" type="button" :disabled="respondingOfferId === offer.id" @click="respondToOffer(offer.id, 'accepted')">{{ respondingOfferId === offer.id ? 'Welcoming…' : 'Welcome' }}</button></template><button v-else class="open-signal" type="button" @click="openSignalForCircle(offer.postId)">Open signal</button><button class="decline" type="button" :disabled="respondingOfferId === offer.id" @click="respondToOffer(offer.id, 'declined')">Decline</button></div>
        </li>
      </ul>
    </section>

    <section class="signal-panel notification-panel">
      <div class="panel-heading"><span>THE CIRCLE MOVED</span><strong>{{ unreadCount }} unread</strong></div>
      <div v-if="loading && notifications.length === 0" class="quiet-state">Gathering the recent trail…</div>
      <div v-else-if="notifications.length === 0" class="quiet-state">When a person responds or a project changes, the signal will arrive here.</div>
      <ol v-else class="notification-list">
        <li v-for="notification in notifications" :key="notification.id" :class="{ unread: !notification.readAt }">
          <button type="button" @click="openNotification(notification.id, notification.href)"><i></i><div><strong>{{ notification.title }}</strong><p v-if="notification.detail">{{ notification.detail }}</p><time :datetime="notification.createdAt">{{ formatTime(notification.createdAt) }}</time></div><span v-if="notification.href">Open ↗</span></button>
        </li>
      </ol>
    </section>
  </article>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { getCollaborationInvitations, getIncomingConnectionRequests, getIncomingSignalOffers, getTopNotifications, markTopNotificationRead, respondToCollaborationInvitation, respondToConnectionRequest, respondToSignalOffer, subscribeToTopSignals, type CollaborationInvitation, type ConnectionRequest, type SignalOffer, type TopNotification } from "../../lib/api";
import { workspaceEngine } from "./WorkspaceEngine";

const router = useRouter();
const route = useRoute();
const invitations = ref<CollaborationInvitation[]>([]);
const connectionRequests = ref<ConnectionRequest[]>([]);
const signalOffers = ref<SignalOffer[]>([]);
const notifications = ref<TopNotification[]>([]);
const loading = ref(false);
const respondingId = ref("");
const respondingConnectionId = ref("");
const respondingOfferId = ref("");
const offerRoles = ref<Record<string, "contributor" | "mentor">>({});
const unreadCount = computed(() => notifications.value.filter((notification) => !notification.readAt).length);
const highlightedInvitationId = computed(() => typeof route.query.invite === "string" ? route.query.invite : "");
const highlightedConnectionId = computed(() => typeof route.query.connection === "string" ? route.query.connection : "");

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Just now" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [invitationResult, connectionResult, offerResult, notificationResult] = await Promise.all([getCollaborationInvitations(), getIncomingConnectionRequests(), getIncomingSignalOffers(), getTopNotifications()]);
    invitations.value = invitationResult.invitations;
    connectionRequests.value = connectionResult.requests;
    signalOffers.value = offerResult.offers;
    notifications.value = notificationResult.notifications;
    await focusHighlightedSignal();
  } catch (error) {
    workspaceEngine.notify(error instanceof Error ? error.message : "TOP could not gather your collaboration signals.");
  } finally {
    loading.value = false;
  }
}

async function respondToOffer(offerId: string, response: "accepted" | "declined"): Promise<void> {
  respondingOfferId.value = offerId;
  try {
    const result = await respondToSignalOffer(offerId, { response, role: offerRoles.value[offerId] ?? "contributor" });
    signalOffers.value = signalOffers.value.filter((offer) => offer.id !== offerId);
    workspaceEngine.notify(result.message);
  } catch (error) {
    workspaceEngine.notify(error instanceof Error ? error.message : "That offer could not be answered.");
  } finally { respondingOfferId.value = ""; }
}

function openSignalForCircle(postId: string): void { void router.push({ path: "/top", query: { signal: postId } }); }

async function respondToConnection(requestId: string, response: "accepted" | "declined"): Promise<void> {
  respondingConnectionId.value = requestId;
  try {
    const result = await respondToConnectionRequest(requestId, response);
    connectionRequests.value = connectionRequests.value.filter((request) => request.id !== requestId);
    workspaceEngine.notify(result.message);
  } catch (error) {
    workspaceEngine.notify(error instanceof Error ? error.message : "That connection invitation could not be answered.");
  } finally {
    respondingConnectionId.value = "";
  }
}

async function respond(invitationId: string, response: "accepted" | "declined"): Promise<void> {
  respondingId.value = invitationId;
  try {
    const result = await respondToCollaborationInvitation(invitationId, response);
    invitations.value = invitations.value.filter((invitation) => invitation.id !== invitationId);
    await workspaceEngine.load();
    workspaceEngine.notify(result.message);
    if (response === "accepted") await router.push({ path: "/field", query: { project: result.project.id } });
    else await load();
  } catch (error) {
    workspaceEngine.notify(error instanceof Error ? error.message : "That invitation could not be answered.");
  } finally {
    respondingId.value = "";
  }
}

async function openNotification(notificationId: string, href: string | null): Promise<void> {
  const index = notifications.value.findIndex((notification) => notification.id === notificationId);
  if (index < 0) return;
  const notification = notifications.value[index]!;
  if (!notification.readAt) {
    try {
      await markTopNotificationRead(notification.id);
      notifications.value[index] = { ...notification, readAt: new Date().toISOString() };
    } catch {
      // Reading a signal should not prevent the user from opening its project.
    }
  }
  if (!href) return;
  if (notification.type === "project-invitation" || notification.type === "connection-request") {
    const key = notification.type === "project-invitation" ? "invite" : "connection";
    const signalId = new URL(href, window.location.origin).searchParams.get(key);
    await router.push({ path: "/profile", query: { panel: "signals", ...(signalId ? { [key]: signalId } : {}) } });
    return;
  }
  await router.push(href);
}

async function focusHighlightedSignal(): Promise<void> {
  const invitationId = highlightedInvitationId.value;
  const connectionId = highlightedConnectionId.value;
  if (!invitationId && !connectionId) return;
  await nextTick();
  const id = invitationId ? `project-invitation-${invitationId}` : `connection-request-${connectionId}`;
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

onMounted(() => { void load(); });
const stopLiveSignals = subscribeToTopSignals(() => { void load(); });
onUnmounted(stopLiveSignals);
watch(() => [route.query.invite, route.query.connection], () => { void focusHighlightedSignal(); });
</script>

<style scoped>
.signals { display:grid; gap:17px; grid-column:span 3; }.signals-hero,.signal-panel { background:linear-gradient(145deg,rgba(22,31,77,.8),rgba(6,10,28,.92)); border:1px solid rgba(125,153,255,.24); border-radius:23px 23px 8px 23px; box-shadow:inset 0 1px rgba(219,237,255,.07),0 22px 55px rgba(0,0,0,.18); padding:clamp(21px,4vw,38px); }.signals-hero { align-items:end; background:radial-gradient(circle at 84% 18%,rgba(156,124,255,.28),transparent 30%),radial-gradient(circle at 13% 84%,rgba(98,230,255,.14),transparent 25%),linear-gradient(145deg,rgba(23,31,84,.84),rgba(6,9,27,.94)); display:flex; gap:22px; justify-content:space-between; }.signals-hero span,.panel-heading > span,.invitation-list small { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.15em; }.signals-hero h2 { color:var(--top-ink); font-family:var(--top-display); font-size:clamp(32px,4vw,53px); font-weight:700; letter-spacing:-.075em; line-height:.92; margin:13px 0; max-width:680px; }.signals-hero p { color:var(--top-muted); font-size:12px; line-height:1.65; max-width:640px; }.signals-hero button { background:rgba(98,230,255,.1); border:1px solid rgba(98,230,255,.55); border-radius:999px; color:var(--top-cyan); cursor:pointer; flex:0 0 auto; font-family:var(--top-mono); font-size:9px; font-weight:800; padding:11px 14px; }.signals-hero button:disabled { cursor:wait; opacity:.55; }.panel-heading { align-items:center; display:flex; justify-content:space-between; }.panel-heading strong { color:var(--top-lime); font-family:var(--top-mono); font-size:9px; }.quiet-state { border:1px dashed rgba(125,153,255,.26); border-radius:14px 14px 4px 14px; color:var(--top-muted); font-size:11px; line-height:1.6; margin-top:19px; padding:20px; }.invitation-list,.notification-list { display:grid; gap:10px; list-style:none; margin:19px 0 0; padding:0; }.invitation-list li { align-items:center; background:rgba(3,6,18,.45); border-left:1px solid var(--top-violet); display:flex; gap:20px; justify-content:space-between; padding:16px; }.invitation-list small { color:var(--top-violet); }.invitation-list h3 { color:var(--top-ink); font-family:var(--top-display); font-size:23px; font-weight:700; letter-spacing:-.05em; margin:7px 0 0; }.invitation-list p { color:var(--top-muted); font-size:11px; margin:7px 0; }.invitation-list time,.notification-list time { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.invitation-actions { display:flex; flex:0 0 auto; gap:7px; }.invitation-actions button { border-radius:999px; cursor:pointer; font-family:var(--top-mono); font-size:8px; font-weight:800; padding:9px 11px; }.accept { background:var(--top-lime); border:1px solid var(--top-lime); color:#07101d; }.decline { background:transparent; border:1px solid rgba(193,207,248,.3); color:var(--top-muted); }.invitation-actions button:disabled { cursor:wait; opacity:.55; }.notification-list li { border:1px solid rgba(125,153,255,.14); border-radius:14px 14px 4px 14px; overflow:hidden; }.notification-list li.unread { border-color:rgba(98,230,255,.45); }.notification-list button { align-items:flex-start; background:rgba(3,6,18,.32); border:0; color:inherit; cursor:pointer; display:grid; gap:12px; grid-template-columns:8px minmax(0,1fr) auto; padding:14px; text-align:left; width:100%; }.notification-list button:hover { background:rgba(98,230,255,.06); }.notification-list i { background:rgba(125,153,255,.45); border-radius:50%; height:7px; margin-top:5px; width:7px; }.notification-list .unread i { background:var(--top-cyan); box-shadow:0 0 11px rgba(98,230,255,.75); }.notification-list strong { color:var(--top-ink); display:block; font-size:11px; }.notification-list p { color:var(--top-muted); font-size:10px; line-height:1.5; margin:5px 0; }.notification-list span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; padding-top:2px; white-space:nowrap; } @media (max-width:720px) { .signals-hero,.invitation-list li { align-items:flex-start; flex-direction:column; }.invitation-actions { width:100%; }.invitation-actions button { flex:1; }.notification-list button { grid-template-columns:8px minmax(0,1fr); }.notification-list span { grid-column:2; }.signals-hero button { width:100%; } }
.invitation-list li.highlighted { animation:invitation-arrival 1.8s ease-in-out 2; background:rgba(98,230,255,.11); border-left-color:var(--top-cyan); box-shadow:0 0 0 1px rgba(98,230,255,.22),0 0 30px rgba(98,230,255,.1); scroll-margin:30px; } .signal-offer-list .offer-note { border-left:1px solid var(--top-lime); color:rgba(226,245,220,.82); padding-left:8px; }.signal-offer-list p b { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; }.offer-actions { align-items:center; flex-wrap:wrap; justify-content:flex-end; }.offer-actions select { background:rgba(3,5,17,.74); border:1px solid rgba(156,124,255,.38); border-radius:999px; color:var(--top-ink); font-family:var(--top-mono); font-size:8px; padding:8px; }.open-signal { background:transparent; border:1px solid rgba(98,230,255,.4); color:var(--top-cyan); } @keyframes invitation-arrival { 50% { transform:translateX(4px); } }
</style>
