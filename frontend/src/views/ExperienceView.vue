<template>
  <Transition name="experience" mode="out-in">
    <IntroView v-if="experience.state === ExperienceState.INTRO" />
    <MissionControl v-else-if="experience.state === ExperienceState.MISSION_CONTROL" />
  </Transition>
</template>

<script setup lang="ts">
import IntroView from "./IntroView.vue";
import MissionControl from "./MissionControl.vue";
import { ExperienceState, useExperienceStore } from "../stores/experience";

const experience = useExperienceStore();
</script>

<style scoped>
.experience-enter-active,.experience-leave-active { transition:opacity .5s ease; }.experience-enter-from,.experience-leave-to { opacity:0; }
</style>
