<template>

<IntroView
v-if="experience.state===ExperienceState.INTRO"
/>

<MissionControl
v-else-if="experience.state===ExperienceState.MISSION_CONTROL"
/>

</template>

<script setup lang="ts">

import IntroView from "./IntroView.vue";
import MissionControl from "./MissionControl.vue";

import {

ExperienceState,
useExperienceStore

} from "../stores/experience";

const experience=

useExperienceStore();

</script>

.intro{

position:fixed;

inset:0;

display:flex;

flex-direction:column;

justify-content:center;

align-items:center;

z-index:9999;

color:white;

pointer-events:none;

}

button{

pointer-events:auto;

}
