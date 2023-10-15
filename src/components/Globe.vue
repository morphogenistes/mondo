<script setup>
import ThreeGlobe from 'three-globe';
</script>

<template>
  Gimme the globe !
</template>

<script>
const myGlobe = new ThreeGlobe()
  .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg');
const myScene = new THREE.Scene();
myScene.add(myGlobe);
export default {

};
</script>

<style>
</style>