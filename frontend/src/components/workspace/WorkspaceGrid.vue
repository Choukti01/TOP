<template>

<div class="grid"></div>

</template>

<style scoped>

.grid{

position:absolute;

inset:0;

background-image:

radial-gradient(circle at center,rgba(100,184,255,.08),transparent 42%),

linear-gradient(rgba(158,196,244,.045) 1px,transparent 1px),

linear-gradient(90deg,rgba(158,196,244,.045) 1px,transparent 1px);

background-size:auto,48px 48px,48px 48px;

mask-image:linear-gradient(to bottom,transparent,black 13%,black 86%,transparent);

opacity:.72;

pointer-events:none;

}

.grid::after{

animation:grid-breathe 11s ease-in-out infinite alternate;

background:radial-gradient(circle at 50% 50%,rgba(112,184,255,.08),transparent 44%);

content:"";

inset:0;

position:absolute;

}

@keyframes grid-breathe{

to{opacity:.35;transform:scale(1.08);}

}

@media (prefers-reduced-motion:reduce){

.grid::after{animation:none;}

}

</style>
