import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSelectionStore = defineStore('selection', () => {
  const selectedNodeId = ref<string | null>(null);
  const hoveredNodeId = ref<string | null>(null);
  const breadcrumbPath = ref<string[]>([]);

  const hasSelection = computed(() => selectedNodeId.value !== null);

  function select(nodeId: string | null): void {
    selectedNodeId.value = nodeId;
  }

  function hover(nodeId: string | null): void {
    hoveredNodeId.value = nodeId;
  }

  function setBreadcrumb(path: string[]): void {
    breadcrumbPath.value = [...path];
  }

  return {
    selectedNodeId,
    hoveredNodeId,
    breadcrumbPath,
    hasSelection,
    select,
    hover,
    setBreadcrumb,
  };
});
