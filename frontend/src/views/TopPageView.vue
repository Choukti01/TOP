<template>
  <main class="top-page">
    <div class="top-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
    <header class="top-header">
      <button class="top-brand" type="button" aria-label="TOP Page" @click="refresh"><img :src="topLogoUrl" alt="TOP" /></button>
      <nav aria-label="TOP Page navigation"><button class="nav-active" type="button" @click="refresh">TOP Page</button><button type="button" @click="openDiscovery">Discover</button><button type="button" @click="router.push('/profile?panel=signals')">Signals <b v-if="unreadCount">{{ unreadCount }}</b></button><button type="button" @click="router.push('/profile')">My profile</button></nav>
      <button class="self-card" type="button" @click="router.push('/profile')"><span><img v-if="authState.user?.avatarDataUrl" :src="authState.user.avatarDataUrl" alt="Your profile" /><b v-else>{{ initials }}</b></span><strong>{{ authState.user?.displayName || 'My profile' }}</strong><i>↗</i></button>
    </header>

    <section class="top-shell">
      <aside class="top-intro"><span>THE SHARED FIELD</span><h1>Share what can move <em>real life</em> forward.</h1><p>Ideas, useful information, offers, questions, and negotiations live here. TOP rewards a meaningful response—not empty attention.</p><form class="discovery-form" @submit.prevent="search"><label for="top-discovery">FIND PEOPLE &amp; SHARED WORK</label><div><input id="top-discovery" ref="discoveryInput" v-model.trim="searchQuery" maxlength="80" placeholder="Name, field, idea, or useful work" /><button type="submit" :disabled="searching || searchQuery.length < 2">{{ searching ? 'Looking…' : 'Search' }}</button></div><small>Private Fields, projects, and circles never appear here.</small></form><dl><div><dt>SPARK</dt><dd>“This opened something.”</dd></div><div><dt>BUILD</dt><dd>“I would make this real.”</dd></div><div><dt>HELP</dt><dd>“I can contribute.”</dd></div></dl></aside>

      <section class="top-stream" aria-label="Shared TOP signals">
        <section v-if="searchResults || searchMessage" class="discovery-results" aria-live="polite"><header><div><span>DISCOVERY</span><h2>{{ searchQuery ? `Results for “${searchQuery}”` : 'Find a direction' }}</h2></div><button type="button" @click="clearSearch">Close</button></header><p v-if="searchMessage" class="discovery-message">{{ searchMessage }}</p><template v-else-if="searchResults"><section><div class="discovery-heading"><span>PEOPLE</span><small>{{ searchResults.people.length }}</small></div><p v-if="searchResults.people.length === 0" class="discovery-empty">No public people matched that yet.</p><ul v-else class="people-results"><li v-for="person in searchResults.people" :key="person.id"><button class="result-person" type="button" @click="openPerson(person.id)"><i><img v-if="person.avatarDataUrl" :src="person.avatarDataUrl" :alt="`${person.displayName}'s profile`" /><b v-else>{{ initialsFor(person.displayName) }}</b></i><div><strong>{{ person.displayName }}</strong><small>{{ person.fieldName || 'A field still taking shape' }}<template v-if="person.location"> · {{ person.location }}</template></small></div><span>Profile ↗</span></button><button v-if="person.connectionStatus === 'none'" class="result-connect" type="button" :disabled="connectingPersonId === person.id" @click="connectPerson(person.id)">{{ connectingPersonId === person.id ? 'Sending…' : 'Connect' }}</button><em v-else>{{ connectionCopy(person.connectionStatus) }}</em></li></ul></section><section><div class="discovery-heading"><span>SHARED WORK</span><small>{{ searchResults.posts.length }}</small></div><p v-if="searchResults.posts.length === 0" class="discovery-empty">No public signals matched that yet.</p><ul v-else class="work-results"><li v-for="post in searchResults.posts" :key="post.id"><button type="button" @click="openSearchedPost(post)"><small>{{ post.kind }} · {{ post.author.displayName }}</small><strong>{{ post.title }}</strong><p>{{ post.body }}</p><span>Open in shared field ↗</span></button></li></ul></section></template></section>
        <form class="signal-composer" @submit.prevent="publish">
          <div class="composer-heading"><span>ADD A SIGNAL</span><small>Public by choice. Keep private work inside your Field.</small></div>
          <div class="kind-picker" role="group" aria-label="Signal kind"><button v-for="kind in kinds" :key="kind.value" type="button" :class="{ selected: draftKind === kind.value }" @click="draftKind = kind.value"><i>{{ kind.mark }}</i>{{ kind.label }}</button></div>
          <input v-model.trim="draftTitle" maxlength="140" placeholder="Give this signal a clear title" aria-label="Signal title" />
          <textarea v-model.trim="draftBody" maxlength="2000" placeholder="Share the idea, information, offer, question, or negotiation in a way someone can use…" aria-label="Signal details"></textarea>
          <footer><small>{{ draftBody.length }}/2000 · Keep the work useful.</small><button type="submit" :disabled="publishing || draftTitle.length < 3 || draftBody.length < 3">{{ publishing ? 'Sending…' : 'Send signal' }} <span>↗</span></button></footer>
          <p v-if="actionMessage" class="top-action-message">{{ actionMessage }}</p>
        </form>

        <div v-if="loading" class="stream-state">Listening to the shared field…</div>
        <div v-else-if="posts.length === 0" class="stream-state empty"><i>◌</i><h2>The shared field is quiet.</h2><p>Be the first person to offer an idea, question, or useful signal.</p></div>
        <ol v-else class="post-list">
          <li v-for="post in posts" :id="`public-post-${post.id}`" :key="post.id" class="post-card">
            <button class="post-person" type="button" @click="openPerson(post.author.id)"><span><img v-if="post.author.avatarDataUrl" :src="post.author.avatarDataUrl" :alt="`${post.author.displayName}'s profile`" /><b v-else>{{ initialsFor(post.author.displayName) }}</b></span><div><small>{{ post.kind }}</small><strong>{{ post.author.displayName }}</strong><em>{{ post.author.fieldName || 'A field still taking shape' }} · {{ formatTime(post.createdAt) }}</em></div><i>↗</i></button>
            <div v-if="isOwnPost(post)" class="post-ownership"><button type="button" :aria-expanded="postEdit?.id === post.id" @click="postEdit?.id === post.id ? cancelPostEdit() : startPostEdit(post)">{{ postEdit?.id === post.id ? 'Close editing' : 'Manage signal' }}</button></div>
            <article v-if="postEdit?.id !== post.id"><h2>{{ post.title }}</h2><p>{{ post.body }}</p><small v-if="post.updatedAt !== post.createdAt" class="edited-marker">Edited {{ formatTime(post.updatedAt) }}</small></article>
            <form v-else class="post-editor" @submit.prevent="savePostEdit(post.id)"><label><span>SIGNAL KIND</span><select v-model="postEdit.kind"><option v-for="kind in kinds" :key="kind.value" :value="kind.value">{{ kind.label }}</option></select></label><label><span>TITLE</span><input v-model.trim="postEdit.title" maxlength="140" required /></label><label><span>DETAILS</span><textarea v-model.trim="postEdit.body" maxlength="2000" required></textarea></label><footer><button type="button" class="quiet-action" :disabled="savingPostId === post.id" @click="cancelPostEdit">Cancel</button><button type="button" class="danger-action" :disabled="savingPostId === post.id" @click="removePost(post)">Delete signal</button><button type="submit" :disabled="savingPostId === post.id || postEdit.title.length < 3 || postEdit.body.length < 3">{{ savingPostId === post.id ? 'Saving…' : 'Save changes' }}</button></footer></form>
            <SignalBridge :post="post" @updated="replacePost" />
            <div class="reaction-row" aria-label="Meaningful reactions"><button v-for="reaction in reactionChoices" :key="reaction.value" type="button" :class="{ selected: post.viewerReaction === reaction.value }" :disabled="reactingId === post.id" :title="reaction.hint" @click="react(post.id, reaction.value)"><i>{{ reaction.mark }}</i><span>{{ reaction.label }}</span><b>{{ post.reactions[reaction.value] || '' }}</b></button></div>
            <div v-if="post.reactionPeople.length" class="reaction-people"><small>PEOPLE WHO MOVED THIS</small><div><button v-for="entry in post.reactionPeople" :key="`${entry.reaction}-${entry.person.id}`" type="button" :class="{ focused: focusedReaction(post.id, entry.person.id) }" @click="openPerson(entry.person.id)"><i><img v-if="entry.person.avatarDataUrl" :src="entry.person.avatarDataUrl" :alt="`${entry.person.displayName}'s profile`" /><b v-else>{{ initialsFor(entry.person.displayName) }}</b></i><span>{{ entry.person.displayName }}</span><em>{{ reactionLabel(entry.reaction) }}</em></button></div></div>
            <section class="response-space"><button class="response-toggle" type="button" :aria-expanded="Boolean(openComments[post.id])" @click="toggleComments(post.id)">{{ openComments[post.id] ? 'Close responses' : `${post.commentCount || 'No'} responses` }} <span>{{ openComments[post.id] ? '↑' : '↓' }}</span></button><div v-if="openComments[post.id]" class="response-panel"><ol v-if="post.comments.length" class="comment-list"><li v-for="entry in orderedComments(post)" :id="`public-comment-${entry.comment.id}`" :key="entry.comment.id" :class="[{ focused: focusedComment(post.id, entry.comment.id), 'comment-reply-item': entry.depth > 0 }]" :style="{ '--reply-depth': Math.min(entry.depth, 3) }"><button type="button" @click="openPerson(entry.comment.author.id)"><i><img v-if="entry.comment.author.avatarDataUrl" :src="entry.comment.author.avatarDataUrl" :alt="`${entry.comment.author.displayName}'s profile`" /><b v-else>{{ initialsFor(entry.comment.author.displayName) }}</b></i>{{ entry.comment.author.displayName }}</button><form v-if="commentEdit?.commentId === entry.comment.id" class="comment-editor" @submit.prevent="saveCommentEdit(post.id, entry.comment.id)"><textarea v-model.trim="commentEdit.body" maxlength="1000" required></textarea><footer><button type="button" class="quiet-action" :disabled="savingCommentId === entry.comment.id" @click="cancelCommentEdit">Cancel</button><button type="submit" :disabled="savingCommentId === entry.comment.id || commentEdit.body.length < 1">{{ savingCommentId === entry.comment.id ? 'Saving…' : 'Save response' }}</button></footer></form><template v-else><p>{{ entry.comment.body }}</p><footer><time>{{ formatTime(entry.comment.createdAt) }}<template v-if="entry.comment.updatedAt !== entry.comment.createdAt"> · edited</template></time><div class="comment-actions"><button v-if="isOwnComment(entry.comment)" class="comment-reply" type="button" @click="startCommentEdit(post.id, entry.comment)">Edit</button><button v-if="isOwnComment(entry.comment)" class="comment-delete" type="button" @click="removeComment(post, entry.comment.id)">Delete</button><button class="comment-reply" type="button" @click="replyTo(post.id, entry.comment.id, entry.comment.author.displayName)">Reply ↗</button></div></footer></template></li></ol><p v-else class="no-comments">No responses yet. Add something that moves the conversation forward.</p><form @submit.prevent="comment(post.id)"><p v-if="replyingTo[post.id]" class="reply-context">Replying publicly to <strong>@{{ replyingTo[post.id].name }}</strong><button type="button" @click="clearReply(post.id)">Cancel</button></p><label class="sr-only" :for="`comment-draft-${post.id}`">{{ replyingTo[post.id] ? `Reply to ${replyingTo[post.id].name}` : 'Add a response' }}</label><textarea :id="`comment-draft-${post.id}`" v-model.trim="commentDrafts[post.id]" maxlength="1000" :placeholder="replyingTo[post.id] ? `Reply to ${replyingTo[post.id].name}…` : 'Add a thoughtful response…'"></textarea><button type="submit" :disabled="commentingId === post.id || !(commentDrafts[post.id] || '').trim()">{{ commentingId === post.id ? 'Adding…' : replyingTo[post.id] ? 'Reply publicly' : 'Add response' }}</button></form></div></section>
          </li>
        </ol>
      </section>

      <aside class="top-principles"><span>THE LONG VIEW</span><h2>Not a place to perform.</h2><p>Every action should either clarify, connect, offer help, or help someone build.</p><button type="button" @click="router.push('/profile?panel=field')">Open my private Field <span>↗</span></button><button class="quiet" type="button" @click="router.push('/profile?panel=signals')">See my Signals <span>↗</span></button></aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import { addPublicComment, createPublicPost, deletePublicComment, deletePublicPost, getPublicPost, getTopFeed, getTopNotifications, reactToPublicPost, searchTop, sendConnectionRequest, subscribeToTopSignals, updatePublicComment, updatePublicPost, type PublicComment, type PublicPost, type PublicPostKind, type PublicReaction, type PublicSearchResults } from "../lib/api";
