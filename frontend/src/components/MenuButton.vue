<template>
  <button class="button" type="button">
    <span class="index" aria-hidden="true">↗</span>
    <span class="label"><slot /></span>
  </button>
</template>

<style scoped>
.button { align-items:center; background:linear-gradient(145deg,rgba(24,32,74,.78),rgba(9,12,30,.86)); border:1px solid rgba(123,153,255,.24); border-radius:17px 17px 5px 17px; color:var(--top-ink); cursor:pointer; display:flex; gap:13px; min-height:58px; padding:0 17px; transition:background .22s ease,border-color .22s ease,transform .22s ease; width:100%; }.button:hover { background:linear-gradient(145deg,rgba(38,50,110,.92),rgba(11,15,38,.96)); border-color:var(--top-cyan); transform:translateY(-3px); }.index { align-items:center; border:1px solid rgba(98,230,255,.44); border-radius:50%; color:var(--top-cyan); display:flex; font-size:14px; height:26px; justify-content:center; width:26px; }.label { font-family:var(--top-mono); font-size:11px; font-weight:800; letter-spacing:.08em; }
</style>
