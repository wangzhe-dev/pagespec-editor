<script setup lang="ts">
import { ref } from 'vue';
import { useSpecStore, useUIStore } from '@/core/store';

const specStore = useSpecStore();
const uiStore = useUIStore();
const importText = ref('');

function loadSpec(id: string) {
  specStore.loadDraft(id);
  uiStore.showToast('success', '已载入规格');
}

function deleteSpecById(id: string) {
  specStore.deleteDraft(id);
  uiStore.showToast('info', '已删除规格');
}

function exportCurrent() {
  try {
    importText.value = specStore.exportCurrent();
    uiStore.showToast('success', '已导出到下方文本框');
  } catch {
    uiStore.showToast('warning', '当前无可导出规格');
  }
}

function importSpec() {
  try {
    specStore.importFromJSON(importText.value);
    uiStore.showToast('success', '导入成功');
  } catch (error) {
    uiStore.showToast('error', `导入失败: ${(error as Error).message}`);
  }
}
</script>

<template>
  <section class="library-page">
    <header class="actions">
      <button @click="specStore.createNewSpec('新页面')">新建</button>
      <button @click="specStore.duplicateCurrent()">复制当前</button>
      <button @click="exportCurrent">导出当前</button>
      <button @click="importSpec">从文本导入</button>
    </header>

    <ul class="spec-list">
      <li v-for="item in specStore.specs" :key="item.id">
        <div>
          <strong>{{ item.name }}</strong>
          <p>{{ new Date(item.updatedAt).toLocaleString() }}</p>
        </div>
        <div class="row-actions">
          <button @click="loadSpec(item.id)">打开</button>
          <button @click="specStore.setTemplate(item.id, !item.isTemplate)">
            {{ item.isTemplate ? '取消模板' : '标记模板' }}
          </button>
          <button @click="deleteSpecById(item.id)">删除</button>
        </div>
      </li>
    </ul>

    <textarea v-model="importText" rows="10" placeholder="导入/导出 JSON" />
  </section>
</template>

<style scoped>
.library-page {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  height: 100%;
}

.actions,
.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.spec-list {
  list-style: none;
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.spec-list li {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.spec-list p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

textarea,
button {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 6px 8px;
}

textarea {
  width: 100%;
  resize: vertical;
}
</style>
