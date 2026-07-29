<template>

<div class="intro">

    <div class="overlay"></div>

    <div class="content">

        <h1 class="logo">
            TOP
        </h1>

        <p class="subtitle">
            Every World Begins Somewhere
        </p>

        <button
            class="enter"
            @click="enter"
        >
            ENTER TOP
        </button>

    </div>

</div>

</template>

<script setup lang="ts">

import {

useExperienceStore

} from "../stores/experience";

const experience =
useExperienceStore();

function enter(){

    experience.enter();

}

</script>

<style scoped>

.intro{

position:fixed;

inset:0;

display:flex;

justify-content:center;

align-items:center;

z-index:1000;

overflow:hidden;

}

.overlay{

position:absolute;

inset:0;

background:

linear-gradient(

180deg,

rgba(0,0,0,.15),

rgba(0,0,0,.65)

);

backdrop-filter:blur(2px);

}

.content{

position:relative;

display:flex;

flex-direction:column;

align-items:center;

animation:fade 2s ease;

}

.logo{

font-size:130px;

letter-spacing:32px;

font-weight:200;

color:white;

margin:0;

animation:

logoFloat 6s ease-in-out infinite;

text-shadow:

0 0 20px rgba(255,255,255,.2),

0 0 80px rgba(100,180,255,.25);

}

.subtitle{

margin-top:10px;

font-size:20px;

letter-spacing:8px;

color:#d7e7ff;

opacity:.8;

animation:

fadeUp 2s ease;

}

.enter{

margin-top:70px;

width:280px;

height:65px;

background:transparent;

color:white;

border:1px solid rgba(255,255,255,.3);

font-size:18px;

letter-spacing:5px;

cursor:pointer;

transition:.35s;

backdrop-filter:blur(15px);

}

.enter:hover{

transform:translateY(-4px);

border-color:#70B8FF;

box-shadow:

0 0 20px #70B8FF,

0 0 80px rgba(112,184,255,.3);

background:

rgba(112,184,255,.08);

}

@keyframes fade{

from{

opacity:0;

transform:translateY(50px);

}

to{

opacity:1;

transform:translateY(0);

}

}

@keyframes fadeUp{

from{

opacity:0;

transform:translateY(25px);

}

to{

opacity:.8;

transform:translateY(0);

}

}

@keyframes logoFloat{

0%{

transform:

translateY(0px);

}

50%{

transform:

translateY(-12px);

}

100%{

transform:

translateY(0px);

}

}

</style>
