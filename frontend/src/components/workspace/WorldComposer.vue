<template>
  <section class="world-composer">
    <header><div><span>WORLD COMPOSER</span><h3>Give a project<br />a place to exist.</h3><p>Build a small symbolic world for an idea: landmarks, lights, and a terrain you can return to when the work needs a bigger view.</p></div><b>{{ landmarks.length }}<small>LANDMARKS</small></b></header>
    <div class="world-shell"><div ref="stage" class="world-stage" @pointermove="moveCamera"><span>LIVE WORLD / {{ worldName || 'UNTITLED' }}</span><i>DRAG YOUR EYES ACROSS THE HORIZON</i></div><aside><label>WORLD NAME<input v-model.trim="worldName" maxlength="60" placeholder="The world this project needs" @change="persist('WORLD NAME HELD')" /></label><label>NEW LANDMARK<input v-model.trim="draftLabel" maxlength="60" placeholder="A milestone, symbol, or destination" @keydown.enter.prevent="addLandmark" /></label><label>FORM<select v-model="draftForm"><option value="beacon">Beacon</option><option value="orb">Orb</option><option value="spire">Spire</option></select></label><div class="tone-picker"><span>LIGHT</span><button v-for="color in tones" :key="color" :class="{ active: draftColor === color }" :style="{ '--tone': color }" type="button" @click="draftColor = color"></button></div><button class="add" type="button" @click="addLandmark">Place landmark ↗</button><div class="landmarks"><button v-for="landmark in landmarks" :key="landmark.id" type="button" @click="removeLandmark(landmark.id)"><i :style="{ '--tone': landmark.color }"></i><span>{{ landmark.label }}<small>{{ landmark.form }}</small></span><b>×</b></button><p v-if="landmarks.length === 0">Nothing has been placed for you.</p></div></aside></div>
    <footer><p>{{ message || 'Worlds are private local sketches until project sharing exists.' }}</p><button type="button" @click="persist('WORLD HELD LOCALLY')">Keep this world ↗</button></footer>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import * as THREE from "three";

type LandmarkForm = "beacon" | "orb" | "spire";
type Landmark = { id: string; label: string; form: LandmarkForm; color: string };
const storageKey = "top-world-composer-v1";
const stage = ref<HTMLElement>();
const worldName = ref("");
const draftLabel = ref("");
const draftForm = ref<LandmarkForm>("beacon");
const draftColor = ref("#62e6ff");
const tones = ["#62e6ff", "#ff72bd", "#d9ff71", "#9c7cff", "#ff9b54"];
const landmarks = ref<Landmark[]>([]);
const message = ref("");

let renderer: THREE.WebGLRenderer | undefined;
let scene: THREE.Scene | undefined;
let camera: THREE.PerspectiveCamera | undefined;
let landmarkGroup: THREE.Group | undefined;
let frame = 0;
let mouseX = 0;
let mouseY = 0;

function setupWorld(): void {
  if (!stage.value) return;
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050814, .075);
  camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  camera.position.set(0, 4.2, 12);
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  stage.value.appendChild(renderer.domElement);
  landmarkGroup = new THREE.Group();
  scene.add(landmarkGroup);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(7.4, 96), new THREE.MeshBasicMaterial({ color: 0x08142a, transparent: true, opacity: .55, side: THREE.DoubleSide }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  for (let index = 0; index < 4; index += 1) {
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, 2.2 + index * 1.25, .75 + index * .42, 0, Math.PI * 2).getPoints(96).map((point) => new THREE.Vector3(point.x, .03 + index * .012, point.y))), new THREE.LineBasicMaterial({ color: index % 2 ? 0x9c7cff : 0x62e6ff, transparent: true, opacity: .23 }));
    ring.rotation.x = -Math.PI / 2;
    scene.add(ring);
  }
  scene.add(new THREE.AmbientLight(0x7894ff, .75));
  const cyan = new THREE.PointLight(0x62e6ff, 18, 30, 2); cyan.position.set(4, 6, 5); scene.add(cyan);
  const pink = new THREE.PointLight(0xff72bd, 12, 28, 2); pink.position.set(-5, 3, 0); scene.add(pink);
  resize();
  window.addEventListener("resize", resize);
  rebuildLandmarks();
  render();
}

function resize(): void { if (!stage.value || !renderer || !camera) return; const box = stage.value.getBoundingClientRect(); camera.aspect = box.width / Math.max(box.height, 1); camera.updateProjectionMatrix(); renderer.setSize(box.width, box.height, false); }

