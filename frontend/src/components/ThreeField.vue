<template>
  <div ref="host" class="three-field" aria-hidden="true"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const props = withDefaults(defineProps<{ mode?: string; pulse?: number }>(), { mode: "workspace", pulse: 0 });

const host = ref<HTMLElement>();
let renderer: THREE.WebGLRenderer | undefined;
let composer: EffectComposer | undefined;
let bloomPass: UnrealBloomPass | undefined;
let scene: THREE.Scene | undefined;
let camera: THREE.PerspectiveCamera | undefined;
let field: THREE.Group | undefined;
let core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial> | undefined;
let rings: THREE.Group | undefined;
let constellation: THREE.Points | undefined;
let frame = 0;
let width = 0;
let height = 0;
let targetRotation = 0;
let targetTilt = 0;
let targetDistance = 12;
let targetCoreScale = 1;
let targetColor = new THREE.Color("#62e6ff");
let currentColor = new THREE.Color("#62e6ff");
let reduceMotion = false;
let energy = 0;
let compactField = false;

function profile(mode: string): { color: string; rotation: number; tilt: number; distance: number; scale: number } {
  if (mode.includes("arrival")) return { color: "#f2edff", rotation: -.2, tilt: .18, distance: 7.8, scale: 1.92 };
  if (mode.includes("atelier")) return { color: "#ff9b54", rotation: .34, tilt: .28, distance: 9.2, scale: 1.3 };
  if (mode.includes("project")) return { color: "#ff72bd", rotation: 1.28, tilt: .34, distance: 9.6, scale: 1.34 };
  if (mode.includes("studio")) return { color: "#ff72bd", rotation: -.58, tilt: .29, distance: 9.8, scale: 1.23 };
  if (mode.includes("blueprint")) return { color: "#d9ff71", rotation: .76, tilt: -.18, distance: 10.3, scale: 1.12 };
  if (mode.includes("reflection")) return { color: "#d9ff71", rotation: -.76, tilt: -.22, distance: 11.4, scale: .88 };
  if (mode.includes("ai") || mode.includes("focus")) return { color: "#a58bff", rotation: .58, tilt: .16, distance: 10.7, scale: 1.13 };
  if (mode.includes("identity") || mode.includes("onboarding")) return { color: "#8d7cff", rotation: -.34, tilt: .08, distance: 13.5, scale: .8 };
  if (mode.includes("generating")) return { color: "#d9ff71", rotation: .82, tilt: -.14, distance: 10.5, scale: 1.1 };
  if (mode.includes("projects")) return { color: "#62e6ff", rotation: .91, tilt: .12, distance: 11.1, scale: 1.08 };
  return { color: "#62e6ff", rotation: 0, tilt: 0, distance: 12.8, scale: 1 };
}

function applyMode(mode: string): void {
  const next = profile(mode);
  targetColor.set(next.color);
  targetRotation = next.rotation;
  targetTilt = next.tilt;
  targetDistance = next.distance;
  targetCoreScale = next.scale;
}

function makeOrbit(radius: number, verticalRadius: number, rotation: [number, number, number], color: string, opacity: number): THREE.LineLoop {
  const curve = new THREE.EllipseCurve(0, 0, radius, verticalRadius, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(128).map((point) => new THREE.Vector3(point.x, point.y, 0));
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending });
  const orbit = new THREE.LineLoop(geometry, material);
  orbit.rotation.set(...rotation);
  return orbit;
}

