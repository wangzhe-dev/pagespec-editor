<script setup lang="ts">
import { computed } from 'vue';
import { useUIStore } from '@/core/store';
import { ElButton, ElTooltip, ElDivider } from 'element-plus';
import { Keyboard, Maximize2, Sun, Moon, HelpCircle, User } from 'lucide-vue-next';

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
      <ElTooltip content="快捷键" placement="bottom" :show-after="400">
        <ElButton class="icon-btn" text @click="$emit('show-shortcuts')">
          <Keyboard :size="16" />
        </ElButton>
      </ElTooltip>

      <ElTooltip content="全屏" placement="bottom" :show-after="400">
        <ElButton class="icon-btn" text @click="toggleFullscreen">
          <Maximize2 :size="16" />
        </ElButton>
      </ElTooltip>

      <ElTooltip :content="isDark ? '切换亮色' : '切换暗色'" placement="bottom" :show-after="400">
        <ElButton class="icon-btn" text @click="toggleTheme">
          <Sun v-if="isDark" :size="16" />
          <Moon v-else :size="16" />
        </ElButton>
      </ElTooltip>

      <ElDivider direction="vertical" class="header-divider" />

      <ElTooltip content="帮助文档" placement="bottom" :show-after="400">
        <ElButton class="icon-btn" text>
          <HelpCircle :size="16" />
        </ElButton>
      </ElTooltip>

      <ElTooltip content="用户" placement="bottom" :show-after="400">
        <ElButton class="avatar-btn" text>
          <User :size="16" />
        </ElButton>
      </ElTooltip>
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

/* Override ElButton defaults for icon buttons */
:deep(.icon-btn.el-button) {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 9px;
  background: var(--bg-base);
  color: var(--text-secondary);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  transition: all var(--transition-normal);
}

:deep(.icon-btn.el-button:hover) {
  border-color: rgba(var(--accent-primary-rgb), 0.28);
  background: rgba(var(--accent-primary-rgb), 0.08);
  color: var(--accent-primary);
  transform: translateY(-1px);
}

.header-divider {
  height: 18px;
  margin: 0 4px;
}

/* Override ElButton defaults for avatar button */
:deep(.avatar-btn.el-button) {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1.5px solid var(--border-strong);
  border-radius: 10px;
  background: linear-gradient(180deg, var(--bg-base), var(--bg-subtle));
  color: var(--text-secondary);
  margin-left: 2px;
  transition: all var(--transition-normal);
}

:deep(.avatar-btn.el-button:hover) {
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
  .header-divider {
    display: none;
  }
}
</style>
