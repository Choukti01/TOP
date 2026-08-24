<template>
  <section class="join-view">
    <ThreeField mode="identity" />
    <div class="join-orbit join-orbit--one" aria-hidden="true"></div>
    <div class="join-orbit join-orbit--two" aria-hidden="true"></div>

    <header class="join-header">
      <button class="join-brand" type="button" aria-label="Back to TOP home" @click="router.push('/')"><img :src="topLogoUrl" alt="TOP" /></button>
      <button class="join-home" type="button" @click="router.push('/')"><span>←</span> Home</button>
    </header>

    <main class="join-shell">
      <section class="join-intro">
        <span class="join-kicker">ENTER YOUR FIELD</span>
        <h1>{{ isRegistering ? 'Build a digital life that strengthens your real one.' : 'Your field is waiting.' }}</h1>
        <p>TOP remembers the work you choose to make real—your projects, evidence, reflections, and the people you will grow with.</p>
        <div class="join-principles"><span><i>✦</i> Your work stays yours</span><span><i>◌</i> No feeds engineered for distraction</span><span><i>↗</i> Built for real-world progress</span></div>
      </section>

      <section class="join-card" aria-live="polite">
        <div class="join-card-top"><span>{{ isRegistering ? 'A NEW BEGINNING' : 'WELCOME BACK' }}</span><small>{{ isRegistering ? '01 / 01' : 'RETURN' }}</small></div>
        <h2>{{ isRegistering ? 'Start with your name.' : 'Continue your work.' }}</h2>
        <p>{{ isRegistering ? 'No performance. Just a private place to begin.' : 'Sign in and return to the commitments you made.' }}</p>

        <form @submit.prevent="submit">
          <label v-if="isRegistering"><span>YOUR NAME</span><input v-model.trim="displayName" autocomplete="name" maxlength="48" placeholder="What should TOP call you?" /></label>
          <label><span>EMAIL</span><input v-model.trim="email" autocomplete="email" inputmode="email" type="email" placeholder="you@example.com" /></label>
          <label><span>PASSWORD</span><input v-model="password" :autocomplete="isRegistering ? 'new-password' : 'current-password'" minlength="10" maxlength="128" type="password" :placeholder="isRegistering ? 'At least 10 characters' : 'Your password'" /></label>
          <p v-if="isRegistering" class="password-note">Use 10+ characters. We never ask you to trade privacy for a pretty profile.</p>
          <p v-if="error" class="join-error">{{ error }}</p>
          <button class="join-submit" type="submit" :disabled="submitting || !canSubmit">{{ submitting ? 'Opening your field…' : (isRegistering ? 'Create my TOP field' : 'Enter my field') }} <span>↗</span></button>
        </form>

        <button class="join-switch" type="button" @click="switchMode">{{ isRegistering ? 'Already have a field?' : 'New to TOP?' }} <b>{{ isRegistering ? 'Sign in' : 'Create an account' }}</b></button>
      </section>
    </main>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import ThreeField from "../components/ThreeField.vue";
import { createTopAccount, signInToTop } from "../lib/auth";
import { topLogoUrl } from "../lib/brand";

const router = useRouter();
const route = useRoute();
const isRegistering = ref(true);
const displayName = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const submitting = ref(false);
const canSubmit = computed(() => email.value.includes("@") && password.value.length >= 10 && (!isRegistering.value || displayName.value.length >= 2));

function switchMode(): void {
  isRegistering.value = !isRegistering.value;
  error.value = "";
  password.value = "";
}

