<template>

<div class="button">

    <div class="line top"></div>

    <div class="line bottom"></div>

    <div class="shine"></div>

    <span>

        <slot/>

    </span>

</div>

</template>

<style scoped>

.button{

position:relative;

width:100%;
max-width:390px;

height:54px;

display:flex;

justify-content:center;

align-items:center;

cursor:pointer;

overflow:hidden;

background:rgba(255,255,255,.02);

transition:.35s;

}

.button:hover{

background:rgba(112,184,255,.08);

transform:translateX(8px);

}

.line{

position:absolute;

left:0;

width:0;

height:1px;

background:#70B8FF;

transition:.5s;

}

.top{

top:0;

}

.bottom{

bottom:0;

}

.button:hover .top,
.button:hover .bottom{

width:100%;

}

.shine{

position:absolute;

left:-120%;

width:60%;

height:100%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.22),

transparent

);

transition:1s;

}

.button:hover .shine{

left:150%;

}

span{

position:relative;

color:white;

font-size:15px;

font-weight:300;

letter-spacing:4px;

transition:.3s;

}

.button:hover span{

letter-spacing:7px;

color:#70B8FF;

}

</style>
