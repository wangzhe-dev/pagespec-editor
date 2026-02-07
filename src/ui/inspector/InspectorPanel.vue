<script setup lang="ts">
import ContainerInspector from './ContainerInspector.vue';
import LeafInspector from './LeafInspector.vue';
</script>

<template>
  <section class="inspector-panel">
    <header>Inspector</header>
    <LeafInspector />
    <ContainerInspector />
  </section>
</template>

<style scoped>
.inspector-panel {
  padding: 12px;
}
</style>
