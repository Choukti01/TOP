<template>
  <button class="enter" type="button" @click="$emit('enter')">
    <span><slot>ENTER THE FIELD</slot></span><i aria-hidden="true">↗</i>
  </button>
</template>

<style scoped>
.enter { align-items:center; background:linear-gradient(110deg,var(--top-cyan),#a08aff 52%,var(--top-pink)); border:1px solid rgba(229,242,255,.52); border-radius:999px; box-shadow:0 14px 37px rgba(83,105,255,.35),inset 0 1px rgba(255,255,255,.6); color:#07101d; cursor:pointer; display:inline-flex; font-size:11px; font-weight:850; gap:17px; padding:14px 15px 14px 20px; transition:transform .22s ease,box-shadow .22s ease; }.enter:hover { box-shadow:0 19px 45px rgba(83,105,255,.5),inset 0 1px rgba(255,255,255,.6); transform:translateY(-3px); }.enter i { align-items:center; background:rgba(7,16,29,.12); border-radius:50%; display:flex; font-size:15px; font-style:normal; height:24px; justify-content:center; width:24px; }
</style>
