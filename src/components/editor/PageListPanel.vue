<script setup lang="ts">
import { computed } from 'vue';
import { usePagesStore, useUIStore } from '@/app/store';
import { 
  Plus, 
  FileText, 
  Trash2, 
  Copy, 
  MoreVertical,
  Check,
} from 'lucide-vue-next';
import { formatRelativeTime } from '@/utils';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

const pages = computed(() => pagesStore.pages);

function createNewPage() {
  const page = pagesStore.createPage();
  uiStore.selectNode(page.root.id);
}

function selectPage(pageId: string) {
  pagesStore.setActivePage(pageId);
  const page = pagesStore.pages.find(p => p.id === pageId);
  if (page) {
    uiStore.selectNode(page.root.id);
  }
}

function duplicatePage(pageId: string, e: Event) {
  e.stopPropagation();
  const newPage = pagesStore.duplicatePage(pageId);
  if (newPage) {
    uiStore.showToast('success', '页面已复制');
  }
}

function deletePage(pageId: string, e: Event) {
  e.stopPropagation();
  if (confirm('确定要删除这个页面吗？')) {
    pagesStore.deletePage(pageId);
    uiStore.showToast('info', '页面已删除');
  }
}
</script>

<template>
  <div class="page-list-panel">
    <div class="panel-header">
      <span class="panel-title">页面列表</span>
      <button class="add-btn" @click="createNewPage" title="新建页面">
        <Plus :size="16" />
      </button>
    </div>
    
    <div class="page-list">
      <div 
        v-for="page in pages" 
        :key="page.id"
        class="page-item"
        :class="{ active: page.id === pagesStore.activePageId }"
        @click="selectPage(page.id)"
      >
        <div class="page-icon">
          <FileText :size="16" />
        </div>
        <div class="page-info">
          <div class="page-name">{{ page.name }}</div>
          <div class="page-meta">{{ formatRelativeTime(page.updatedAt) }}</div>
        </div>
        <div class="page-actions">
          <button 
            class="action-btn"
            @click="duplicatePage(page.id, $event)"
            title="复制"
          >
            <Copy :size="14" />
          </button>
          <button 
            class="action-btn danger"
            @click="deletePage(page.id, $event)"
            title="删除"
          >
            <Trash2 :size="14" />
          </button>
        </div>
        <div v-if="page.id === pagesStore.activePageId" class="active-indicator">
          <Check :size="14" />
        </div>
      </div>
      
      <div v-if="pages.length === 0" class="empty-pages">
        <p>暂无页面</p>
        <button class="create-btn" @click="createNewPage">
          <Plus :size="14" />
          创建第一个页面
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-list-panel {
  display: flex;
  flex-direction: column;
  height: 240px;
  min-height: 180px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.panel-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.add-btn:hover {
  background: var(--accent-primary);
  color: white;
}

.page-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.page-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}

.page-item:hover {
  background: var(--bg-hover);
}

.page-item.active {
  background: var(--accent-subtle);
}

.page-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.page-item.active .page-icon {
  color: var(--accent-primary);
}

.page-info {
  flex: 1;
  min-width: 0;
}

.page-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.page-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.page-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.page-item:hover .page-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.action-btn.danger:hover {
  background: var(--danger-subtle);
  color: var(--danger);
}

.active-indicator {
  position: absolute;
  right: 8px;
  color: var(--accent-primary);
}

.empty-pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--text-muted);
  text-align: center;
}

.empty-pages p {
  font-size: 13px;
  margin-bottom: 12px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--accent-primary);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.create-btn:hover {
  background: var(--accent-hover);
}
</style>
