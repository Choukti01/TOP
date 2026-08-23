<template>
  <section class="sound-lab" :class="{ playing }">
    <header><div><span>SOUND LAB</span><h3>Give the work<br />an atmosphere.</h3><p>Create a simple focus soundscape inside TOP. Nothing streams, tracks, or pulls you elsewhere.</p></div><button class="play" type="button" @click="toggle"><i>{{ playing ? 'Ⅱ' : '▶' }}</i>{{ playing ? 'Pause the field' : 'Start the field' }}</button></header>
    <div class="sound-stage"><div class="wave wave-one"></div><div class="wave wave-two"></div><div class="wave wave-three"></div><div class="sound-orb"><i></i><i></i><b></b></div><p>{{ playing ? 'THE FIELD IS BREATHING' : 'SILENCE IS AVAILABLE' }}</p></div>
    <div class="sound-controls"><label>TEXTURE<select v-model="texture" :disabled="playing"><option value="orbit">Orbit</option><option value="tide">Tide</option><option value="spark">Spark</option></select></label><label>VOLUME <b>{{ Math.round(volume * 100) }}%</b><input v-model.number="volume" :disabled="!playing" type="range" min="0" max="0.25" step="0.01" @input="updateVolume" /></label><label>INTENTION<input v-model.trim="intention" maxlength="70" placeholder="A focus session, a late-night sketch…" /></label></div>
    <footer><p>{{ message || 'Audio begins only when you explicitly press start.' }}</p><button type="button" @click="save">Keep this sound setting ↗</button></footer>
  </section>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from "vue";

type Texture = "orbit" | "tide" | "spark";
const storageKey = "top-sound-lab-v1";
const texture = ref<Texture>("orbit");
const volume = ref(.08);
const intention = ref("");
const playing = ref(false);
const message = ref("");
let audioContext: AudioContext | undefined;
let master: GainNode | undefined;
let oscillators: OscillatorNode[] = [];

const frequencies: Record<Texture, [number, number]> = { orbit: [174, 261.63], tide: [110, 220], spark: [220, 329.63] };

function toggle(): void { if (playing.value) { stop(); return; } void start(); }
async function start(): Promise<void> {
  try {
    audioContext ??= new AudioContext();
    await audioContext.resume();
    const [low, high] = frequencies[texture.value];
    master = audioContext.createGain();
    master.gain.value = volume.value;
    master.connect(audioContext.destination);
    oscillators = [low, high].map((frequency, index) => {
      const oscillator = audioContext!.createOscillator();
      const gain = audioContext!.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.value = index === 0 ? .58 : .12;
      oscillator.connect(gain).connect(master!);
      oscillator.start();
      return oscillator;
    });
    playing.value = true;
    message.value = "SOUNDSCAPE RUNNING LOCALLY";
  } catch { message.value = "AUDIO IS NOT AVAILABLE IN THIS BROWSER"; }
}
function stop(): void { oscillators.forEach((oscillator) => oscillator.stop()); oscillators = []; master?.disconnect(); master = undefined; playing.value = false; message.value = "SOUNDSCAPE PAUSED"; }
function updateVolume(): void { if (master) master.gain.value = volume.value; }
function save(): void { try { localStorage.setItem(storageKey, JSON.stringify({ texture: texture.value, volume: volume.value, intention: intention.value })); message.value = "SOUND SETTING HELD LOCALLY"; } catch { message.value = "LOCAL STORAGE IS FULL"; } }
watch(texture, () => { if (playing.value) { stop(); message.value = "TEXTURE CHANGED — PRESS START"; } });
onUnmounted(stop);
</script>

