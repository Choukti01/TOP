<template>

<aside class="inspector">

    <h2>

        Inspector

    </h2>

    <div class="empty">

        <div class="circle"></div>

        <h3>

            Nothing Selected

        </h3>

        <p>

            Select a node inside your world to inspect it.

        </p>

    </div>

</aside>

</template>

<style scoped>

.inspector{

height:100%;

display:flex;

flex-direction:column;

padding:32px;

background:#070b13;

border-left:1px solid rgba(255,255,255,.05);

color:white;

}

h2{

font-weight:300;

letter-spacing:6px;

margin-bottom:40px;

}

.empty{

margin:auto;

display:flex;

flex-direction:column;

align-items:center;

text-align:center;

opacity:.75;

}

.circle{

width:90px;

height:90px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(112,184,255,.35),

transparent

);

margin-bottom:30px;

animation:pulse 3s ease infinite;

}

h3{

margin-bottom:14px;

font-weight:300;

}

p{

line-height:28px;

font-size:14px;

opacity:.7;

}

@keyframes pulse{

0%{

transform:scale(.9);

opacity:.4;

}

50%{

transform:scale(1.1);

opacity:1;

}

100%{

transform:scale(.9);

opacity:.4;

}

}

</style>
