<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore } from '@/core/store';
import { isContainer, isSlotHost } from '@/core/model/guards';

const props = defineProps<{ nodeId: string }>();
const specStore = useSpecStore();

const node = computed(() => {
  const n = specStore.currentSpec?.nodes[props.nodeId];
  return n && isContainer(n) ? n : null;
});

const propsText = computed(() => JSON.stringify(node.value?.props || {}, null, 2));

function setTitle(value: string): void {
  if (!node.value) return;
  specStore.updateContainerProps(node.value.id, { title: value });
}

function replaceProps(raw: string): void {
  if (!node.value) return;
  try {
    const parsed = JSON.parse(raw);
    specStore.updateContainerProps(node.value.id, parsed);
  } catch {
    // ignore invalid json
  }
}

function clearCurrentSlot() {
  if (!node.value || !isSlotHost(node.value)) return;
  specStore.clearHostSlot(node.value.id);
}

function addQuickGridItem(mode: 'append' | 'replace') {
  if (!node.value || !isSlotHost(node.value)) return;
  specStore.addToSlot(node.value.id, { kind: 'container', type: 'gridItem' }, mode);
}
</script>

<template>
  <section v-if="node" class="container-inspector">
    <h3>Container: {{ node.type }}</h3>

    <label>
      title
      <input :value="String(node.props.title || '')" @change="setTitle(($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      props(JSON)
      <textarea rows="8" :value="propsText" @change="replaceProps(($event.target as HTMLTextAreaElement).value)" />
    </label>

    <div v-if="isSlotHost(node)" class="slot-actions">
      <button @click="addQuickGridItem('append')">追加 GridItem</button>
      <button @click="addQuickGridItem('replace')">替换为 GridItem</button>
      <button @click="clearCurrentSlot">清空 Slot</button>
    </div>
  </section>
</template>

<style scoped>
.container-inspector {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

label {
  display: grid;
  gap: 4px;
  font-size: 12px;
}

input,
textarea {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 6px;
}

.slot-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

button {
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-primary);
  border-radius: 6px;
  padding: 4px 8px;
}

button:hover {
  border-color: var(--accent-primary);
}
</style>
