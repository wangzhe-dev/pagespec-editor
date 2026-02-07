<script setup lang="ts">
import NodeRenderer from './NodeRenderer.vue';
</script>

<template>
  <section class="canvas-root">
    <header class="canvas-title">Canvas</header>
    <NodeRenderer />
  </section>
</template>

<style scoped>
.canvas-root {
  height: 100%;
  padding: 12px;
}

.canvas-title {
  font-weight: 600;
  margin-bottom: 8px;
}
</style>
