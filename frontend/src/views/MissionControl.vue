<template>

<div
    v-if="visible"
    class="mission-control"
>

    <div class="background-glow"></div>

    <div class="panel">

        <div class="title">

            <h1>TOP</h1>

            <p>MISSION CONTROL</p>

        </div>

        <div class="buttons">

            <MenuButton @click="startJourney">

                START JOURNEY

            </MenuButton>

            <MenuButton @click="exploreWorlds">

                EXPLORE WORLDS

            </MenuButton>

            <MenuButton @click="continueJourney">

                CONTINUE

            </MenuButton>

            <MenuButton @click="settings">

                SETTINGS

            </MenuButton>

        </div>

    </div>

</div>

</template>

<script setup lang="ts">

import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import MenuButton from "../components/MenuButton.vue";

const router = useRouter();

const route = useRoute();

const visible = computed(() => route.path === "/");

function startJourney(){

    router.push("/identity");

}

function exploreWorlds(){

    router.push("/explore");

}

function continueJourney(){

    router.push("/workspace");

}

function settings(){

    router.push("/settings");

}

</script>

<style scoped>

.mission-control{

position:fixed;

inset:0;

display:flex;

justify-content:center;

align-items:center;

overflow:hidden;

z-index:2000;

pointer-events:none;

animation:fadeIn .8s ease;

}

.background-glow{

position:absolute;

width:1000px;

height:1000px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(112,184,255,.08),

transparent 72%

);

filter:blur(120px);

animation:pulse 8s ease-in-out infinite;

}

.panel{

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:min(560px,82vw);

padding:40px 42px;

display:flex;

flex-direction:column;

align-items:center;

justify-content:center;

border-radius:24px;

background:

linear-gradient(

180deg,

rgba(12,18,35,.40),

rgba(0,0,0,.52)

);

border:1px solid rgba(255,255,255,.08);

backdrop-filter:blur(30px);

box-shadow:

0 20px 80px rgba(0,0,0,.55),

0 0 30px rgba(112,184,255,.08);

pointer-events:auto;

animation:panelFloat 6s ease-in-out infinite;

}

.title{

display:flex;

flex-direction:column;

align-items:center;

margin-bottom:30px;

}

.title h1{

margin:0;

font-size:66px;

font-weight:200;

letter-spacing:18px;

line-height:1;

color:white;

text-shadow:

0 0 25px rgba(255,255,255,.12),

0 0 45px rgba(112,184,255,.28);

}

.title p{

margin-top:12px;

font-size:12px;

letter-spacing:6px;

text-transform:uppercase;

color:#70B8FF;

}

.buttons{

width:100%;

display:flex;

flex-direction:column;

align-items:center;

gap:12px;

}

@keyframes fadeIn{

from{

opacity:0;

transform:scale(.96);

}

to{

opacity:1;

transform:scale(1);

}

}

@keyframes pulse{

0%{

transform:scale(1);

opacity:.45;

}

50%{

transform:scale(1.12);

opacity:1;

}

100%{

transform:scale(1);

opacity:.45;

}

}

@keyframes panelFloat{

0%{

transform:translate(-50%,-50%);

}

50%{

transform:translate(-50%,calc(-50% - 8px));

}

100%{

transform:translate(-50%,-50%);

}

}

</style>
