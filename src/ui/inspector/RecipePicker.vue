<script setup lang="ts">
import { computed } from 'vue';
import { BUILTIN_RECIPES } from '@/core/recipes';
import { useSpecStore } from '@/core/store';
import { isLeaf } from '@/core/model/guards';

const props = defineProps<{ nodeId: string }>();
const specStore = useSpecStore();

const node = computed(() => {
  const n = specStore.currentSpec?.nodes[props.nodeId];
  return n && isLeaf(n) ? n : null;
});

function checked(recipeId: string): boolean {
  return Boolean(node.value?.leafMeta.recipes?.includes(recipeId));
}

function toggle(recipeId: string, value: boolean) {
  if (!node.value) return;
  const current = node.value.leafMeta.recipes || [];
  const next = value
    ? [...new Set<string>([...current, recipeId])]
    : current.filter((id: string) => id !== recipeId);
  specStore.updateLeafMeta(node.value.id, { recipes: next });
}
</script>

<template>
  <fieldset v-if="node" class="recipe-picker">
    <legend>Recipes</legend>

    <label v-for="recipe in BUILTIN_RECIPES" :key="recipe.id" class="recipe-item">
      <input
        type="checkbox"
        :checked="checked(recipe.id)"
        @change="toggle(recipe.id, ($event.target as HTMLInputElement).checked)"
      />
      <div>
        <strong>{{ recipe.label }}</strong>
        <p>{{ recipe.trigger }} -> {{ recipe.action }}</p>
      </div>
    </label>
  </fieldset>
</template>

<style scoped>
.recipe-picker {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px;
  display: grid;
  gap: 8px;
}

.recipe-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px;
  align-items: start;
}

.recipe-item p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 12px;
}
</style>