async function submit(): Promise<void> {
  if (!canSubmit.value) return;
  error.value = "";
  submitting.value = true;
  try {
    if (isRegistering.value) {
      await createTopAccount({ email: email.value, displayName: displayName.value, password: password.value });
      await router.push("/identity");
      return;
    }

    await signInToTop({ email: email.value, password: password.value });
    const next = typeof route.query.next === "string" && route.query.next.startsWith("/") ? route.query.next : "/workspace";
    await router.push(next);
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : "TOP could not open your field right now.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.join-view { align-items:center; background:radial-gradient(circle at 15% 14%,rgba(98,230,255,.15),transparent 25%),radial-gradient(circle at 88% 78%,rgba(156,124,255,.17),transparent 28%),#050611; color:var(--top-ink); display:flex; justify-content:center; min-height:100dvh; overflow:hidden; padding:112px 32px 62px; position:relative; }.join-header { align-items:center; display:flex; justify-content:space-between; left:clamp(18px,5vw,65px); position:absolute; right:clamp(18px,5vw,65px); top:25px; z-index:2; }.join-brand,.join-home { background:transparent; border:0; cursor:pointer; }.join-brand img { display:block; filter:drop-shadow(0 0 15px rgba(98,230,255,.36)); height:67px; object-fit:contain; width:67px; }.join-home { align-items:center; border:1px solid rgba(125,157,255,.25); border-radius:999px; color:var(--top-muted); display:flex; font-family:var(--top-mono); font-size:9px; gap:8px; letter-spacing:.08em; padding:10px 14px; transition:.2s ease; }.join-home:hover { border-color:var(--top-cyan); color:var(--top-ink); transform:translateX(-3px); }.join-home span { color:var(--top-cyan); font-size:14px; }.join-shell { align-items:center; display:grid; gap:clamp(40px,9vw,145px); grid-template-columns:minmax(0,1fr) minmax(350px,480px); max-width:1160px; position:relative; width:100%; z-index:1; }.join-kicker,.join-card-top span,.join-card label span { color:var(--top-cyan); font-family:var(--top-mono); font-size:9px; font-weight:800; letter-spacing:.17em; text-transform:uppercase; }.join-intro h1 { font-family:var(--top-display); font-size:clamp(49px,6vw,82px); font-weight:700; letter-spacing:-.085em; line-height:.9; margin:18px 0; max-width:600px; }.join-intro > p { color:var(--top-muted); font-size:15px; line-height:1.75; max-width:540px; }.join-principles { display:grid; gap:12px; margin-top:32px; }.join-principles span { color:rgba(229,237,255,.78); font-size:12px; }.join-principles i { color:var(--top-lime); font-family:var(--top-mono); font-style:normal; margin-right:9px; }.join-card { background:linear-gradient(145deg,rgba(20,28,69,.88),rgba(7,9,27,.94)); border:1px solid rgba(128,160,255,.32); border-radius:28px 28px 8px 28px; box-shadow:0 34px 100px rgba(0,0,0,.43),inset 0 1px rgba(235,244,255,.1); overflow:hidden; padding:clamp(28px,4vw,44px); position:relative; }.join-card::before { background:radial-gradient(circle,rgba(98,230,255,.22),transparent 68%); content:""; height:220px; position:absolute; right:-90px; top:-105px; width:220px; }.join-card-top { display:flex; justify-content:space-between; position:relative; }.join-card-top small { color:var(--top-muted); font-family:var(--top-mono); font-size:9px; }.join-card h2 { font-family:var(--top-display); font-size:39px; font-weight:700; letter-spacing:-.07em; line-height:.92; margin:20px 0 10px; position:relative; }.join-card > p { color:var(--top-muted); font-size:13px; line-height:1.6; position:relative; }.join-card form { display:grid; gap:14px; margin-top:30px; position:relative; }.join-card label { display:grid; gap:8px; }.join-card input { background:rgba(3,5,17,.68); border:1px solid rgba(127,159,255,.28); border-radius:13px 13px 4px 13px; color:var(--top-ink); font:inherit; outline:0; padding:14px; transition:.2s ease; }.join-card input:focus { border-color:var(--top-cyan); box-shadow:0 0 0 3px rgba(98,230,255,.1); }.password-note { color:var(--top-muted); font-size:10px; line-height:1.55; margin:0; }.join-error { background:rgba(255,113,171,.09); border-left:2px solid var(--top-pink); color:#ffd7e7; font-size:11px; line-height:1.5; margin:0; padding:10px; }.join-submit { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#a08aff 54%,var(--top-pink)); border:1px solid rgba(255,255,255,.43); border-radius:999px; box-shadow:0 17px 43px rgba(85,107,255,.35),inset 0 1px rgba(255,255,255,.65); color:#07101d; cursor:pointer; display:flex; font-size:11px; font-weight:900; justify-content:space-between; margin-top:7px; padding:14px 15px 14px 20px; transition:.2s ease; }.join-submit:hover:not(:disabled) { transform:translateY(-3px); }.join-submit:disabled { cursor:wait; opacity:.65; }.join-submit span { align-items:center; background:rgba(4,8,24,.13); border-radius:50%; display:flex; font-size:16px; height:25px; justify-content:center; width:25px; }.join-switch { background:transparent; border:0; color:var(--top-muted); cursor:pointer; font-size:11px; margin-top:24px; padding:0; position:relative; }.join-switch b { color:var(--top-cyan); font-weight:700; margin-left:4px; }.join-orbit { border:1px solid rgba(98,230,255,.12); border-radius:50%; pointer-events:none; position:absolute; }.join-orbit--one { animation:join-orbit 16s ease-in-out infinite alternate; height:620px; left:-260px; top:-300px; width:620px; }.join-orbit--two { animation:join-orbit 20s ease-in-out infinite alternate-reverse; bottom:-360px; height:720px; right:-260px; width:720px; } @keyframes join-orbit { to { transform:translate(45px,25px) scale(1.08); } } @media (max-width:820px) { .join-view { align-items:flex-start; overflow:auto; padding:118px 20px 46px; }.join-shell { grid-template-columns:1fr; max-width:570px; }.join-intro h1 { font-size:clamp(47px,12vw,68px); }.join-principles { margin:24px 0 6px; }.join-card { padding:28px 24px; }.join-header { left:16px; right:16px; top:16px; }.join-brand img { height:55px; width:55px; } } @media (prefers-reduced-motion:reduce) { .join-orbit { animation:none; } }
</style>
