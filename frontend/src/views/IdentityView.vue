<template>
  <section class="identity">
    <ThreeField mode="identity" />

    <svg class="contours" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-18 710c245-181 366 93 598-63s384 88 602-82 250-55 463-193"></path>
      <ellipse cx="1190" cy="321" rx="305" ry="205"></ellipse>
    </svg>

    <header class="masthead">
      <button class="brand" type="button" aria-label="Back to TOP home" @click="router.push('/')"><img src="/top-logo-transparent.png" alt="TOP" /></button>
      <p class="route-label">YOUR FIELD</p>
      <button class="home-link" type="button" @click="router.push('/')"><span>←</span> Back to home</button>
    </header>

    <main class="panel">
      <div class="progress" aria-label="Onboarding progress">
        <span v-for="(label, index) in progressLabels" :key="label" :class="{ active: index + 1 <= step, current: index + 1 === step }">
          <i></i><b>0{{ index + 1 }}</b>{{ label }}
        </span>
      </div>

      <Transition name="question" mode="out-in">
        <div :key="step" class="question">
          <template v-if="step === 1">
            <span class="eyebrow">STEP 01 / DIRECTION</span>
            <h1>What feels worth<br /><em>moving toward?</em></h1>
            <p>You do not need a permanent label. Choose the living direction that matters most to you right now.</p>
            <div class="cards direction-cards">
              <button v-for="item in directions" :key="item.title" class="choice" type="button" @click="chooseDirection(item.title)">
                <span><strong>{{ item.title }}</strong><small>{{ item.copy }}</small></span><i>↗</i>
              </button>
            </div>
          </template>

          <template v-else-if="step === 2">
            <span class="eyebrow">STEP 02 / MOMENTUM</span>
            <h1>What would make<br /><em>it real?</em></h1>
            <p>A direction grows through small, deliberate movement. Pick the next kind of support you need.</p>
            <div class="cards direction-cards">
              <button v-for="item in nextMoves" :key="item.title" class="choice" type="button" @click="chooseNextMove(item.title)">
                <span><strong>{{ item.title }}</strong><small>{{ item.copy }}</small></span><i>↗</i>
              </button>
            </div>
          </template>

          <template v-else-if="step === 3">
            <span class="eyebrow">STEP 03 / RHYTHM</span>
            <h1>What pace feels<br /><em>honest?</em></h1>
            <p>This is not a promise to hurry. It is a way to keep showing up for the life you want to build.</p>
            <div class="cards rhythm-cards">
              <button v-for="item in rhythms" :key="item.title" class="choice" type="button" @click="chooseRhythm(item.title)">
                <span><strong>{{ item.title }}</strong><small>{{ item.copy }}</small></span><i>↗</i>
              </button>
            </div>
          </template>

          <template v-else>
            <span class="eyebrow">STEP 04 / NAME</span>
            <h1>Name this<br /><em>season.</em></h1>
            <p>Give your field a phrase you will recognize when you return. It stays on this device and can be changed later.</p>
            <label class="name-input"><span>YOUR FIELD</span><input v-model.trim="worldName" placeholder="Example: A more deliberate life" maxlength="48" @keydown.enter="createWorld" /></label>
            <div class="actions">
              <button class="previous" type="button" @click="goBack">← Previous question</button>
              <button class="create" type="button" :disabled="worldName.trim() === ''" @click="createWorld">Open my field <span>↗</span></button>
            </div>
          </template>

          <button v-if="step > 1 && step < 4" class="previous" type="button" @click="goBack">← Previous question</button>
        </div>
      </Transition>
    </main>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import ThreeField from "../components/ThreeField.vue";
import "./IdentityDirections.css";

type DirectionCard = { title: string; copy: string };

const router = useRouter();
const step = ref(1);
const direction = ref("");
const nextMove = ref("");
const rhythm = ref("");
const worldName = ref("");

