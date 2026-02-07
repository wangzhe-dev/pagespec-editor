import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface SpecHistoryItem {
  id: string;
  name: string;
  updatedAt: number;
  tags: string[];
  isTemplate: boolean;
}

export const useHistoryStore = defineStore('history', () => {
  const items = ref<SpecHistoryItem[]>([]);

  function upsert(item: SpecHistoryItem): void {
    const index = items.value.findIndex(entry => entry.id === item.id);
    if (index >= 0) {
      items.value.splice(index, 1, item);
      return;
    }
    items.value.unshift(item);
  }

  function remove(id: string): void {
    const index = items.value.findIndex(entry => entry.id === id);
    if (index >= 0) {
      items.value.splice(index, 1);
    }
  }

  function markTemplate(id: string, value: boolean): void {
    const current = items.value.find(entry => entry.id === id);
    if (!current) return;
    current.isTemplate = value;
  }

  return {
    items,
    upsert,
    remove,
    markTemplate,
  };
});