import { authState } from "../lib/auth";
import { topLogoUrl } from "../lib/brand";
import SignalBridge from "../components/SignalBridge.vue";

const router = useRouter();
const route = useRoute();
const posts = ref<PublicPost[]>([]);
const loading = ref(true);
const publishing = ref(false);
const reactingId = ref("");
const commentingId = ref("");
const savingPostId = ref("");
const savingCommentId = ref("");
const unreadCount = ref(0);
const draftKind = ref<PublicPostKind>("idea");
const draftTitle = ref("");
const draftBody = ref("");
const openComments = ref<Record<string, boolean>>({});
const commentDrafts = ref<Record<string, string>>({});
const replyingTo = ref<Record<string, { id: string; name: string }>>({});
const postEdit = ref<{ id: string; kind: PublicPostKind; title: string; body: string } | null>(null);
const commentEdit = ref<{ postId: string; commentId: string; body: string } | null>(null);
const discoveryInput = ref<HTMLInputElement>();
const searchQuery = ref("");
const searchResults = ref<PublicSearchResults | null>(null);
const searchMessage = ref("");
const searching = ref(false);
const connectingPersonId = ref("");
const actionMessage = ref("");
const initials = computed(() => initialsFor(authState.user?.displayName ?? "TOP"));
const kinds: Array<{ value: PublicPostKind; label: string; mark: string }> = [{ value: "idea", label: "Idea", mark: "✧" }, { value: "signal", label: "Info", mark: "◌" }, { value: "offer", label: "Offer", mark: "↗" }, { value: "question", label: "Question", mark: "?" }, { value: "negotiation", label: "Negotiate", mark: "⌘" }, { value: "request", label: "Need", mark: "+" }, { value: "resource", label: "Resource", mark: "⌁" }, { value: "milestone", label: "Movement", mark: "◒" }, { value: "event", label: "Gather", mark: "◌" }, { value: "collaboration", label: "Collaborate", mark: "△" }];
const reactionChoices: Array<{ value: PublicReaction; label: string; mark: string; hint: string }> = [{ value: "spark", label: "Spark", mark: "✧", hint: "This opened something" }, { value: "build", label: "Build", mark: "△", hint: "I would make this real" }, { value: "help", label: "Help", mark: "+", hint: "I can contribute" }, { value: "question", label: "Ask", mark: "?", hint: "I have a useful question" }, { value: "respect", label: "Respect", mark: "◒", hint: "This is thoughtful work" }];

