<template>

<button
class="enter"
@click="$emit('enter')"
>

ENTER

</button>

</template>

<style scoped>

.enter{

    margin-top:50px;

    padding:18px 50px;

    background:white;

    color:black;

    border:none;

    border-radius:50px;

    cursor:pointer;

    font-size:18px;

    transition:.3s;

}

.enter:hover{

    transform:scale(1.05);

}

</style>
