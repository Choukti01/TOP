<template>

<div class="generating">

    <div class="panel">

        <div class="logo">

            TOP

        </div>

        <h1>

            Building Your World...

        </h1>

        <p>

            Preparing your creator workspace

        </p>

        <div class="bar">

            <div
                class="progress"
                :style="{width: progress + '%'}"
            ></div>

        </div>

        <div class="status">

            {{ message }}

        </div>

    </div>

</div>

</template>

<script setup lang="ts">

import { ref,onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const progress = ref(0);

const message = ref("Initializing...");

const messages=[

"Creating creator profile...",
"Generating workspace...",
"Preparing AI memory...",
"Building knowledge graph...",
"Connecting world...",
"Launching TOP..."

];

onMounted(()=>{

let i=0;

const timer=setInterval(()=>{

progress.value+=20;

message.value=messages[i];

i++;

if(progress.value>=100){

clearInterval(timer);

setTimeout(()=>{

router.push("/workspace");

},700);

}

},700);

});

</script>

<style scoped>

.generating{

position:fixed;

inset:0;

display:flex;

justify-content:center;

align-items:center;

background:#02050d;

color:white;

}

.panel{

width:700px;

text-align:center;

}

.logo{

font-size:72px;

letter-spacing:18px;

margin-bottom:40px;

color:#70B8FF;

}

h1{

font-weight:200;

margin-bottom:20px;

}

.bar{

height:10px;

background:#1b2235;

margin-top:40px;

overflow:hidden;

}

.progress{

height:100%;

background:#70B8FF;

transition:.6s;

}

.status{

margin-top:25px;

opacity:.8;

}

</style>
