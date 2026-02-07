<script setup lang="ts">
import { computed } from 'vue';
import { useSpecStore } from '@/core/store';
import { isLeaf } from '@/core/model/guards';
import FieldEditor from './FieldEditor.vue';
import RecipePicker from './RecipePicker.vue';

const props = defineProps<{ nodeId: string }>();
const specStore = useSpecStore();

const node = computed(() => {
  const n = specStore.currentSpec?.nodes[props.nodeId];
  return n && isLeaf(n) ? n : null;
});

function patchMeta(patch: Record<string, unknown>) {
  if (!node.value) return;
  specStore.updateLeafMeta(node.value.id, patch as any);
}
</script>

<template>
  <section v-if="node" class="leaf-inspector">
    <h3>Leaf: {{ node.type }}</h3>

    <label>
      componentRef
      <input
        :value="node.leafMeta.componentRef"
        placeholder="JrTable / src/components/xxx"
        @change="patchMeta({ componentRef: ($event.target as HTMLInputElement).value })"
      />
    </label>

    <label>
      description
      <textarea
        rows="3"
        :value="node.leafMeta.description || ''"
        @change="patchMeta({ description: ($event.target as HTMLTextAreaElement).value })"
      />
    </label>

    <FieldEditor :node-id="node.id" />
    <RecipePicker :node-id="node.id" />
  </section>
</template>

<style scoped>
.leaf-inspector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

label {
  display: flex;
  flex-direction: column;
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
</style>