function render(): void {
  if (!renderer || !scene || !camera) return;
  const time = performance.now() * .001;
  camera.position.x += (mouseX * 1.8 - camera.position.x) * .025;
  camera.position.y += (4.2 + mouseY * .85 - camera.position.y) * .025;
  camera.lookAt(0, .2, 0);
  if (landmarkGroup) { landmarkGroup.rotation.y = time * .045; landmarkGroup.children.forEach((child, index) => { child.position.y = Math.sin(time * .8 + index) * .1; child.rotation.y += .005; }); }
  renderer.render(scene, camera);
  frame = requestAnimationFrame(render);
}

function makeLandmark(landmark: Landmark, index: number): THREE.Group {
  const group = new THREE.Group();
  const color = new THREE.Color(landmark.color);
  const material = new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(.25), emissiveIntensity: 1, metalness: .55, roughness: .25 });
  if (landmark.form === "beacon") { group.add(new THREE.Mesh(new THREE.CylinderGeometry(.16, .28, 1.6, 16), material)); const cap = new THREE.Mesh(new THREE.SphereGeometry(.28, 24, 24), material); cap.position.y = .87; group.add(cap); }
  if (landmark.form === "orb") group.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.56, 2), material));
  if (landmark.form === "spire") { const spire = new THREE.Mesh(new THREE.ConeGeometry(.42, 1.8, 5), material); spire.position.y = .4; group.add(spire); }
  const glow = new THREE.PointLight(color, 4, 3, 2); glow.position.y = .6; group.add(glow);
  const angle = index * 2.4 + .4;
  const radius = 2.1 + (index % 3) * 1.3;
  group.position.set(Math.cos(angle) * radius, .48, Math.sin(angle) * radius);
  return group;
}

function rebuildLandmarks(): void { if (!landmarkGroup) return; landmarkGroup.clear(); landmarks.value.forEach((landmark, index) => landmarkGroup?.add(makeLandmark(landmark, index))); }
function addLandmark(): void { const label = draftLabel.value.trim(); if (!label) { message.value = "NAME THE LANDMARK FIRST"; return; } landmarks.value = [...landmarks.value, { id: crypto.randomUUID(), label, form: draftForm.value, color: draftColor.value }]; draftLabel.value = ""; rebuildLandmarks(); persist("LANDMARK PLACED"); }
function removeLandmark(id: string): void { landmarks.value = landmarks.value.filter((landmark) => landmark.id !== id); rebuildLandmarks(); persist("LANDMARK REMOVED"); }
function persist(nextMessage: string): void { try { localStorage.setItem(storageKey, JSON.stringify({ name: worldName.value, landmarks: landmarks.value })); message.value = nextMessage; } catch { message.value = "LOCAL STORAGE IS FULL"; } }
function moveCamera(event: PointerEvent): void { if (!stage.value) return; const bounds = stage.value.getBoundingClientRect(); mouseX = ((event.clientX - bounds.left) / bounds.width - .5) * 2; mouseY = ((event.clientY - bounds.top) / bounds.height - .5) * -2; }

onMounted(() => { try { const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as { name?: string; landmarks?: Landmark[] } | null; worldName.value = saved?.name ?? worldName.value; landmarks.value = Array.isArray(saved?.landmarks) ? saved!.landmarks.filter((landmark) => typeof landmark?.id === "string" && typeof landmark?.label === "string" && typeof landmark?.color === "string" && ["beacon", "orb", "spire"].includes(landmark?.form)) : []; } catch { landmarks.value = []; } setupWorld(); });
onUnmounted(() => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); scene?.traverse((object) => { const mesh = object as THREE.Mesh; mesh.geometry?.dispose(); const material = mesh.material; if (Array.isArray(material)) material.forEach((item) => item.dispose()); else material?.dispose(); }); renderer?.dispose(); renderer?.domElement.remove(); });
</script>