function initialsFor(name: string): string { return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "T"; }
function formatTime(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "Now" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date); }
function reactionLabel(reaction: PublicReaction): string { return { spark: "Spark", build: "Build", help: "Help", question: "Asked", respect: "Respect" }[reaction]; }
function focusedReaction(postId: string, personId: string): boolean { return typeof route.query.signal === "string" && route.query.signal === postId && typeof route.query.reaction === "string" && route.query.reaction === personId; }
function focusedComment(postId: string, commentId: string): boolean { return typeof route.query.signal === "string" && route.query.signal === postId && typeof route.query.comment === "string" && route.query.comment === commentId; }
function openPerson(id: string): void { void router.push(`/people/${id}`); }
function isOwnPost(post: PublicPost): boolean { return post.author.id === authState.user?.id; }
function isOwnComment(comment: PublicComment): boolean { return comment.author.id === authState.user?.id; }
function orderedComments(post: PublicPost): Array<{ comment: PublicComment; depth: number }> {
  const byParent = new Map<string | null, PublicComment[]>();
  const ids = new Set(post.comments.map((comment) => comment.id));
  for (const comment of post.comments) {
    const parentId = comment.parentCommentId && ids.has(comment.parentCommentId) ? comment.parentCommentId : null;
    const siblings = byParent.get(parentId) ?? [];
    siblings.push(comment);
    byParent.set(parentId, siblings);
  }
  for (const siblings of byParent.values()) siblings.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const ordered: Array<{ comment: PublicComment; depth: number }> = [];
  const visit = (parentId: string | null, depth: number): void => {
    for (const comment of byParent.get(parentId) ?? []) {
      ordered.push({ comment, depth });
      visit(comment.id, depth + 1);
    }
  };
  visit(null, 0);
  return ordered;
}
async function toggleComments(id: string): Promise<void> {
  if (openComments.value[id]) { openComments.value = { ...openComments.value, [id]: false }; return; }
  openComments.value = { ...openComments.value, [id]: true };
  try { replacePost((await getPublicPost(id)).post); } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not open these responses."; }
}
function replyTo(postId: string, commentId: string, name: string): void { openComments.value = { ...openComments.value, [postId]: true }; replyingTo.value = { ...replyingTo.value, [postId]: { id: commentId, name } }; }
function clearReply(postId: string): void { const remaining = { ...replyingTo.value }; delete remaining[postId]; replyingTo.value = remaining; }
function startPostEdit(post: PublicPost): void { postEdit.value = { id: post.id, kind: post.kind, title: post.title, body: post.body }; actionMessage.value = ""; }
function cancelPostEdit(): void { postEdit.value = null; }
function startCommentEdit(postId: string, comment: PublicComment): void { commentEdit.value = { postId, commentId: comment.id, body: comment.body }; actionMessage.value = ""; }
function cancelCommentEdit(): void { commentEdit.value = null; }
function openDiscovery(): void { void nextTick(() => discoveryInput.value?.focus()); }
function clearSearch(): void { searchResults.value = null; searchMessage.value = ""; searchQuery.value = ""; }
function connectionCopy(status: "self" | "none" | "pending-sent" | "pending-received" | "connected"): string { return { self: "Your profile", none: "", "pending-sent": "Invitation sent", "pending-received": "Review in Signals", connected: "Connected" }[status]; }
function replacePost(post: PublicPost): void { posts.value = posts.value.map((entry) => entry.id === post.id ? post : entry); }