const progressLabels = ["Direction", "Momentum", "Rhythm", "Name"];
const directions: DirectionCard[] = [
  { title: "Build something real", copy: "Turn an idea into work you can point to." },
  { title: "Learn deeply", copy: "Follow a question, a craft, or a new way of seeing." },
  { title: "Reflect and reset", copy: "Make room for clarity, healing, and a truer next step." },
  { title: "Create and express", copy: "Give form to a story, image, sound, or point of view." },
  { title: "Connect with people", copy: "Find your circle and grow stronger together." },
  { title: "Care for body and mind", copy: "Build energy, resilience, and a life that can hold you." },
  { title: "Help a community", copy: "Put your attention into people, place, or a shared challenge." },
  { title: "Lead a venture", copy: "Bring a team, service, or independent path into motion." },
  { title: "Follow my own direction", copy: "Start without a category and define the path as you go." }
];
const nextMoves: DirectionCard[] = [
  { title: "A small practice", copy: "A repeatable habit I can return to every day or week." },
  { title: "A meaningful project", copy: "One tangible piece of work with a real finish line." },
  { title: "A new skill", copy: "Guidance, study, and space to become more capable." },
  { title: "People around me", copy: "A circle, mentor, collaborator, or person to help." },
  { title: "Space to think", copy: "Time to reflect before deciding what comes next." },
  { title: "A contribution", copy: "A practical way to make someone else's day or place better." }
];
const rhythms: DirectionCard[] = [
  { title: "Start gently", copy: "Keep it light, kind, and easy to sustain." },
  { title: "Stay consistent", copy: "Show up in small ways and let the change compound." },
  { title: "Make a focused push", copy: "Give this a clear season of attention and energy." },
  { title: "Leave room to evolve", copy: "Explore without needing the whole map in advance." },
  { title: "Do it with others", copy: "Let accountability and shared care carry the work." },
  { title: "Make it part of life", copy: "Build a direction that can become a lasting practice." }
];

function chooseDirection(value: string): void {
  direction.value = value;
  step.value = 2;
}

function chooseNextMove(value: string): void {
  nextMove.value = value;
  step.value = 3;
}

function chooseRhythm(value: string): void {
  rhythm.value = value;
  step.value = 4;
}

function goBack(): void {
  if (step.value > 1) {
    step.value -= 1;
    return;
  }

  router.push("/");
}

function createWorld(): void {
  const name = worldName.value.trim();

  if (!name) return;

  localStorage.setItem("top-world-name", name);
  localStorage.setItem("top-identity", JSON.stringify({
    direction: direction.value,
    nextMove: nextMove.value,
    rhythm: rhythm.value
  }));

  router.push("/generating");
}
</script>

