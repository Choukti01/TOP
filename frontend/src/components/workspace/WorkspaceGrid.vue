<template>
  <div class="field-lines" aria-hidden="true"><span></span><i></i></div>
</template>

<style scoped>
.field-lines { inset:-18%; mask-image:radial-gradient(ellipse at center,black 7%,rgba(0,0,0,.66) 48%,transparent 74%); pointer-events:none; position:absolute; }
.field-lines::before,.field-lines::after { border:1px solid rgba(224,184,119,.11); border-radius:47% 53% 62% 38% / 38% 42% 58% 62%; content:""; height:420px; left:50%; position:absolute; top:50%; transform:translate(-50%,-50%) rotate(-17deg); width:700px; }.field-lines::after { border-color:rgba(157,178,126,.12); height:590px; transform:translate(-50%,-50%) rotate(26deg); width:440px; }
.field-lines span { animation:field-breathe 15s ease-in-out infinite alternate; background:repeating-radial-gradient(ellipse at center,transparent 0 48px,rgba(235,197,136,.08) 49px 50px,transparent 51px 94px); border-radius:46% 54% 38% 62% / 60% 43% 57% 40%; height:630px; left:50%; position:absolute; top:50%; transform:translate(-50%,-50%) rotate(15deg); width:920px; }.field-lines i { background:radial-gradient(ellipse,rgba(226,176,102,.12),transparent 66%); border-radius:50%; height:560px; left:50%; position:absolute; top:50%; transform:translate(-50%,-50%); width:560px; }
@keyframes field-breathe { to { opacity:.36; transform:translate(-50%,-50%) rotate(21deg) scale(1.08); } }
@media (prefers-reduced-motion:reduce) { .field-lines span { animation:none; } }

.field-lines::before,.field-lines::after { border-color:rgba(123,153,255,.16); }.field-lines::after { border-color:rgba(98,230,255,.14); }.field-lines span { background:repeating-radial-gradient(ellipse at center,transparent 0 48px,rgba(113,151,255,.1) 49px 50px,transparent 51px 94px); }.field-lines i { background:radial-gradient(ellipse,rgba(101,91,255,.16),transparent 66%); }
</style>