async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [feed, signals] = await Promise.all([getTopFeed(), getTopNotifications()]);
    posts.value = feed.posts;
    unreadCount.value = signals.notifications.filter((notification) => !notification.readAt).length;
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not refresh the shared field."; } finally { loading.value = false; }
  await focusRequestedSignal();
}

async function publish(): Promise<void> {
  if (draftTitle.value.length < 3 || draftBody.value.length < 3) return;
  publishing.value = true;
  try {
    const { post } = await createPublicPost({ kind: draftKind.value, title: draftTitle.value, body: draftBody.value });
    posts.value = [post, ...posts.value];
    draftTitle.value = "";
    draftBody.value = "";
    draftKind.value = "idea";
    actionMessage.value = "Signal shared with the people who choose to look.";
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not share that signal."; } finally { publishing.value = false; }
}

async function search(): Promise<void> {
  if (searchQuery.value.length < 2) return;
  searching.value = true;
  searchMessage.value = "";
  try { searchResults.value = await searchTop(searchQuery.value); } catch (error) { searchResults.value = null; searchMessage.value = error instanceof Error ? error.message : "TOP could not complete that search."; } finally { searching.value = false; }
}

async function connectPerson(personId: string): Promise<void> {
  connectingPersonId.value = personId;
  try {
    await sendConnectionRequest(personId);
    if (searchResults.value) searchResults.value = { ...searchResults.value, people: searchResults.value.people.map((person) => person.id === personId ? { ...person, connectionStatus: "pending-sent" } : person) };
    actionMessage.value = "Connection invitation sent to their private Signals.";
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not send that connection invitation."; } finally { connectingPersonId.value = ""; }
}

async function openSearchedPost(post: PublicPost): Promise<void> {
  posts.value = [post, ...posts.value.filter((entry) => entry.id !== post.id)];
  await nextTick();
  document.getElementById(`public-post-${post.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function react(postId: string, reaction: PublicReaction): Promise<void> {
  reactingId.value = postId;
  try {
    const { post } = await reactToPublicPost(postId, reaction);
    posts.value = posts.value.map((entry) => entry.id === postId ? post : entry);
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not keep that response."; } finally { reactingId.value = ""; }
}

async function comment(postId: string): Promise<void> {
  const body = commentDrafts.value[postId]?.trim();
  if (!body) return;
  const reply = replyingTo.value[postId];
  commentingId.value = postId;
  try {
    await addPublicComment(postId, { body, parentCommentId: reply?.id ?? null });
    replacePost((await getPublicPost(postId)).post);
    commentDrafts.value = { ...commentDrafts.value, [postId]: "" };
    clearReply(postId);
    openComments.value = { ...openComments.value, [postId]: true };
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not add that response."; } finally { commentingId.value = ""; }
}

async function savePostEdit(postId: string): Promise<void> {
  if (!postEdit.value || postEdit.value.id !== postId || postEdit.value.title.length < 3 || postEdit.value.body.length < 3) return;
  savingPostId.value = postId;
  try {
    replacePost((await updatePublicPost(postId, { kind: postEdit.value.kind, title: postEdit.value.title, body: postEdit.value.body })).post);
    postEdit.value = null;
    actionMessage.value = "Your public signal was updated.";
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not save that signal."; } finally { savingPostId.value = ""; }
}

async function removePost(post: PublicPost): Promise<void> {
  if (!window.confirm(`Delete “${post.title}”? Its public responses and reactions will also be removed.`)) return;
  savingPostId.value = post.id;
  try {
    await deletePublicPost(post.id);
    posts.value = posts.value.filter((entry) => entry.id !== post.id);
    if (postEdit.value?.id === post.id) postEdit.value = null;
    actionMessage.value = "Your public signal was deleted.";
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not delete that signal."; } finally { savingPostId.value = ""; }
}

async function saveCommentEdit(postId: string, commentId: string): Promise<void> {
  if (!commentEdit.value || commentEdit.value.commentId !== commentId || !commentEdit.value.body.trim()) return;
  savingCommentId.value = commentId;
  try {
    await updatePublicComment(postId, commentId, { body: commentEdit.value.body.trim() });
    replacePost((await getPublicPost(postId)).post);
    commentEdit.value = null;
    actionMessage.value = "Your response was updated.";
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not save that response."; } finally { savingCommentId.value = ""; }
}

async function removeComment(post: PublicPost, commentId: string): Promise<void> {
  if (!window.confirm("Delete this response? Replies beneath it will also be removed.")) return;
  savingCommentId.value = commentId;
  try {
    await deletePublicComment(post.id, commentId);
    replacePost((await getPublicPost(post.id)).post);
    if (commentEdit.value?.commentId === commentId) commentEdit.value = null;
    clearReply(post.id);
    actionMessage.value = "Your response was deleted.";
  } catch (error) { actionMessage.value = error instanceof Error ? error.message : "TOP could not delete that response."; } finally { savingCommentId.value = ""; }
}

async function focusRequestedSignal(): Promise<void> {
  const signalId = typeof route.query.signal === "string" ? route.query.signal : "";
  const commentId = typeof route.query.comment === "string" ? route.query.comment : "";
  if (!signalId) return;
  if (!posts.value.some((post) => post.id === signalId) || commentId) {
    try { replacePost((await getPublicPost(signalId)).post); } catch { return; }
  }
  if (commentId) openComments.value = { ...openComments.value, [signalId]: true };
  await nextTick();
  document.getElementById(commentId ? `public-comment-${commentId}` : `public-post-${signalId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

onMounted(() => { void refresh(); });
const stopLiveSignals = subscribeToTopSignals(() => { void refreshNotifications(); });
onUnmounted(stopLiveSignals);
watch(() => [route.query.signal, route.query.comment, route.query.reaction], () => { void focusRequestedSignal(); });

async function refreshNotifications(): Promise<void> {
  try {
    const { notifications } = await getTopNotifications();
    unreadCount.value = notifications.filter((notification) => !notification.readAt).length;
  } catch {
    // A transient stream reconnect should not interrupt the shared field.
  }
}
</script>

<style scoped>
.top-page { background:radial-gradient(circle at 10% 12%,rgba(98,230,255,.14),transparent 22%),radial-gradient(circle at 86% 76%,rgba(156,124,255,.16),transparent 25%),#050611; color:var(--top-ink); min-height:100dvh; overflow:hidden; padding:22px clamp(18px,4vw,62px) 72px; position:relative; }.top-atmosphere i { border:1px solid rgba(98,230,255,.11); border-radius:50%; height:500px; pointer-events:none; position:absolute; width:500px; }.top-atmosphere i:first-child { left:-320px; top:220px; }.top-atmosphere i:nth-child(2) { height:690px; right:-410px; top:-180px; width:690px; }.top-atmosphere i:last-child { animation:soft-drift 14s ease-in-out infinite alternate; border-color:rgba(156,124,255,.17); bottom:-340px; height:620px; left:34%; width:620px; }.top-header { align-items:center; display:grid; gap:20px; grid-template-columns:auto 1fr auto; margin:0 auto; max-width:1380px; position:relative; z-index:1; }.top-brand { background:transparent; border:0; cursor:pointer; padding:0; }.top-brand img { display:block; filter:drop-shadow(0 0 15px rgba(98,230,255,.4)); height:64px; width:64px; }.top-header nav { display:flex; gap:7px; justify-content:center; }.top-header nav button { background:transparent; border:1px solid transparent; border-radius:999px; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:9px; padding:10px 12px; transition:.2s ease; }.top-header nav button:hover,.top-header nav .nav-active { background:rgba(98,230,255,.08); border-color:rgba(98,230,255,.3); color:var(--top-ink); }.top-header nav b { align-items:center; background:var(--top-pink); border-radius:50%; color:#07101d; display:inline-flex; font-size:7px; height:15px; justify-content:center; margin-left:4px; min-width:15px; }.self-card { align-items:center; background:rgba(8,13,32,.75); border:1px solid rgba(112,147,255,.28); border-radius:999px; color:var(--top-ink); cursor:pointer; display:flex; gap:8px; padding:5px 10px 5px 5px; }.self-card span { align-items:center; background:linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border-radius:50%; color:#07101d; display:flex; font-family:var(--top-display); font-size:12px; font-weight:800; height:29px; justify-content:center; width:29px; }.self-card strong { font-size:10px; }.self-card i { color:var(--top-cyan); font-style:normal; }.top-shell { display:grid; gap:clamp(24px,4vw,58px); grid-template-columns:minmax(190px,.65fr) minmax(0,1.25fr) minmax(180px,.55fr); margin:clamp(45px,8vw,105px) auto 0; max-width:1380px; position:relative; z-index:1; }.top-intro { padding-top:30px; }.top-intro > span,.composer-heading span,.top-principles > span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.16em; }.top-intro h1 { font-family:var(--top-display); font-size:clamp(38px,4.7vw,66px); font-weight:700; letter-spacing:-.085em; line-height:.88; margin:16px 0; }.top-intro h1 em { color:var(--top-lime); font-style:normal; }.top-intro > p,.top-principles p { color:var(--top-muted); font-size:12px; line-height:1.72; }.top-intro dl { display:grid; gap:1px; margin:29px 0 0; }.top-intro dl div { background:rgba(7,11,28,.45); border-left:1px solid rgba(98,230,255,.48); padding:11px; }.top-intro dt { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; letter-spacing:.13em; }.top-intro dd { color:var(--top-muted); font-size:10px; line-height:1.4; margin:5px 0 0; }.signal-composer,.post-card,.stream-state,.top-principles { background:linear-gradient(145deg,rgba(20,29,72,.82),rgba(7,10,28,.94)); border:1px solid rgba(126,156,255,.24); border-radius:23px 23px 7px 23px; box-shadow:inset 0 1px rgba(226,239,255,.07),0 24px 65px rgba(0,0,0,.22); }.signal-composer { display:grid; gap:12px; padding:clamp(20px,3vw,31px); }.composer-heading { align-items:baseline; display:flex; gap:12px; justify-content:space-between; }.composer-heading small { color:var(--top-muted); font-size:9px; text-align:right; }.kind-picker { display:flex; flex-wrap:wrap; gap:6px; }.kind-picker button { background:rgba(98,230,255,.04); border:1px solid rgba(126,156,255,.22); border-radius:999px; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:8px 9px; }.kind-picker button.selected { background:rgba(98,230,255,.13); border-color:var(--top-cyan); color:var(--top-ink); }.kind-picker i { color:var(--top-cyan); font-size:11px; font-style:normal; margin-right:5px; }.signal-composer input,.signal-composer textarea,.response-panel textarea { background:rgba(3,5,17,.67); border:1px solid rgba(126,156,255,.28); border-radius:12px 12px 4px 12px; color:var(--top-ink); font:inherit; outline:0; padding:12px; width:100%; }.signal-composer textarea { min-height:119px; resize:vertical; }.signal-composer input:focus,.signal-composer textarea:focus,.response-panel textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.signal-composer footer { align-items:center; display:flex; justify-content:space-between; }.signal-composer footer small { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.signal-composer footer button,.response-panel form button { align-items:center; background:linear-gradient(110deg,var(--top-cyan),var(--top-violet),var(--top-pink)); border:1px solid rgba(255,255,255,.35); border-radius:999px; color:#07101d; cursor:pointer; display:flex; font-size:9px; font-weight:900; gap:9px; padding:11px 13px; }.signal-composer footer button:disabled,.response-panel form button:disabled { cursor:wait; opacity:.55; }.post-list { display:grid; gap:15px; list-style:none; margin:16px 0 0; padding:0; }.post-card { padding:20px; }.post-person { align-items:center; background:transparent; border:0; color:inherit; cursor:pointer; display:grid; gap:10px; grid-template-columns:33px minmax(0,1fr) auto; padding:0; text-align:left; width:100%; }.post-person > span { align-items:center; background:linear-gradient(145deg,rgba(98,230,255,.75),rgba(156,124,255,.85)); border-radius:11px 11px 3px 11px; color:#07101d; display:flex; font-family:var(--top-display); font-size:11px; font-weight:800; height:33px; justify-content:center; }.post-person small,.post-person strong,.post-person em { display:block; }.post-person small { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; letter-spacing:.12em; text-transform:uppercase; }.post-person strong { color:var(--top-ink); font-size:11px; margin-top:3px; }.post-person em { color:var(--top-muted); font-size:8px; font-style:normal; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.post-person > i { color:var(--top-cyan); font-style:normal; }.post-card article { margin:19px 0; }.post-card article h2 { font-family:var(--top-display); font-size:27px; font-weight:700; letter-spacing:-.06em; line-height:.96; margin:0 0 9px; }.post-card article p { color:rgba(227,236,255,.76); font-size:12px; line-height:1.7; white-space:pre-wrap; }.reaction-row { display:flex; flex-wrap:wrap; gap:6px; }.reaction-row button { background:rgba(126,156,255,.05); border:1px solid rgba(126,156,255,.18); border-radius:999px; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:8px 9px; transition:.2s ease; }.reaction-row button:hover,.reaction-row button.selected { background:rgba(156,124,255,.14); border-color:var(--top-violet); color:var(--top-ink); }.reaction-row i { color:var(--top-lime); font-size:11px; font-style:normal; margin-right:4px; }.reaction-row b { color:var(--top-cyan); font-size:8px; margin-left:3px; }.response-space { border-top:1px solid rgba(126,156,255,.14); margin-top:16px; padding-top:12px; }.response-toggle { background:transparent; border:0; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:0; }.response-toggle span { color:var(--top-cyan); margin-left:4px; }.response-panel { margin-top:13px; }.comment-list { display:grid; gap:8px; list-style:none; margin:0 0 12px; padding:0; }.comment-list li { background:rgba(3,5,17,.34); border-left:1px solid var(--top-violet); padding:10px; }.comment-list button { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:0; }.comment-list p { color:var(--top-muted); font-size:10px; line-height:1.55; margin:5px 0; }.comment-list time,.no-comments { color:var(--top-muted); font-family:var(--top-mono); font-size:8px; }.no-comments { margin:0 0 11px; }.response-panel form { display:grid; gap:7px; }.response-panel textarea { min-height:70px; resize:vertical; }.response-panel form button { justify-self:end; padding:9px 11px; }.stream-state { color:var(--top-muted); font-size:12px; margin-top:16px; padding:28px; text-align:center; }.stream-state.empty i { color:var(--top-cyan); font-size:25px; font-style:normal; }.stream-state h2 { color:var(--top-ink); font-family:var(--top-display); font-size:28px; letter-spacing:-.06em; margin:10px 0 6px; }.stream-state p { line-height:1.6; margin:0; }.top-principles { align-self:start; margin-top:30px; padding:20px; }.top-principles h2 { font-family:var(--top-display); font-size:28px; font-weight:700; letter-spacing:-.06em; line-height:.95; margin:13px 0 9px; }.top-principles button { background:rgba(98,230,255,.09); border:1px solid rgba(98,230,255,.42); border-radius:999px; color:var(--top-cyan); cursor:pointer; display:block; font-family:var(--top-mono); font-size:8px; margin-top:17px; padding:10px 12px; text-align:left; width:100%; }.top-principles button.quiet { background:transparent; border-color:rgba(126,156,255,.25); color:var(--top-muted); margin-top:8px; }.top-principles button span { float:right; font-size:12px; } @keyframes soft-drift { to { transform:translate(28px,-24px) scale(1.06); } } @media (max-width:1050px) { .top-shell { grid-template-columns:minmax(190px,.6fr) minmax(0,1.25fr); }.top-principles { display:none; } } @media (max-width:720px) { .top-page { padding:16px 15px 52px; }.top-header { grid-template-columns:auto auto; }.top-header nav { grid-column:span 2; grid-row:2; justify-content:flex-start; overflow:auto; width:100%; }.top-header nav button { white-space:nowrap; }.self-card strong { display:none; }.top-shell { display:block; margin-top:37px; }.top-intro { padding:0 4px 28px; }.top-intro dl { display:none; }.top-intro h1 { font-size:46px; }.composer-heading { align-items:flex-start; flex-direction:column; gap:7px; }.composer-heading small { text-align:left; }.signal-composer footer { align-items:flex-start; flex-direction:column; gap:10px; }.signal-composer footer button { width:100%; justify-content:center; }.post-card { padding:16px; }.reaction-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); }.reaction-row button { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.reaction-row span { display:none; }.reaction-row i { margin:0; }.top-brand img { height:54px; width:54px; } } @media (prefers-reduced-motion:reduce) { .top-atmosphere i:last-child { animation:none; } }
.discovery-form { border-top:1px solid rgba(126,156,255,.18); display:grid; gap:8px; margin-top:27px; padding-top:20px; }.discovery-form label,.discovery-heading span,.discovery-results header span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; font-weight:800; letter-spacing:.13em; }.discovery-form > div { display:flex; gap:7px; }.discovery-form input { background:rgba(3,5,17,.62); border:1px solid rgba(126,156,255,.28); border-radius:11px 11px 4px 11px; color:var(--top-ink); font:inherit; font-size:11px; min-width:0; outline:0; padding:10px; width:100%; }.discovery-form input:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.discovery-form button,.discovery-results header > button { background:rgba(98,230,255,.1); border:1px solid rgba(98,230,255,.5); border-radius:999px; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:8px; font-weight:800; padding:9px 10px; }.discovery-form button:disabled { cursor:wait; opacity:.55; }.discovery-form small { color:var(--top-muted); font-size:9px; line-height:1.5; }.discovery-results { background:radial-gradient(circle at 92% 7%,rgba(156,124,255,.17),transparent 28%),linear-gradient(145deg,rgba(17,27,69,.86),rgba(5,8,25,.92)); border:1px solid rgba(98,230,255,.35); border-radius:21px 21px 6px 21px; display:grid; gap:17px; margin-bottom:16px; padding:20px; }.discovery-results header { align-items:flex-start; display:flex; justify-content:space-between; }.discovery-results header h2 { color:var(--top-ink); font-family:var(--top-display); font-size:29px; font-weight:700; letter-spacing:-.065em; line-height:.95; margin:7px 0 0; }.discovery-results > section { border-top:1px solid rgba(126,156,255,.16); padding-top:14px; }.discovery-heading { align-items:center; display:flex; justify-content:space-between; }.discovery-heading small { color:var(--top-lime); font-family:var(--top-mono); font-size:9px; }.discovery-message,.discovery-empty { color:var(--top-muted); font-size:11px; line-height:1.55; margin:0; }.people-results,.work-results { display:grid; gap:8px; list-style:none; margin:11px 0 0; padding:0; }.people-results li { align-items:center; background:rgba(3,5,17,.35); border:1px solid rgba(126,156,255,.14); border-radius:13px 13px 4px 13px; display:grid; gap:8px; grid-template-columns:minmax(0,1fr) auto; padding:8px; }.result-person { align-items:center; background:transparent; border:0; color:inherit; cursor:pointer; display:grid; gap:9px; grid-template-columns:29px minmax(0,1fr) auto; min-width:0; padding:0; text-align:left; }.result-person > i { align-items:center; background:linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border-radius:9px 9px 3px 9px; color:#07101d; display:flex; font-family:var(--top-display); font-size:10px; font-style:normal; font-weight:800; height:29px; justify-content:center; }.result-person strong,.result-person small { display:block; }.result-person strong { color:var(--top-ink); font-size:10px; }.result-person small { color:var(--top-muted); font-size:8px; margin-top:3px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.result-person > span { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; }.result-connect { background:var(--top-lime); border:1px solid var(--top-lime); border-radius:999px; color:#07101d; cursor:pointer; font-family:var(--top-mono); font-size:8px; font-weight:900; padding:8px 10px; }.result-connect:disabled { cursor:wait; opacity:.55; }.people-results em { color:var(--top-lime); font-family:var(--top-mono); font-size:7px; font-style:normal; padding:0 4px; text-align:right; }.work-results li { border-left:1px solid var(--top-violet); }.work-results button { background:rgba(3,5,17,.3); border:0; color:inherit; cursor:pointer; display:block; padding:11px; text-align:left; width:100%; }.work-results button:hover { background:rgba(98,230,255,.06); }.work-results small,.work-results strong,.work-results span { display:block; }.work-results small { color:var(--top-violet); font-family:var(--top-mono); font-size:7px; letter-spacing:.08em; text-transform:uppercase; }.work-results strong { color:var(--top-ink); font-family:var(--top-display); font-size:18px; letter-spacing:-.045em; margin-top:5px; }.work-results p { color:var(--top-muted); display:-webkit-box; font-size:10px; line-height:1.5; margin:6px 0; overflow:hidden; -webkit-box-orient:vertical; -webkit-line-clamp:2; }.work-results span { color:var(--top-cyan); font-family:var(--top-mono); font-size:8px; }.top-action-message { border-left:2px solid var(--top-lime); color:#d7fbd2; font-family:var(--top-mono); font-size:8px; line-height:1.5; margin:0; padding:7px 9px; } @media (max-width:720px) { .discovery-form > div { flex-direction:column; }.discovery-form button { width:100%; }.people-results li { align-items:flex-start; grid-template-columns:1fr; }.result-connect { justify-self:start; }.result-person { width:100%; } }
.post-person > span,.self-card span,.result-person > i,.comment-list button i { overflow:hidden; }.post-person > span img,.self-card span img,.result-person > i img,.comment-list button i img { height:100%; object-fit:cover; width:100%; }.post-person > span b,.self-card span b,.result-person > i b,.comment-list button i b { font:inherit; }.comment-list button { align-items:center; display:inline-flex; gap:6px; }.comment-list button i { align-items:center; background:linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border-radius:6px 6px 2px 6px; color:#07101d; display:inline-flex; font-family:var(--top-display); font-size:7px; font-style:normal; font-weight:800; height:18px; justify-content:center; width:18px; }
.reaction-row { gap:9px; margin-top:22px; }.reaction-row button { min-height:34px; padding:8px 12px; }.reaction-people { border-top:1px solid rgba(126,156,255,.14); display:grid; gap:9px; margin-top:16px; padding-top:14px; }.reaction-people > small { color:var(--top-muted); font-family:var(--top-mono); font-size:7px; letter-spacing:.12em; }.reaction-people > div { display:flex; flex-wrap:wrap; gap:7px; }.reaction-people button { align-items:center; background:rgba(98,230,255,.045); border:1px solid rgba(126,156,255,.18); border-radius:999px; color:var(--top-ink); cursor:pointer; display:inline-flex; gap:6px; max-width:100%; padding:5px 8px 5px 5px; transition:.2s ease; }.reaction-people button:hover,.reaction-people button.focused { background:rgba(98,230,255,.12); border-color:var(--top-cyan); }.reaction-people i { align-items:center; background:linear-gradient(145deg,var(--top-cyan),var(--top-violet)); border-radius:50%; color:#07101d; display:flex; font-family:var(--top-display); font-size:7px; font-style:normal; font-weight:800; height:21px; justify-content:center; overflow:hidden; width:21px; }.reaction-people i img { height:100%; object-fit:cover; width:100%; }.reaction-people span { font-size:9px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.reaction-people em { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; font-style:normal; } .comment-list li.focused { animation:comment-arrival 1.7s ease-in-out 2; border-left-color:var(--top-cyan); box-shadow:0 0 0 1px rgba(98,230,255,.26),0 0 28px rgba(98,230,255,.1); scroll-margin:35px; } @keyframes comment-arrival { 50% { transform:translateX(4px); } } @media (max-width:720px) { .reaction-row { gap:8px; }.reaction-people > div { gap:6px; }.reaction-people span { max-width:92px; }.reaction-people em { display:none; } }
.comment-list li footer { align-items:center; display:flex; justify-content:space-between; }.comment-list .comment-reply { color:var(--top-lime); font-family:var(--top-mono); font-size:7px; }.comment-list .comment-reply:hover { color:var(--top-cyan); }.reply-context { align-items:center; background:rgba(156,124,255,.1); border-left:1px solid var(--top-violet); color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:8px; gap:5px; margin:0; padding:7px 8px; }.reply-context strong { color:var(--top-ink); font-weight:800; }.reply-context button { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; font:inherit; margin-left:auto; padding:0; }
.post-ownership { display:flex; justify-content:flex-end; margin-top:11px; }.post-ownership button,.quiet-action,.danger-action { background:transparent; border:1px solid rgba(126,156,255,.28); border-radius:999px; color:var(--top-muted); cursor:pointer; font-family:var(--top-mono); font-size:8px; padding:7px 10px; }.post-ownership button:hover,.quiet-action:hover { border-color:var(--top-cyan); color:var(--top-cyan); }.post-editor,.comment-editor { background:rgba(4,7,22,.56); border:1px solid rgba(98,230,255,.24); border-radius:15px 15px 4px 15px; display:grid; gap:11px; margin:16px 0; padding:14px; }.post-editor label { display:grid; gap:6px; }.post-editor label span { color:var(--top-cyan); font-family:var(--top-mono); font-size:7px; letter-spacing:.12em; }.post-editor input,.post-editor select,.post-editor textarea,.comment-editor textarea { background:rgba(3,5,17,.72); border:1px solid rgba(126,156,255,.3); border-radius:10px 10px 3px 10px; color:var(--top-ink); font:inherit; font-size:11px; outline:0; padding:10px; width:100%; }.post-editor textarea,.comment-editor textarea { min-height:100px; resize:vertical; }.post-editor input:focus,.post-editor select:focus,.post-editor textarea:focus,.comment-editor textarea:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.post-editor footer,.comment-editor footer { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }.post-editor footer button,.comment-editor footer button { background:var(--top-lime); border:1px solid var(--top-lime); border-radius:999px; color:#07101d; cursor:pointer; font-family:var(--top-mono); font-size:8px; font-weight:900; padding:8px 11px; }.post-editor footer .quiet-action,.comment-editor footer .quiet-action { background:transparent; color:var(--top-muted); }.post-editor footer .danger-action { background:rgba(255,113,171,.09); border-color:rgba(255,113,171,.52); color:#ffb8d5; }.post-editor button:disabled,.comment-editor button:disabled { cursor:wait; opacity:.55; }.edited-marker { color:var(--top-muted); font-family:var(--top-mono); font-size:7px; }.comment-reply-item { margin-left:calc(var(--reply-depth) * 18px); position:relative; }.comment-reply-item::before { border-left:1px solid rgba(98,230,255,.35); border-bottom:1px solid rgba(98,230,255,.35); content:""; height:12px; left:-12px; position:absolute; top:0; width:8px; }.comment-actions { align-items:center; display:flex; gap:10px; }.comment-list .comment-delete { color:#ff9fc6; font-family:var(--top-mono); font-size:7px; }.comment-list .comment-delete:hover { color:var(--top-pink); }.comment-editor { margin:8px 0 0; }.comment-editor footer { margin:0; }.sr-only { height:1px; margin:-1px; overflow:hidden; padding:0; position:absolute; width:1px; clip:rect(0,0,0,0); white-space:nowrap; } @media (max-width:720px) { .post-editor footer,.comment-editor footer { justify-content:stretch; }.post-editor footer button,.comment-editor footer button { flex:1; }.comment-reply-item { margin-left:calc(var(--reply-depth) * 10px); }.comment-actions { gap:8px; } }
</style>
