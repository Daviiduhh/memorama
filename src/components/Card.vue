<script setup lang="ts">
defineProps<{ character: string, hexadecimal: string, show: boolean }>()
defineEmits(['showCard'])

</script>

<template>
  <div @click="$emit('showCard')" :class="show ? 'card' : 'card hidden'">
    <h2 v-if="show" class="card__emoji" v-html="hexadecimal"></h2>
    <h2 v-else class="card__emoji">
      &#x2756;
    </h2>
  </div>
</template>

<style scoped>
.card {
  padding: 1rem;
  aspect-ratio: 1;
  border: 1px solid #04aa6d;
  border-radius: 5px;
  cursor: pointer;
}

.card:hover {
  border: 1px solid #F02E51;
  color: #F02E51;
}

.hidden {
  --s: 30px;

  --_g: radial-gradient(#0000 70%, #1a2030 71%);
  background:
    var(--_g), var(--_g) calc(var(--s)/2) calc(var(--s)/2),
    conic-gradient(#4E9F81 25%, #3D7D66 0 50%, #2D5B4A 0 75%, #1C392E 0);
  background-size: var(--s) var(--s);
}

.card__emoji {
  margin: 0;
  font-size: 2em;
  line-height: 1.5em;
}
</style>
