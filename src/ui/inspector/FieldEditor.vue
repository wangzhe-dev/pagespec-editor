<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore } from '@/core/store';
import { isLeaf } from '@/core/model/guards';

const props = defineProps<{ nodeId: string }>();
const specStore = useSpecStore();

const node = computed(() => {
  const n = specStore.currentSpec?.nodes[props.nodeId];
  return n && isLeaf(n) ? n : null;
});

function csvOf(key: string): string {
  const fields = node.value?.leafMeta.fields || {};
  return (fields[key] || []).join(', ');
}

function updateField(key: string, value: string): void {
  if (!node.value) return;
  specStore.updateLeafFields(node.value.id, key, value);
}
</script>

<template>
  <fieldset v-if="node" class="field-editor">
    <legend>Fields</legend>

    <label>
      columns
      <input :value="csvOf('columns')" @change="updateField('columns', ($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      form
      <input :value="csvOf('form')" @change="updateField('form', ($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      series
      <input :value="csvOf('series')" @change="updateField('series', ($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      items
      <input :value="csvOf('items')" @change="updateField('items', ($event.target as HTMLInputElement).value)" />
    </label>
  </fieldset>
</template>

<style scoped>
.field-editor {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px;
  display: grid;
  gap: 6px;
}

label {
  display: grid;
  gap: 4px;
  font-size: 12px;
}

input {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 5px;
}
</style>