<style scoped>
.world-composer { background:linear-gradient(145deg,rgba(44,30,70,.82),rgba(6,9,25,.95)); border:1px solid rgba(255,155,84,.31); border-radius:26px 26px 7px 26px; box-shadow:inset 0 1px rgba(255,238,221,.07),0 25px 75px rgba(0,0,0,.25); grid-column:span 3; overflow:hidden; padding:clamp(25px,4vw,46px); position:relative; }.world-composer header { align-items:flex-start; display:flex; justify-content:space-between; position:relative; }.world-composer header > div > span { color:#ffae73; font-family:var(--top-mono); font-size:9px; letter-spacing:.17em; }.world-composer h3 { font-family:var(--top-display); font-size:clamp(31px,3.8vw,54px); font-weight:750; letter-spacing:-.08em; line-height:.89; margin:13px 0; }.world-composer header p { color:var(--top-muted); line-height:1.65; max-width:600px; }.world-composer header > b { align-items:center; border:1px solid rgba(255,155,84,.45); border-radius:50%; color:#ffae73; display:flex; flex-direction:column; font-family:var(--top-display); font-size:24px; height:66px; justify-content:center; width:66px; }.world-composer header b small { font-family:var(--top-mono); font-size:6px; letter-spacing:.13em; margin-top:3px; }.world-shell { display:grid; gap:13px; grid-template-columns:minmax(0,1fr) 250px; margin-top:28px; position:relative; }.world-stage { background:radial-gradient(circle at center,rgba(255,155,84,.12),transparent 35%),rgba(3,5,16,.84); border:1px solid rgba(255,155,84,.22); border-radius:19px 19px 5px 19px; min-height:460px; overflow:hidden; position:relative; }.world-stage :deep(canvas) { height:100%; inset:0; position:absolute; width:100%; }.world-stage > span,.world-stage > i { color:rgba(230,216,255,.44); font-family:var(--top-mono); font-size:7px; font-style:normal; letter-spacing:.13em; pointer-events:none; position:absolute; z-index:1; }.world-stage > span { left:16px; top:14px; }.world-stage > i { bottom:14px; right:16px; }.world-shell aside { background:rgba(4,6,18,.75); border:1px solid rgba(255,155,84,.2); border-radius:15px 15px 4px 15px; display:flex; flex-direction:column; gap:14px; padding:15px; }.world-shell label,.tone-picker > span { color:rgba(245,215,194,.62); display:block; font-family:var(--top-mono); font-size:8px; letter-spacing:.13em; }.world-shell input,.world-shell select { background:rgba(2,4,14,.66); border:1px solid rgba(255,155,84,.25); border-radius:9px 9px 3px 9px; color:var(--top-ink); display:block; font:inherit; font-size:11px; margin-top:7px; outline:0; padding:10px; width:100%; }.tone-picker { display:flex; flex-wrap:wrap; gap:7px; }.tone-picker > span { flex-basis:100%; }.tone-picker button { background:var(--tone); border:2px solid transparent; border-radius:50%; box-shadow:0 0 11px var(--tone); cursor:pointer; height:20px; width:20px; }.tone-picker button.active { border-color:#fff; scale:1.15; }.add { background:linear-gradient(110deg,#ffae73,var(--top-pink)); border:0; border-radius:10px 10px 3px 10px; color:#140a08; cursor:pointer; font-family:var(--top-display); font-size:13px; font-weight:800; padding:12px; }.landmarks { border-top:1px solid rgba(255,155,84,.13); margin-top:auto; max-height:138px; overflow:auto; padding-top:10px; }.landmarks button { align-items:center; background:transparent; border:0; color:rgba(232,238,255,.78); cursor:pointer; display:flex; font-size:10px; gap:7px; padding:7px 0; text-align:left; width:100%; }.landmarks button > i { background:var(--tone); border-radius:50%; box-shadow:0 0 8px var(--tone); height:6px; width:6px; }.landmarks span { flex:1; }.landmarks small { color:rgba(219,206,246,.4); display:block; font-family:var(--top-mono); font-size:7px; margin-top:2px; text-transform:uppercase; }.landmarks b { color:#ffae73; font-size:15px; font-weight:400; }.landmarks p { color:rgba(230,215,247,.38); font-family:var(--top-mono); font-size:8px; line-height:1.5; }.world-composer footer { align-items:center; border-top:1px solid rgba(255,155,84,.13); display:flex; justify-content:space-between; margin-top:17px; padding-top:17px; position:relative; }.world-composer footer p { color:rgba(220,211,247,.54); font-size:11px; }.world-composer footer button { background:transparent; border:0; color:#ffae73; cursor:pointer; font-family:var(--top-mono); font-size:9px; }
@media (max-width:800px) { .world-composer { grid-column:span 1; padding:24px; }.world-composer header,.world-composer footer { align-items:flex-start; flex-direction:column; gap:13px; }.world-shell { grid-template-columns:1fr; }.world-stage { min-height:380px; } }
</style>
