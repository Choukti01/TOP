<template>

<aside class="sidebar">

    <div class="logo">

        TOP

    </div>

    <nav>

        <button>Overview</button>

        <button>Projects</button>

        <button>Knowledge</button>

        <button>Research</button>

        <button>AI</button>

        <button>Assets</button>

        <button>Worlds</button>

    </nav>

    <div class="version">

        TOP Creator OS

        <span>v0.1 Genesis</span>

    </div>

</aside>

</template>

<style scoped>

.sidebar{

height:100%;

display:flex;

flex-direction:column;

padding:32px;

background:#070b13;

border-right:1px solid rgba(255,255,255,.05);

}

.logo{

font-size:42px;

font-weight:200;

letter-spacing:14px;

color:#70B8FF;

margin-bottom:60px;

}

nav{

display:flex;

flex-direction:column;

gap:12px;

}

button{

height:48px;

background:none;

border:none;

color:white;

text-align:left;

padding-left:16px;

font-size:15px;

cursor:pointer;

border-radius:10px;

transition:.25s;

}

button:hover{

background:rgba(112,184,255,.08);

transform:translateX(6px);

}

.version{

margin-top:auto;

opacity:.5;

font-size:13px;

line-height:22px;

}

.version span{

display:block;

color:#70B8FF;

}

</style>
