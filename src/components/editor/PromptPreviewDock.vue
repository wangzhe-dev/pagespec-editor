<script setup lang="ts">
import { usePagesStore, useProfilesStore, useUIStore } from '@/app/store';
import { buildPrompt, lint, type LintResult, type PromptResult } from '@/domain/compiler';
import { computed, ref } from 'vue';
// import { copyToClipboard } from '@/utils';
import {
  AlertTriangle,
  CheckCircle,
  Code,
  FileText,
  List,
  Settings2,
  Zap
} from 'lucide-vue-next';

const pagesStore = usePagesStore();
const profilesStore = useProfilesStore();
const uiStore = useUIStore();

const activeTab = ref<'prompt' | 'dsl' | 'lint'>('prompt');

const activePage = computed(() => pagesStore.activePage);
const activeProfile = computed(() => profilesStore.activeProfile);

// Compile prompt
const promptResult = computed<PromptResult | null>(() => {
  if (!activePage.value || !activeProfile.value) return null;
  return buildPrompt(activePage.value, activeProfile.value, uiStore.promptStyle);
});

// Run lint
const lintResult = computed<LintResult | null>(() => {
  if (!activePage.value || !activeProfile.value) return null;
  return lint(activePage.value, activeProfile.value);
});

// Copy handlers
// async function copyPrompt() {
//   if (!promptResult.value) return;
//   const success = await copyToClipboard(promptResult.value.mainPrompt);
//   if (success) {
//     uiStore.showToast('success', `已复制 (约 ${promptResult.value.tokenEstimate} tokens)`);
//   } else {
//     uiStore.showToast('error', '复制失败');
//   }
// }

// async function copyDSL() {
//   if (!promptResult.value) return;
//   const success = await copyToClipboard(promptResult.value.dsl);
//   if (success) {
//     uiStore.showToast('success', '已复制 DSL');
//   }
// }

// Style options
function toggleStyleOption(key: keyof typeof uiStore.promptStyle) {
  const current = uiStore.promptStyle[key];
  if (typeof current === 'boolean') {
    uiStore.setPromptStyle({ [key]: !current });
  }
}
</script>

<template>
  <div class="prompt-preview-dock">
    <!-- Tab bar -->
    <div class="dock-header">
      <div class="dock-tabs">
        <button
          :class="{ active: activeTab === 'prompt' }"
          @click="activeTab = 'prompt'"
        >
          <FileText :size="14" />
          Prompt
        </button>
        <button
          :class="{ active: activeTab === 'dsl' }"
          @click="activeTab = 'dsl'"
        >
          <Code :size="14" />
          DSL
        </button>
        <button
          :class="{ active: activeTab === 'lint' }"
          @click="activeTab = 'lint'"
        >
          <AlertTriangle :size="14" />
          检查
          <span v-if="lintResult && lintResult.errorCount > 0" class="badge error">
            {{ lintResult.errorCount }}
          </span>
          <span v-else-if="lintResult && lintResult.warningCount > 0" class="badge warning">
            {{ lintResult.warningCount }}
          </span>
        </button>
      </div>

      <div class="dock-actions">
        <!-- Style toggles -->
        <div class="style-toggles">
          <button
            :class="{ active: uiStore.promptStyle.skeletonMode }"
            @click="toggleStyleOption('skeletonMode')"
            title="骨架模式"
          >
            <Zap :size="12" />
          </button>
          <button
            :class="{ active: uiStore.promptStyle.includeDeliverables }"
            @click="toggleStyleOption('includeDeliverables')"
            title="包含交付清单"
          >
            <List :size="12" />
          </button>
        </div>

        <!-- <button
          class="copy-btn"
          @click="activeTab === 'dsl' ? copyDSL() : copyPrompt()"
          :disabled="!promptResult"
        >
          <Copy :size="14" />
          复制
        </button> -->
      </div>
    </div>

    <!-- Content -->
    <div class="dock-content">
      <!-- No page selected -->
      <div v-if="!activePage" class="empty-state">
        <p>请先选择一个页面</p>
      </div>

      <!-- No profile -->
      <div v-else-if="!activeProfile" class="empty-state">
        <Settings2 :size="24" />
        <p>请先配置项目</p>
        <button @click="uiStore.setPanelVisibility('profile', true)">
          打开项目配置
        </button>
      </div>

      <!-- Prompt tab -->
      <div v-else-if="activeTab === 'prompt'" class="content-area">
        <div class="prompt-meta">
          <span class="meta-item">
            <span class="meta-label">Token 估算:</span>
            <span class="meta-value">{{ promptResult?.tokenEstimate }}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">节点数:</span>
            <span class="meta-value">{{ promptResult?.metadata.blockCount }}</span>
          </span>
          <span class="meta-item">
            <span class="meta-label">联动数:</span>
            <span class="meta-value">{{ promptResult?.metadata.recipeCount }}</span>
          </span>
        </div>
        <pre class="prompt-text">{{ promptResult?.mainPrompt }}</pre>
      </div>

      <!-- DSL tab -->
      <div v-else-if="activeTab === 'dsl'" class="content-area">
        <pre class="dsl-text">{{ promptResult?.dsl }}</pre>
      </div>

      <!-- Lint tab -->
      <div v-else-if="activeTab === 'lint'" class="content-area">
        <div v-if="lintResult && lintResult.issues.length === 0" class="lint-success">
          <CheckCircle :size="32" class="success-icon" />
          <p>检查通过，无问题</p>
        </div>

        <div v-else-if="lintResult" class="lint-issues">
          <div class="lint-summary">
            <span v-if="lintResult.errorCount" class="error">
              {{ lintResult.errorCount }} 个错误
            </span>
            <span v-if="lintResult.warningCount" class="warning">
              {{ lintResult.warningCount }} 个警告
            </span>
            <span v-if="lintResult.infoCount" class="info">
              {{ lintResult.infoCount }} 个提示
            </span>
          </div>

          <div
            v-for="issue in lintResult.issues"
            :key="issue.code + issue.path"
            class="lint-issue"
            :class="issue.severity"
          >
            <div class="issue-header">
              <AlertTriangle v-if="issue.severity === 'error'" :size="14" class="error" />
              <AlertTriangle v-else-if="issue.severity === 'warning'" :size="14" class="warning" />
              <CheckCircle v-else :size="14" class="info" />
              <span class="issue-code">{{ issue.code }}</span>
            </div>
            <div class="issue-message">{{ issue.message }}</div>
            <div v-if="issue.suggestion" class="issue-suggestion">
              💡 {{ issue.suggestion }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prompt-preview-dock {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-elevated);
}

.dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}

.dock-tabs {
  display: flex;
  gap: 4px;
}

.dock-tabs button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.dock-tabs button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dock-tabs button.active {
  background: var(--accent-subtle);
  color: var(--accent-primary);
}

.badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.badge.error {
  background: var(--danger-subtle);
  color: var(--danger);
}

.badge.warning {
  background: var(--warning-subtle);
  color: var(--warning);
}

.dock-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.style-toggles {
  display: flex;
  gap: 2px;
  background: var(--bg-subtle);
  padding: 2px;
  border-radius: 4px;
}

.style-toggles button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: var(--text-muted);
  cursor: pointer;
}

.style-toggles button:hover {
  color: var(--text-secondary);
}

.style-toggles button.active {
  background: var(--accent-primary);
  color: white;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: var(--accent-primary);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.copy-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.copy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dock-content {
  flex: 1;
  overflow: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  gap: 12px;
}

.empty-state button {
  padding: 8px 16px;
  background: var(--accent-primary);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  cursor: pointer;
}

.content-area {
  padding: 12px;
}

.prompt-meta {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  background: var(--bg-subtle);
  border-radius: 6px;
  margin-bottom: 12px;
}

.meta-item {
  font-size: 12px;
}

.meta-label {
  color: var(--text-muted);
  margin-right: 4px;
}

.meta-value {
  color: var(--text-primary);
  font-weight: 500;
}

.prompt-text,
.dsl-text {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  padding: 12px;
  background: var(--bg-subtle);
  border-radius: 6px;
}

.lint-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: var(--success);
}

.success-icon {
  margin-bottom: 12px;
}

.lint-summary {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-subtle);
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 500;
}

.lint-summary .error { color: var(--danger); }
.lint-summary .warning { color: var(--warning); }
.lint-summary .info { color: var(--text-muted); }

.lint-issue {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.lint-issue.error {
  background: var(--danger-subtle);
  border-left: 3px solid var(--danger);
}

.lint-issue.warning {
  background: var(--warning-subtle);
  border-left: 3px solid var(--warning);
}

.lint-issue.info {
  background: var(--bg-subtle);
  border-left: 3px solid var(--text-muted);
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.issue-header .error { color: var(--danger); }
.issue-header .warning { color: var(--warning); }
.issue-header .info { color: var(--text-muted); }

.issue-code {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.issue-message {
  font-size: 13px;
  color: var(--text-primary);
}

.issue-suggestion {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 6px;
}
</style>
