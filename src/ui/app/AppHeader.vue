<script setup lang="ts">
import { computed } from 'vue';
import { useUIStore } from '@/core/store';

const uiStore = useUIStore();

const isDark = computed(() => uiStore.theme === 'dark');

function toggleTheme() {
  uiStore.setTheme(isDark.value ? 'light' : 'dark');
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo-shell">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="var(--accent-primary)" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill="var(--accent-primary)" opacity="0.6" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill="var(--accent-primary)" opacity="0.6" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill="var(--accent-primary)" opacity="0.3" />
        </svg>
      </div>
      <div class="brand-block">
        <span class="brand">PageSpec Studio</span>
        <span class="subtitle">Structure-First Prompt Builder</span>
      </div>
      <span class="version">Beta v1.0</span>
    </div>

    <nav class="header-right">
      <!-- Keyboard shortcuts -->
      <button class="icon-btn" title="快捷键" @click="$emit('show-shortcuts')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M6 12h.01"/><path d="M18 12h.01"/><path d="M8 16h8"/></svg>
      </button>

      <!-- Fullscreen -->
      <button class="icon-btn" title="全屏" @click="toggleFullscreen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
      </button>

      <!-- Theme toggle -->
      <button class="icon-btn" :title="isDark ? '切换亮色' : '切换暗色'" @click="toggleTheme">
        <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>
      </button>

      <div class="divider" />

      <!-- Help / Docs -->
      <button class="icon-btn" title="帮助文档">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </button>

      <!-- User avatar -->
      <button class="avatar-btn" title="用户">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </button>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  flex-shrink: 0;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.08) 0%, rgba(var(--accent-primary-rgb), 0.02) 100%);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.logo-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  border: 1px solid rgba(var(--accent-primary-rgb), 0.24);
  background: linear-gradient(145deg, rgba(var(--accent-primary-rgb), 0.16), rgba(var(--accent-primary-rgb), 0.05));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.brand-block {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
  letter-spacing: 0.01em;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.subtitle {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.version {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-primary);
  background: rgba(var(--accent-primary-rgb), 0.13);
  border: 1px solid rgba(var(--accent-primary-rgb), 0.25);
  padding: 2px 7px;
  border-radius: 999px;
  line-height: 1.3;
  margin-left: 2px;
  flex-shrink: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: var(--bg-base);
  color: var(--text-secondary);
  border-radius: 9px;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
}

.icon-btn:hover {
  border-color: rgba(var(--accent-primary-rgb), 0.28);
  background: rgba(var(--accent-primary-rgb), 0.08);
  color: var(--accent-primary);
  transform: translateY(-1px);
}

.divider {
  width: 1px;
  height: 18px;
  background: var(--border-subtle);
  margin: 0 4px;
}

.avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1.5px solid var(--border-strong);
  background: linear-gradient(180deg, var(--bg-base), var(--bg-subtle));
  color: var(--text-secondary);
  border-radius: 10px;
  cursor: pointer;
  margin-left: 2px;
  transition: all var(--transition-normal);
}

.avatar-btn:hover {
  border-color: rgba(var(--accent-primary-rgb), 0.35);
  color: var(--accent-primary);
  background: rgba(var(--accent-primary-rgb), 0.08);
}

@media (max-width: 980px) {
  .app-header {
    min-height: 52px;
    padding: 8px 10px;
  }

  .subtitle {
    display: none;
  }
}

@media (max-width: 720px) {
  .version,
  .divider {
    display: none;
  }
}
</style>
