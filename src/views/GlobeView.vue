<script setup>
import Globe from '../components/Globe.vue'
import axios from 'axios';
</script>

<template>
  <div class="globe">
    <Globe />
  </div>
</template>

<script>
export default {
  //*
  mounted() {
    axios.get('https://api.gbif.org/v1/species/match?kingdom=Archaea')
    .then(res => {
      console.log(res);
    })
    .catch(err => {
      console.error(err);
    });
  },
  //*/
};
</script>

<style>
.globe {
  pointer-events: all;
  z-index: 1;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
