<template>
  <section class="verify-view">
    <ThreeField mode="identity" />
    <header><button class="brand" type="button" aria-label="Back to TOP home" @click="router.push('/')"><img :src="topLogoUrl" alt="TOP" /></button><button class="home" type="button" @click="router.push('/')">← Home</button></header>
    <main class="verify-shell">
      <section class="verify-intro"><span>SECURE YOUR FIELD</span><h1>One small check.<br /><em>A safer place to build.</em></h1><p>Verification protects your name, your project circles, and the people you meet through TOP. Your work stays waiting for you.</p></section>
      <section class="verify-card" aria-live="polite">
        <template v-if="loading"><span class="eyebrow">VERIFYING</span><h2>Checking your secure link.</h2><p>TOP is confirming this one-time action.</p></template>
        <template v-else-if="completed"><span class="eyebrow">VERIFIED</span><h2>Your field is open.</h2><p>{{ notice }}</p><button class="primary" type="button" @click="continueToTop">Continue to TOP <i>↗</i></button></template>
        <template v-else>
          <span class="eyebrow">EMAIL VERIFICATION</span><h2>Check your inbox.</h2><p>We sent a one-time verification link to <strong>{{ authState.user?.email }}</strong>. Open it in this browser, then your TOP field will unlock.</p>
          <p v-if="notice" class="notice">{{ notice }}</p><p v-if="error" class="error">{{ error }}</p>
          <div class="actions"><button class="primary" type="button" :disabled="resending" @click="resend">{{ resending ? 'Sending…' : 'Send another link' }} <i>↗</i></button><button class="quiet" type="button" @click="editingEmail = !editingEmail">Used the wrong email?</button></div>
          <form v-if="editingEmail" class="email-form" @submit.prevent="changeEmail"><label><span>NEW EMAIL</span><input v-model.trim="email" autocomplete="email" type="email" /></label><label><span>CURRENT PASSWORD</span><input v-model="password" autocomplete="current-password" type="password" /></label><button class="primary" type="submit" :disabled="changing || !email.includes('@') || !password">{{ changing ? 'Updating…' : 'Use this email' }} <i>↗</i></button></form>
          <button class="sign-out" type="button" @click="signOut">Sign out</button>
        </template>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import ThreeField from "../components/ThreeField.vue";
import { authState, leaveTop, restoreTopSession, verifyTopEmail } from "../lib/auth";
import { changeTopUnverifiedEmail, resendTopEmailVerification } from "../lib/api";
import { topLogoUrl } from "../lib/brand";

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const completed = ref(false);
const resending = ref(false);
const changing = ref(false);
const editingEmail = ref(false);
const email = ref("");
const password = ref("");
const notice = ref("");
const error = ref("");

const initialDelivery = typeof route.query.delivery === "string" ? route.query.delivery : "";

function nextPath(): string {
  const next = typeof route.query.next === "string" ? route.query.next : "/top";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/top";
}

async function continueToTop(): Promise<void> { await router.replace(nextPath()); }

async function resend(): Promise<void> {
  resending.value = true; error.value = "";
  try { notice.value = (await resendTopEmailVerification()).message; }
  catch (reason) { error.value = reason instanceof Error ? reason.message : "TOP could not send a verification link right now."; }
  finally { resending.value = false; }
}

async function changeEmail(): Promise<void> {
  changing.value = true; error.value = "";
  try {
    const result = await changeTopUnverifiedEmail({ email: email.value, password: password.value });
    authState.user = result.user;
    notice.value = result.message;
    editingEmail.value = false;
    password.value = "";
  } catch (reason) { error.value = reason instanceof Error ? reason.message : "TOP could not update that email."; }
  finally { changing.value = false; }
}

async function signOut(): Promise<void> { await leaveTop(); await router.replace("/"); }

onMounted(async () => {
  const token = typeof route.query.verify === "string" ? route.query.verify : "";
  try {
    if (token) {
      const user = await verifyTopEmail(token);
      completed.value = true;
      notice.value = `${user.displayName}, your email is verified. Your field is ready.`;
      return;
    }
    const user = await restoreTopSession();
    if (!user) { await router.replace({ path: "/join", query: { next: nextPath() } }); return; }
    if (user.emailVerified) { await router.replace(nextPath()); return; }
    email.value = user.email;
    if (initialDelivery && initialDelivery !== "sent") {
      error.value = "TOP saved your account safely, but the verification message was not delivered. Use “Send another link” to try again.";
    }
  } catch (reason) { error.value = reason instanceof Error ? reason.message : "That verification link is no longer valid. Request a new one and try again."; }
  finally { loading.value = false; }
});
</script>

