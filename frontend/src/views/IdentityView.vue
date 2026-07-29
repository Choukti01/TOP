<template>

<div class="identity">

    <div class="panel">

        <!-- STEP 1 -->

        <template v-if="step===1">

            <div class="step">

                STEP 01

            </div>

            <h1>

                Who are you becoming?

            </h1>

            <p>

                Every world starts with its creator.

            </p>

            <div class="cards">

                <div

                    class="card"

                    v-for="creator in creators"

                    :key="creator"

                    @click="chooseCreator(creator)"

                >

                    {{ creator }}

                </div>

                <div

                    class="card"

                    @click="chooseCreator('Other')"

                >

                    Other...

                </div>

            </div>

        </template>

        <!-- STEP 2 -->

        <template v-if="step===2">

            <div class="step">

                STEP 02

            </div>

            <h1>

                What do you build?

            </h1>

            <p>

                {{ creator }}

            </p>

            <div class="cards">

                <div

                    class="card"

                    v-for="item in buildTypes"

                    :key="item"

                    @click="chooseBuild(item)"

                >

                    {{ item }}

                </div>

            </div>

        </template>

        <!-- STEP 3 -->

        <template v-if="step===3">

            <div class="step">

                STEP 03

            </div>

            <h1>

                Choose your ambition

            </h1>

            <p>

                Your world grows with your ambition.

            </p>

            <div class="cards">

                <div

                    class="card"

                    v-for="item in ambitions"

                    :key="item"

                    @click="chooseAmbition(item)"

                >

                    {{ item }}

                </div>

            </div>

        </template>

        <!-- STEP 4 -->

        <template v-if="step===4">

            <div class="step">

                STEP 04

            </div>

            <h1>

                Name Your World

            </h1>

            <p>

                This becomes your creator universe.

            </p>

            <input

                v-model="worldName"

                placeholder="Example : TOP"

            />

            <button

                class="create"

                @click="createWorld"

                :disabled="worldName.trim()===''"

            >

                CREATE MY WORLD

            </button>

        </template>

    </div>

</div>

</template>

<script setup lang="ts">

import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const step = ref(1);

const creator = ref("");

const build = ref("");

const ambition = ref("");

const worldName = ref("");

const creators=[

"Developer",
"Founder",
"Designer",
"Scientist",
"Researcher",
"Engineer",
"Architect",
"Musician"

];

const buildTypes=[

"Web",
"Desktop",
"Mobile",
"AI",
"Games",
"Systems",
"Cloud",
"Robotics"

];

const ambitions=[

"Learn",
"Freelance",
"Startup",
"Studio",
"Enterprise",
"Research"

];

function chooseCreator(value:string){

    creator.value=value;

    step.value=2;

}

function chooseBuild(value:string){

    build.value=value;

    step.value=3;

}

function chooseAmbition(value:string){

    ambition.value=value;

    step.value=4;

}

function createWorld(){

    console.log({

        creator:creator.value,

        build:build.value,

        ambition:ambition.value,

        world:worldName.value

    });

    router.push("/generating");

}

</script>

<style scoped>

.identity{

width:100vw;

height:100vh;

display:flex;

justify-content:center;

align-items:center;

background:#03060d;

color:white;

}

.panel{

width:920px;

animation:fade .5s;

}

.step{

color:#70B8FF;

letter-spacing:6px;

margin-bottom:20px;

}

h1{

font-size:58px;

font-weight:200;

margin-bottom:15px;

}

p{

opacity:.7;

margin-bottom:40px;

}

.cards{

display:grid;

grid-template-columns:repeat(4,1fr);

gap:20px;

}

.card{

height:140px;

display:flex;

justify-content:center;

align-items:center;

border:1px solid rgba(255,255,255,.08);

background:rgba(255,255,255,.03);

cursor:pointer;

transition:.35s;

user-select:none;

}

.card:hover{

transform:translateY(-8px);

border-color:#70B8FF;

background:rgba(112,184,255,.08);

}

input{

width:100%;

padding:18px;

background:#101522;

border:1px solid rgba(255,255,255,.08);

color:white;

font-size:18px;

margin-top:20px;

margin-bottom:30px;

outline:none;

}

.create{

width:100%;

height:64px;

border:none;

background:#70B8FF;

color:#08121d;

font-size:16px;

letter-spacing:4px;

cursor:pointer;

transition:.3s;

font-weight:700;

}

.create:hover{

transform:translateY(-4px);

}

.create:disabled{

opacity:.4;

cursor:not-allowed;

transform:none;

}

@keyframes fade{

from{

opacity:0;

transform:translateY(20px);

}

to{

opacity:1;

transform:translateY(0);

}

}

</style>