<style scoped>
.sound-lab { background:linear-gradient(145deg,rgba(18,45,67,.82),rgba(4,10,25,.94)); border:1px solid rgba(98,230,255,.31); border-radius:26px 26px 7px 26px; box-shadow:inset 0 1px rgba(227,250,255,.08),0 25px 75px rgba(0,0,0,.25); grid-column:span 3; overflow:hidden; padding:clamp(25px,4vw,46px); position:relative; }.sound-lab header { align-items:flex-start; display:flex; justify-content:space-between; position:relative; }.sound-lab header > div > span { color:var(--top-cyan); font-family:var(--top-mono); font-size:9px; letter-spacing:.17em; }.sound-lab h3 { font-family:var(--top-display); font-size:clamp(31px,3.8vw,54px); font-weight:750; letter-spacing:-.08em; line-height:.89; margin:13px 0; }.sound-lab header p { color:var(--top-muted); line-height:1.65; max-width:580px; }.play { align-items:center; background:linear-gradient(110deg,var(--top-cyan),var(--top-violet)); border:0; border-radius:999px; color:#06101c; cursor:pointer; display:flex; font-family:var(--top-display); font-size:13px; font-weight:800; gap:8px; padding:13px 16px; }.play i { font-size:16px; font-style:normal; }.sound-stage { background:radial-gradient(circle at center,rgba(98,230,255,.15),transparent 33%),rgba(3,7,19,.76); border:1px solid rgba(98,230,255,.21); border-radius:20px 20px 5px 20px; height:280px; margin-top:28px; overflow:hidden; position:relative; }.sound-stage::before { background:repeating-radial-gradient(ellipse at center,transparent 0 21px,rgba(98,230,255,.1) 22px 23px); content:""; inset:0; opacity:.7; position:absolute; }.wave { border:1px solid rgba(156,124,255,.27); border-radius:50%; height:360px; left:50%; position:absolute; top:50%; transform:translate(-50%,-50%); width:620px; }.wave-two { height:210px; width:430px; }.wave-three { border-color:rgba(217,255,113,.2); height:120px; width:250px; }.playing .wave-one { animation:wave 5s linear infinite; }.playing .wave-two { animation:wave 4s reverse linear infinite; }.playing .wave-three { animation:wave 3s linear infinite; }.sound-orb { border:1px solid rgba(98,230,255,.6); border-radius:50%; height:80px; left:50%; position:absolute; top:50%; transform:translate(-50%,-50%); width:80px; }.sound-orb::before,.sound-orb::after { background:rgba(98,230,255,.74); content:""; height:1px; left:14px; position:absolute; top:39px; width:50px; }.sound-orb::after { transform:rotate(90deg); }.sound-orb i { border:1px solid var(--top-violet); border-radius:50%; height:13px; position:absolute; width:13px; }.sound-orb i:first-child { right:9px; top:11px; }.sound-orb i:nth-child(2) { bottom:9px; left:11px; }.sound-orb b { background:var(--top-lime); border-radius:50%; box-shadow:0 0 17px var(--top-lime); height:6px; left:37px; position:absolute; top:37px; width:6px; }.playing .sound-orb { animation:pulse 1.8s ease-in-out infinite alternate; }.sound-stage p { bottom:18px; color:rgba(197,218,255,.52); font-family:var(--top-mono); font-size:8px; left:0; letter-spacing:.14em; position:absolute; right:0; text-align:center; }.sound-controls { display:grid; gap:12px; grid-template-columns:1fr 1fr 1.5fr; margin-top:15px; }.sound-controls label { color:rgba(190,211,249,.56); font-family:var(--top-mono); font-size:8px; letter-spacing:.13em; }.sound-controls label b { color:var(--top-cyan); font-weight:500; }.sound-controls input,.sound-controls select { background:rgba(3,7,18,.62); border:1px solid rgba(98,230,255,.22); border-radius:9px 9px 3px 9px; color:var(--top-ink); display:block; font:inherit; font-size:11px; margin-top:8px; outline:0; padding:10px; width:100%; }.sound-controls input[type="range"] { accent-color:var(--top-cyan); padding:7px 0; }.sound-lab footer { align-items:center; border-top:1px solid rgba(98,230,255,.13); display:flex; justify-content:space-between; margin-top:17px; padding-top:17px; }.sound-lab footer p { color:rgba(193,211,248,.54); font-size:11px; }.sound-lab footer button { background:transparent; border:0; color:var(--top-cyan); cursor:pointer; font-family:var(--top-mono); font-size:9px; } @keyframes wave { to { transform:translate(-50%,-50%) rotate(360deg) scale(1.08); } } @keyframes pulse { to { box-shadow:0 0 36px rgba(98,230,255,.36); scale:1.12; } }
@media (max-width:800px) { .sound-lab { grid-column:span 1; padding:24px; }.sound-lab header,.sound-lab footer { align-items:flex-start; flex-direction:column; gap:15px; }.sound-controls { grid-template-columns:1fr; }.sound-stage { height:230px; } }
</style>