<style scoped>
.verify-view { align-items:center; background:radial-gradient(circle at 14% 13%,rgba(98,230,255,.15),transparent 25%),radial-gradient(circle at 86% 80%,rgba(156,124,255,.17),transparent 28%),#050611; color:var(--top-ink); display:flex; min-height:100dvh; overflow:hidden; padding:96px 28px 50px; position:relative; }.verify-view header { align-items:center; display:flex; justify-content:space-between; left:clamp(18px,5vw,65px); position:absolute; right:clamp(18px,5vw,65px); top:25px; z-index:2; }.brand,.home,.quiet,.sign-out { background:transparent; border:0; color:var(--top-muted); cursor:pointer; }.brand img { display:block; filter:drop-shadow(0 0 15px rgba(98,230,255,.36)); height:64px; object-fit:contain; width:64px; }.home { border:1px solid rgba(125,157,255,.25); border-radius:999px; font:700 9px var(--top-mono); letter-spacing:.08em; padding:10px 14px; }.home:hover,.quiet:hover,.sign-out:hover { color:var(--top-cyan); }.verify-shell { align-items:center; display:grid; gap:clamp(38px,9vw,140px); grid-template-columns:minmax(0,1fr) minmax(330px,460px); margin:auto; max-width:1120px; position:relative; width:100%; z-index:1; }.verify-intro > span,.eyebrow,.email-form label span { color:var(--top-cyan); font:800 9px var(--top-mono); letter-spacing:.17em; text-transform:uppercase; }.verify-intro h1 { font-family:var(--top-display); font-size:clamp(48px,6vw,78px); letter-spacing:-.085em; line-height:.9; margin:18px 0; }.verify-intro h1 em { color:var(--top-cyan); font-style:normal; }.verify-intro p { color:var(--top-muted); line-height:1.75; max-width:500px; }.verify-card { background:linear-gradient(145deg,rgba(20,28,69,.9),rgba(7,9,27,.96)); border:1px solid rgba(128,160,255,.32); border-radius:28px 28px 8px 28px; box-shadow:0 34px 100px rgba(0,0,0,.43),inset 0 1px rgba(235,244,255,.1); padding:clamp(28px,4vw,42px); }.verify-card h2 { font-family:var(--top-display); font-size:40px; letter-spacing:-.07em; line-height:.92; margin:20px 0 12px; }.verify-card p { color:var(--top-muted); font-size:13px; line-height:1.65; }.verify-card p strong { color:var(--top-ink); overflow-wrap:anywhere; }.actions { display:grid; gap:14px; margin-top:28px; }.primary { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#a08aff 54%,var(--top-pink)); border:1px solid rgba(255,255,255,.43); border-radius:999px; color:#07101d; cursor:pointer; display:flex; font-size:11px; font-weight:900; justify-content:space-between; padding:14px 18px 14px 20px; transition:.2s ease; }.primary:hover:not(:disabled) { transform:translateY(-2px); }.primary:disabled { cursor:wait; opacity:.65; }.primary i { font-size:17px; font-style:normal; }.quiet,.sign-out { font-size:11px; text-align:left; text-decoration:underline; text-underline-offset:4px; }.sign-out { margin-top:27px; }.notice,.error { border-left:2px solid; font-size:11px !important; margin:18px 0 0; padding:10px; }.notice { background:rgba(180,255,123,.08); border-color:var(--top-lime); color:#e2ffd1 !important; }.error { background:rgba(255,113,171,.09); border-color:var(--top-pink); color:#ffd7e7 !important; }.email-form { display:grid; gap:14px; margin-top:22px; }.email-form label { display:grid; gap:8px; }.email-form input { background:rgba(3,5,17,.68); border:1px solid rgba(127,159,255,.28); border-radius:13px 13px 4px 13px; color:var(--top-ink); font:inherit; outline:0; padding:14px; }.email-form input:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); } @media (max-width:820px) { .verify-view { align-items:flex-start; overflow:auto; padding:115px 20px 46px; }.verify-shell { grid-template-columns:1fr; max-width:570px; }.verify-intro h1 { font-size:clamp(46px,12vw,66px); }.verify-view header { left:16px; right:16px; top:16px; }.brand img { height:55px; width:55px; }.verify-card { padding:28px 24px; } }
</style>
