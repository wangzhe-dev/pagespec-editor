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
      <div class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1.5" fill="var(--accent-primary)" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" fill="var(--accent-primary)" opacity="0.6" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" fill="var(--accent-primary)" opacity="0.6" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" fill="var(--accent-primary)" opacity="0.3" />
        </svg>
      </div>
      <span class="brand">PageSpec</span>
      <span class="version">v1.0</span>
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
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo {
  display: flex;
  align-items: center;
}

.brand {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.version {
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-subtle);
  padding: 1px 5px;
  border-radius: 4px;
  line-height: 1.4;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--border-subtle);
  margin: 0 4px;
}

.avatar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1.5px solid var(--border-strong);
  background: var(--bg-subtle);
  color: var(--text-muted);
  border-radius: 50%;
  cursor: pointer;
  margin-left: 4px;
  transition: all var(--transition-fast);
}

.avatar-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
</style>
