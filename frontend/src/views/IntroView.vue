<template>
  <section class="intro">
    <div class="veil" aria-hidden="true"></div>
    <svg class="contours" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path d="M-50 702C191 512 400 881 646 622s377 20 552-159 300-152 510-43"></path>
      <path d="M-12 306c255-147 388 112 610-31s342-72 538 20 298-41 520-213"></path>
    </svg>

    <div class="content">
      <img class="hero-logo" :src="topLogoUrl" alt="TOP" />
      <span class="eyebrow">DON’T JUST BE ONLINE.</span>
      <h1>Move something<br /><em>real.</em></h1>
      <p>TOP is a field where a question becomes craft, a signal finds its circle, and an idea becomes work that leaves the world stronger than it found it.</p>
      <button class="enter" type="button" @click="enter">
        <span>Begin something real</span><i aria-hidden="true">↗</i>
      </button>
    </div>

    <p class="edge-note">LESS CONSUMPTION<br />MORE CREATION</p>
  </section>
</template>

<script setup lang="ts">
import { useExperienceStore } from "../stores/experience";
import { topLogoUrl } from "../lib/brand";

const experience = useExperienceStore();

function enter(): void {
  experience.enter();
}
</script>

<style scoped>
.intro { align-items:center; color:#f4ecdf; display:flex; inset:0; justify-content:center; overflow:hidden; position:fixed; z-index:1000; }.veil { background:radial-gradient(ellipse at 50% 49%,rgba(20,14,9,.46),rgba(15,12,9,.56) 50%,rgba(11,9,7,.83)),linear-gradient(110deg,rgba(15,12,9,.29),rgba(86,58,31,.15),rgba(15,12,9,.56)); inset:0; position:absolute; z-index:1; }.contours { animation:contour-drift 29s ease-in-out infinite alternate; fill:none; height:100%; opacity:.36; position:absolute; stroke:rgba(233,191,125,.32); stroke-width:1; width:100%; z-index:2; }
.masthead { align-items:center; display:flex; gap:10px; left:36px; position:absolute; top:31px; z-index:3; }.masthead > span:nth-child(2) { font-family:Georgia,"Times New Roman",serif; font-size:24px; font-weight:700; letter-spacing:.16em; }.masthead small { border-left:1px solid rgba(235,205,162,.27); color:rgba(239,224,201,.54); font-size:8px; font-weight:800; letter-spacing:.16em; margin-left:3px; padding-left:12px; }.seal { align-items:center; border:1px solid rgba(232,187,111,.73); border-radius:50%; display:flex; height:30px; justify-content:center; position:relative; width:30px; }.seal::before,.seal::after { background:rgba(236,197,129,.6); content:""; height:1px; position:absolute; width:17px; }.seal::after { transform:rotate(90deg); }.seal i { border:1px solid rgba(229,186,112,.67); border-radius:50%; height:8px; position:absolute; width:8px; }.seal i:first-child{transform:translate(5px,-5px)}.seal i:nth-child(2){border-color:rgba(164,190,139,.72);transform:translate(-5px,5px)}.seal b { background:#f5d5a1; border-radius:50%; box-shadow:0 0 10px #e2ab62; height:4px; width:4px; }
.content { animation:arrive 1.1s cubic-bezier(.2,.9,.3,1) both; max-width:760px; padding:30px; position:relative; text-align:center; text-shadow:0 2px 30px rgba(0,0,0,.48); z-index:3; }.eyebrow { color:#e4af66; font-size:9px; font-weight:850; letter-spacing:.2em; }.content h1 { font-family:Georgia,"Times New Roman",serif; font-size:clamp(48px,7vw,99px); font-weight:500; letter-spacing:-.075em; line-height:.93; margin:21px 0 19px; }.content h1 em { color:#edc683; font-weight:400; }.content p { color:rgba(242,228,207,.76); font-size:15px; line-height:1.7; margin:0 auto; max-width:560px; }.enter { align-items:center; background:linear-gradient(135deg,#f0cf8e,#c68548); border:1px solid rgba(255,231,183,.46); border-radius:999px; box-shadow:0 16px 42px rgba(179,109,42,.3),inset 0 1px rgba(255,248,228,.58); color:#2b1a0d; cursor:pointer; display:inline-flex; font-size:12px; font-weight:850; gap:18px; margin-top:34px; padding:15px 17px 15px 21px; text-shadow:none; transition:transform .25s ease,box-shadow .25s ease; }.enter:hover { box-shadow:0 20px 50px rgba(179,109,42,.44),inset 0 1px rgba(255,248,228,.58); transform:translateY(-4px); }.enter i { align-items:center; background:rgba(57,33,13,.13); border-radius:50%; display:flex; font-size:16px; font-style:normal; height:25px; justify-content:center; width:25px; }
.edge-note { bottom:32px; color:rgba(240,225,201,.37); font-size:8px; font-weight:750; letter-spacing:.17em; line-height:1.6; position:absolute; right:38px; text-align:right; z-index:3; }.edge-note::before { background:#d89a54; content:""; display:block; height:22px; margin:0 0 8px auto; opacity:.6; width:1px; }
@keyframes arrive { from { opacity:0; transform:translateY(29px); } to { opacity:1; transform:none; } } @keyframes contour-drift { to { transform:translate(15px,-9px) scale(1.02); } }
@media (max-width:640px) { .masthead { left:20px; top:22px; }.masthead small { display:none; }.content { padding:24px; }.content h1 { font-size:53px; }.edge-note { bottom:20px; right:22px; } }
@media (prefers-reduced-motion:reduce) { .content,.contours { animation:none; } }

.intro { color:var(--top-ink); isolation:isolate; }.veil { background:radial-gradient(ellipse at 50% 49%,rgba(19,21,62,.24),rgba(5,7,18,.46) 50%,rgba(2,3,12,.72)),linear-gradient(110deg,rgba(7,11,31,.22),rgba(76,76,218,.1),rgba(5,7,18,.48)); }.contours { stroke:rgba(110,151,255,.35); }.masthead > span:nth-child(2) { font-family:var(--top-display); font-weight:800; letter-spacing:.1em; }.masthead small { border-color:rgba(112,153,255,.32); color:rgba(195,210,249,.57); font-family:var(--top-mono); }.seal { border-color:rgba(98,230,255,.75); }.seal::before,.seal::after { background:rgba(156,124,255,.7); }.seal i { border-color:rgba(98,230,255,.72); }.seal i:nth-child(2) { border-color:rgba(217,255,113,.72); }.seal b { background:var(--top-lime); box-shadow:0 0 10px var(--top-lime); }.eyebrow { color:var(--top-cyan); font-family:var(--top-mono); }.content { text-shadow:0 4px 42px rgba(0,0,0,.72); }.content h1 { color:#f4f8ff; font-family:var(--top-display); font-weight:700; letter-spacing:-.085em; text-shadow:0 0 42px rgba(138,120,255,.22),0 4px 36px rgba(0,0,0,.7); }.content h1 em { color:#ad98ff; }.content p { color:rgba(225,234,255,.84); }.enter { background:linear-gradient(110deg,var(--top-cyan),#a08aff 52%,var(--top-pink)); box-shadow:0 16px 42px rgba(83,105,255,.36),inset 0 1px rgba(255,255,255,.65); color:#07101d; }.edge-note { color:rgba(192,207,248,.42); font-family:var(--top-mono); }.edge-note::before { background:linear-gradient(var(--top-cyan),var(--top-violet)); }
.hero-logo { display:block; filter:drop-shadow(0 0 22px rgba(98,230,255,.38)); height:142px; margin:0 auto 20px; object-fit:contain; width:142px; }
</style>
