<script setup lang="ts">
import { usePagesStore, useProfilesStore, useUIStore } from '@/app/store';
import { buildPrompt } from '@/domain/compiler';
import { copyToClipboard, downloadJSON, importJSON } from '@/utils/index.ts';
import {
    Copy,
    Download,
    FileJson,
    Github,
    HelpCircle,
    Moon,
    Settings,
    Sun,
    Upload,
} from 'lucide-vue-next';
import { ref } from 'vue';

const pagesStore = usePagesStore();
const profilesStore = useProfilesStore();
const uiStore = useUIStore();

const fileInput = ref<HTMLInputElement | null>(null);

function toggleTheme() {
  uiStore.setTheme(uiStore.theme === 'dark' ? 'light' : 'dark');
}

function exportWorkspace() {
  const data = {
    schemaVersion: 1,
    pages: pagesStore.exportPages(),
    profiles: profilesStore.profiles,
    exportedAt: Date.now(),
  };
  downloadJSON(data, `pagespec-workspace-${Date.now()}.json`);
  uiStore.showToast('success', '工作区已导出');
}

async function importWorkspace() {
  fileInput.value?.click();
}

async function handleFileImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const data = await importJSON(file);
    if (data.pages) {
      pagesStore.importPages(data.pages);
    }
    uiStore.showToast('success', '工作区已导入');
  } catch (err) {
    uiStore.showToast('error', '导入失败：无效的 JSON 文件');
  }

  input.value = '';
}

async function copyCurrentPrompt() {
  const page = pagesStore.activePage;
  const profile = profilesStore.activeProfile;

  if (!page || !profile) {
    uiStore.showToast('warning', '请先选择页面和配置');
    return;
  }

  const result = buildPrompt(page, profile, uiStore.promptStyle);
  const success = await copyToClipboard(result.mainPrompt);

  if (success) {
    uiStore.showToast('success', `已复制到剪贴板 (约 ${result.tokenEstimate} tokens)`);
  } else {
    uiStore.showToast('error', '复制失败');
  }
}
</script>

<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <div class="logo">
        <FileJson :size="20" />
        <span class="logo-text">PageSpec Editor</span>
      </div>
      <span class="version">v0.1.0</span>
    </div>

    <div class="toolbar-center">
      <button
        class="toolbar-btn primary"
        @click="copyCurrentPrompt"
        :disabled="!pagesStore.activePage"
        title="复制 Prompt 到剪贴板"
      >
        <Copy :size="16" />
        <span>复制 Prompt</span>
      </button>
    </div>

    <div class="toolbar-right">
      <button class="toolbar-btn" @click="exportWorkspace" title="导出工作区">
        <Download :size="16" />
      </button>
      <button class="toolbar-btn" @click="importWorkspace" title="导入工作区">
        <Upload :size="16" />
      </button>
      <div class="toolbar-divider" />
      <button
        class="toolbar-btn"
        @click="uiStore.togglePanel('profile')"
        title="项目配置"
        :class="{ active: uiStore.panelVisibility.profile }"
      >
        <Settings :size="16" />
      </button>
      <button class="toolbar-btn" @click="toggleTheme" title="切换主题">
        <Moon v-if="uiStore.theme === 'light'" :size="16" />
        <Sun v-else :size="16" />
      </button>
      <div class="toolbar-divider" />
      <a
        class="toolbar-btn"
        href="https://github.com"
        target="_blank"
        title="GitHub"
      >
        <Github :size="16" />
      </a>
      <button class="toolbar-btn" title="帮助">
        <HelpCircle :size="16" />
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleFileImport"
      style="display: none"
    />
  </header>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.toolbar-left,
.toolbar-center,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent-primary);
}

.logo-text {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.version {
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 6px;
  background: var(--bg-subtle);
  border-radius: 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.active {
  background: var(--accent-primary);
  color: white;
}

.toolbar-btn.primary {
  background: var(--accent-primary);
  color: white;
}

.toolbar-btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-subtle);
  margin: 0 4px;
}

a.toolbar-btn {
  text-decoration: none;
}
</style>