function makeConstellation(): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const palette = [new THREE.Color("#62e6ff"), new THREE.Color("#9c7cff"), new THREE.Color("#d9ff71"), new THREE.Color("#ff72bd")];

  for (let index = 0; index < (compactField ? 180 : 360); index += 1) {
    const radius = 3 + Math.random() * 12;
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(2 * Math.random() - 1);
    const color = palette[index % palette.length]!;
    positions.push(
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.cos(theta) * .62,
      radius * Math.sin(theta) * Math.sin(phi)
    );
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(geometry, new THREE.PointsMaterial({
    size: .055,
    vertexColors: true,
    transparent: true,
    opacity: .82,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
}

function mount(): void {
  if (!host.value) return;

  reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  compactField = window.matchMedia("(max-width: 700px)").matches;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
  camera.position.set(0, 1.2, targetDistance);

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactField ? 1.15 : 1.6));
  renderer.setClearColor(0x000000, 0);
  host.value.appendChild(renderer.domElement);

  field = new THREE.Group();
  field.rotation.x = -.22;
  scene.add(field);

  const coreMaterial = new THREE.MeshStandardMaterial({
    color: "#62e6ff",
    emissive: "#142c5c",
    emissiveIntensity: .8,
    roughness: .3,
    metalness: .58,
    transparent: true,
    opacity: .8
  });
  core = new THREE.Mesh(new THREE.SphereGeometry(1.6, compactField ? 32 : 48, compactField ? 32 : 48), coreMaterial);
  field.add(core);

  rings = new THREE.Group();
  rings.add(makeOrbit(3.1, 1.05, [.68, .15, .15], "#62e6ff", .34));
  rings.add(makeOrbit(4.35, 1.7, [1.09, -.34, .38], "#9c7cff", .26));
  rings.add(makeOrbit(5.75, 2.25, [.28, .52, -.54], "#ff72bd", .18));
  field.add(rings);

  constellation = makeConstellation();
  field.add(constellation);

  scene.add(new THREE.AmbientLight("#7589ff", .65));
  const cyanLight = new THREE.PointLight("#62e6ff", 12, 22, 2);
  cyanLight.position.set(4, 3, 6);
  scene.add(cyanLight);
  const violetLight = new THREE.PointLight("#9c7cff", 9, 20, 2);
  violetLight.position.set(-5, -3, 2);
  scene.add(violetLight);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), compactField ? .38 : .52, .46, .22);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  applyMode(props.mode);
  resize();
  window.addEventListener("resize", resize);
  animate();
}

function resize(): void {
  if (!host.value || !renderer || !camera) return;
  const rect = host.value.getBoundingClientRect();
  width = Math.max(rect.width, 1);
  height = Math.max(rect.height, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  composer?.setSize(width, height);
}

function animate(): void {
  if (!renderer || !scene || !camera || !field || !core || !rings || !constellation) return;

  const time = performance.now() * .001;
  const ease = reduceMotion ? 1 : .035;
  field.rotation.y = THREE.MathUtils.lerp(field.rotation.y, targetRotation, ease);
  field.rotation.x = THREE.MathUtils.lerp(field.rotation.x, targetTilt - .22, ease);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetDistance, ease);
  core.scale.lerp(new THREE.Vector3(targetCoreScale, targetCoreScale, targetCoreScale), ease);
  currentColor.lerp(targetColor, ease);
  core.material.color.copy(currentColor);
  core.material.emissive.copy(currentColor).multiplyScalar(.19);
  energy = Math.max(0, energy - .026);
  const energyScale = 1 + energy * .2;
  rings.scale.setScalar(energyScale);
  constellation.scale.setScalar(1 + energy * .08);
  if (bloomPass) bloomPass.strength = (compactField ? .38 : .52) + energy * .48;

  if (!reduceMotion) {
    core.rotation.y += .0035;
    core.rotation.x = Math.sin(time * .43) * .08;
    core.position.y = Math.sin(time * .7) * .16;
    rings.rotation.y += .0016;
    rings.rotation.z = Math.sin(time * .25) * .08;
    constellation.rotation.y -= .00075;
    constellation.rotation.x = Math.sin(time * .17) * .08;
  }

  if (composer) composer.render();
  else renderer.render(scene, camera);
  frame = window.requestAnimationFrame(animate);
}

function dispose(): void {
  window.cancelAnimationFrame(frame);
  window.removeEventListener("resize", resize);

  if (scene) {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    });
  }

  composer?.dispose();
  composer = undefined;
  bloomPass = undefined;
  renderer?.dispose();
  renderer?.domElement.remove();
  renderer = undefined;
  scene = undefined;
}

watch(() => props.mode, applyMode);
watch(() => props.pulse, () => { energy = reduceMotion ? 0 : 1; });
onMounted(mount);
onUnmounted(dispose);
</script>

<style scoped>
.three-field { inset:0; overflow:hidden; pointer-events:none; position:absolute; z-index:0; }.three-field :deep(canvas) { height:100%; opacity:.76; width:100%; }
@media (max-width:700px) { .three-field :deep(canvas) { opacity:.48; } }
</style>