<style>
.identity { align-items:center; background:radial-gradient(ellipse at 13% 16%,rgba(145,91,46,.2),transparent 33%),radial-gradient(circle at 88% 84%,rgba(101,129,78,.15),transparent 32%),#15120f; color:#f4ebde; display:flex; justify-content:center; min-height:100dvh; overflow:hidden; padding:142px 52px 72px; position:relative; }.contours { animation:contour-drift 32s ease-in-out infinite alternate; fill:none; height:100%; inset:0; opacity:.45; position:absolute; stroke:rgba(229,185,119,.2); stroke-width:1; width:100%; }.contours ellipse { stroke:rgba(156,184,125,.18); }
.masthead { align-items:center; display:grid; grid-template-columns:1fr auto 1fr; left:52px; position:absolute; right:52px; top:34px; z-index:1; }.brand { background:transparent; border:0; color:#f5ebde; cursor:pointer; font-family:Georgia,"Times New Roman",serif; font-size:24px; font-weight:700; justify-self:start; letter-spacing:.19em; padding:8px 0; }.route-label { color:rgba(238,222,198,.45); font-size:9px; font-weight:800; justify-self:center; letter-spacing:.24em; margin:0; }.home-link { align-items:center; background:rgba(30,24,18,.42); border:1px solid rgba(233,205,164,.17); border-radius:999px; color:rgba(245,231,211,.78); cursor:pointer; display:flex; font-size:10px; font-weight:800; gap:9px; justify-self:end; letter-spacing:.04em; padding:10px 14px; transition:border-color .2s ease,color .2s ease,transform .2s ease; }.home-link span { color:#e7b36c; font-size:14px; }.home-link:hover { border-color:rgba(230,177,98,.48); color:#f5eadc; transform:translateX(-3px); }
.brand img { display:block; filter:drop-shadow(0 0 10px rgba(98,230,255,.34)); height:58px; object-fit:contain; width:58px; }
.panel { max-width:1240px; position:relative; width:100%; }.progress { align-items:center; display:flex; gap:28px; margin-bottom:50px; }.progress span { align-items:center; color:rgba(234,217,191,.32); display:flex; font-size:9px; font-weight:750; gap:8px; letter-spacing:.12em; text-transform:uppercase; }.progress i { background:rgba(231,199,154,.18); border-radius:50%; height:6px; width:6px; }.progress b { font-family:Georgia,serif; font-size:11px; font-weight:400; }.progress span.active { color:#e8bc79; }.progress span.active i { background:#e3ad64; box-shadow:0 0 12px rgba(227,173,100,.63); }.progress span.current { color:#f3d6a0; }.question { max-width:1180px; }.eyebrow { color:#e3ad61; font-size:9px; font-weight:850; letter-spacing:.2em; }.question h1 { font-family:Georgia,"Times New Roman",serif; font-size:clamp(50px,6vw,88px); font-weight:500; letter-spacing:-.078em; line-height:.9; margin:19px 0; }.question h1 em { color:#ecc481; font-weight:400; }.question > p { color:rgba(235,220,198,.67); font-size:15px; line-height:1.7; margin:0 0 36px; max-width:610px; }.cards { display:grid; gap:14px; }.direction-cards { grid-template-columns:repeat(3,minmax(0,1fr)); }.rhythm-cards { grid-template-columns:repeat(3,minmax(0,1fr)); max-width:1000px; }.choice { align-items:stretch; background:linear-gradient(145deg,rgba(48,38,26,.75),rgba(25,20,15,.84)); border:1px solid rgba(233,205,164,.14); border-radius:21px 21px 5px 21px; color:#f0e5d6; cursor:pointer; display:flex; font-family:Georgia,"Times New Roman",serif; justify-content:space-between; min-height:148px; padding:21px; text-align:left; transition:transform .22s ease,border-color .22s ease,background .22s ease; }.choice > span { display:flex; flex-direction:column; gap:12px; max-width:250px; }.choice strong { font-size:21px; font-weight:500; letter-spacing:-.035em; line-height:1.02; }.choice small { color:rgba(235,220,198,.58); font-family:Inter,Aptos,"Segoe UI",sans-serif; font-size:11px; line-height:1.55; }.choice:hover { background:linear-gradient(145deg,rgba(83,58,31,.85),rgba(31,24,16,.94)); border-color:rgba(230,177,98,.48); transform:translateY(-5px); }.choice i { align-self:flex-end; color:#e7b36c; font-family:Arial,sans-serif; font-size:15px; font-style:normal; }.name-input { background:linear-gradient(145deg,rgba(47,37,25,.78),rgba(24,19,14,.83)); border:1px solid rgba(234,205,164,.15); border-radius:22px 22px 5px 22px; display:block; max-width:760px; padding:21px; }.name-input span { color:rgba(234,215,188,.47); display:block; font-size:8px; font-weight:850; letter-spacing:.17em; }.name-input input { background:transparent; border:0; color:#f5eadc; font-family:Georgia,"Times New Roman",serif; font-size:30px; letter-spacing:-.03em; margin-top:8px; outline:0; padding:0; width:100%; }.name-input input::placeholder { color:rgba(237,219,191,.3); }.actions { align-items:center; display:flex; gap:20px; margin-top:24px; }.previous { background:transparent; border:0; color:rgba(239,221,196,.57); cursor:pointer; display:block; font-size:10px; font-weight:800; letter-spacing:.04em; margin-top:27px; padding:7px 0; transition:color .2s ease,transform .2s ease; }.actions .previous { margin-top:0; }.previous:hover { color:#eabd79; transform:translateX(-3px); }.create { align-items:center; background:linear-gradient(135deg,#efd08d,#c68548); border:1px solid rgba(255,227,175,.42); border-radius:999px; box-shadow:0 14px 38px rgba(188,117,47,.27),inset 0 1px rgba(255,248,225,.56); color:#291a0e; cursor:pointer; display:flex; font-size:11px; font-weight:850; gap:18px; justify-content:center; padding:14px 15px 14px 19px; transition:transform .2s ease,box-shadow .2s ease; }.create:hover:not(:disabled) { box-shadow:0 18px 44px rgba(188,117,47,.4),inset 0 1px rgba(255,248,225,.56); transform:translateY(-3px); }.create span { align-items:center; background:rgba(55,33,15,.13); border-radius:50%; display:flex; font-size:15px; height:24px; justify-content:center; width:24px; }.create:disabled { cursor:not-allowed; opacity:.4; }
.question-enter-active,.question-leave-active { transition:opacity .24s ease,transform .28s ease; }.question-enter-from { opacity:0; transform:translateY(15px); }.question-leave-to { opacity:0; transform:translateY(-12px); }
@keyframes contour-drift { to { transform:translate(15px,-8px) scale(1.02); } } @media (max-width:820px) { .identity { align-items:flex-start; overflow:auto; padding:115px 22px 52px; }.masthead { left:22px; right:22px; top:22px; }.route-label { display:none; }.brand { font-size:21px; }.home-link { padding:8px 11px; }.panel { max-width:620px; }.progress { gap:13px; margin-bottom:34px; }.progress span { font-size:0; gap:5px; }.progress b { font-size:10px; }.direction-cards,.rhythm-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }.choice { min-height:130px; padding:17px; }.choice strong { font-size:18px; }.question h1 { font-size:clamp(47px,12vw,68px); }.question > p { font-size:14px; margin-bottom:29px; }.name-input input { font-size:24px; }.actions { align-items:flex-start; flex-direction:column-reverse; gap:11px; } } @media (max-width:470px) { .direction-cards,.rhythm-cards { grid-template-columns:1fr; }.progress { gap:10px; }.home-link { font-size:9px; }.choice { min-height:112px; } } @media (prefers-reduced-motion:reduce) { .contours { animation:none; } }
</style>
