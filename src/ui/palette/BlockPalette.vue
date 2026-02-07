<script setup lang="ts">
import { computed, ref } from 'vue';
import { PALETTE_CONTAINERS, PALETTE_LEAVES } from '@/core/model/defaults';
import { useSpecStore } from '@/core/store';

const specStore = useSpecStore();
const keyword = ref('');
const mode = ref<'append' | 'replace'>('append');

const hostId = computed(() => {
  return specStore.selectedSlotHostId || specStore.currentSpec?.rootId || null;
});

const filteredLeaves = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return PALETTE_LEAVES;
  return PALETTE_LEAVES.filter(item => item.type.includes(q) || item.label.toLowerCase().includes(q));
});

const filteredContainers = computed(() => {
  const q = keyword.value.trim().toLowerCase();
  if (!q) return PALETTE_CONTAINERS;
  return PALETTE_CONTAINERS.filter(item => item.type.includes(q) || item.label.toLowerCase().includes(q));
});

function addLeaf(type: (typeof PALETTE_LEAVES)[number]['type']) {
  if (!hostId.value) return;
  specStore.addToSlot(hostId.value, { kind: 'leaf', type }, mode.value);
}

function addContainer(type: (typeof PALETTE_CONTAINERS)[number]['type']) {
  if (!hostId.value) return;
  specStore.addToSlot(hostId.value, { kind: 'container', type }, mode.value);
}
</script>

<template>
  <section class="palette">
    <header class="palette-header">
      <h3>Palette</h3>
      <small v-if="hostId">host: {{ hostId }}</small>
    </header>

    <div class="toolbar">
      <input v-model="keyword" placeholder="搜索 block..." />
      <select v-model="mode">
        <option value="append">append</option>
        <option value="replace">replace</option>
      </select>
    </div>

    <p v-if="specStore.recentPicks.length" class="recent">
      最近：{{ specStore.recentPicks.join(', ') }}
    </p>

    <div class="group">
      <h4>Leaf</h4>
      <button v-for="item in filteredLeaves" :key="item.type" @click="addLeaf(item.type)">
        + {{ item.label }}
      </button>
    </div>

    <div class="group">
      <h4>Container</h4>
      <button v-for="item in filteredContainers" :key="item.type" @click="addContainer(item.type)">
        + {{ item.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.palette {
  padding: 12px;
}

.palette-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar input,
.toolbar select {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 4px 6px;
}

.group {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.group h4 {
  font-size: 12px;
  color: var(--text-muted);
}

button {
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-primary);
  border-radius: 6px;
  padding: 4px 8px;
  text-align: left;
}

button:hover {
  border-color: var(--accent-primary);
}

.recent {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
