<script setup lang="ts">
import { buildPrompt } from '@/core/prompt';
import { useSpecStore } from '@/core/store';
import { computed } from 'vue';
import { ElButton, ElTag, ElScrollbar, ElStatistic } from 'element-plus';
import { ChevronDown, ChevronUp } from 'lucide-vue-next';
import CopyBar from './CopyBar.vue';

const props = withDefaults(defineProps<{ collapsed?: boolean }>(), {
  collapsed: false,
});

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void;
}>();

const specStore = useSpecStore();

const isCollapsed = computed({
  get: () => props.collapsed,
  set: (value: boolean) => emit('update:collapsed', value),
});

const promptResult = computed(() => {
  if (!specStore.currentSpec) return null;
  return buildPrompt(specStore.currentSpec, {
    mode: specStore.settings.promptMode,
    includeGeometry: specStore.settings.includeGeometry,
  });
});

const copyText = computed(() => promptResult.value?.rawText || '');
const displayText = computed(() => copyText.value || '暂无可预览 Prompt');
const hasPrompt = computed(() => copyText.value.length > 0);

const sectionStats = computed(() => {
  const sections = promptResult.value?.sections;
  return [
    { key: 'deliverables', label: 'Deliverables', count: sections?.deliverables.length ?? 0 },
    { key: 'rules', label: 'Rules', count: sections?.hardRules.length ?? 0 },
    { key: 'dsl', label: 'DSL', count: sections?.dsl.length ?? 0 },
    { key: 'details', label: 'Leaf', count: sections?.leafDetails.length ?? 0 },
    { key: 'checklist', label: 'Checklist', count: sections?.checklist.length ?? 0 },
  ];
});

const lineCount = computed(() => (copyText.value ? copyText.value.split(/\r?\n/).length : 0));
const charCount = computed(() => copyText.value.length);
const approxTokens = computed(() => (copyText.value ? Math.ceil(copyText.value.length / 4) : 0));

const updatedAtText = computed(() => {
  if (!specStore.currentSpec) return '--';
  return new Date(specStore.currentSpec.meta.updatedAt).toLocaleString();
});

const collapsedSummary = computed(() => {
  if (!hasPrompt.value) {
    return '配置页面结构后，Prompt 会在这里自动编译为可复制的约束话术。';
  }
  const normalized = copyText.value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 140) return normalized;
  return `${normalized.slice(0, 140)}...`;
});
</script>

<template>
  <section class="prompt-preview" :class="{ collapsed: isCollapsed }">
    <header class="preview-header">
      <div class="title-wrap">
        <p class="eyebrow">Prompt Console</p>
        <h3>{{ specStore.currentSpec?.meta.name || 'Prompt Preview' }}</h3>
        <p class="subtitle">
          {{ hasPrompt ? `${lineCount} lines · ${charCount} chars · ~${approxTokens} tokens` : '等待页面配置' }}
        </p>
      </div>

      <ElButton
        class="toggle-btn"
        size="small"
        :aria-expanded="!isCollapsed"
        @click="isCollapsed = !isCollapsed"
      >
        <template #icon>
          <ChevronDown v-if="isCollapsed" :size="14" />
          <ChevronUp v-else :size="14" />
        </template>
        {{ isCollapsed ? '展开预览' : '收起预览' }}
      </ElButton>
    </header>

    <Transition name="fade-slide" mode="out-in">
      <section v-if="isCollapsed" key="collapsed" class="collapsed-body">
        <p class="collapsed-summary">{{ collapsedSummary }}</p>
        <div class="chip-row">
          <ElTag
            v-for="item in sectionStats"
            :key="item.key"
            size="small"
            effect="plain"
            round
            class="section-chip"
          >
            {{ item.label }} {{ item.count }}
          </ElTag>
        </div>
      </section>

      <section v-else key="expanded" class="expanded-body">
        <div class="toolbar-wrap">
          <CopyBar :text="copyText" />
        </div>

        <div class="stat-grid">
          <div class="stat-card">
            <ElStatistic title="Updated" :value="updatedAtText" class="stat-item" />
          </div>
          <div class="stat-card">
            <ElStatistic title="Lines" :value="lineCount" class="stat-item" />
          </div>
          <div class="stat-card">
            <ElStatistic title="Chars" :value="charCount" class="stat-item" />
          </div>
          <div class="stat-card">
            <ElStatistic title="Tokens~" :value="approxTokens" class="stat-item" />
          </div>
        </div>

        <div class="chip-row">
          <ElTag
            v-for="item in sectionStats"
            :key="item.key"
            size="small"
            effect="plain"
            round
            class="section-chip"
          >
            {{ item.label }} {{ item.count }}
          </ElTag>
        </div>

        <ElScrollbar class="preview-scroll">
          <pre class="preview-text">{{ displayText }}</pre>
        </ElScrollbar>
      </section>
    </Transition>
  </section>
</template>

<style scoped>
.prompt-preview {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 12px;
  border-radius: 12px;
  background:
    radial-gradient(circle at 100% 0%, rgba(var(--accent-primary-rgb), 0.08), transparent 34%),
    linear-gradient(180deg, rgba(var(--accent-primary-rgb), 0.04), transparent 34%);
}

.prompt-preview.collapsed {
  justify-content: center;
}

.preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.title-wrap {
  min-width: 0;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.title-wrap h3 {
  margin: 1px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--text-secondary);
}

/* ElButton toggle styling */
:deep(.toggle-btn.el-button) {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  border-radius: 9px;
  --el-button-bg-color: rgba(var(--accent-primary-rgb), 0.12);
  --el-button-border-color: rgba(var(--accent-primary-rgb), 0.32);
  --el-button-text-color: var(--accent-primary);
  --el-button-hover-bg-color: rgba(var(--accent-primary-rgb), 0.2);
  --el-button-hover-border-color: rgba(var(--accent-primary-rgb), 0.48);
  --el-button-hover-text-color: var(--accent-primary);
  transition: all var(--transition-normal);
}

:deep(.toggle-btn.el-button:hover) {
  transform: translateY(-1px);
}

.collapsed-body,
.expanded-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  flex: 1;
}

.collapsed-body {
  justify-content: center;
}

.collapsed-summary {
  margin: 0;
  border: 1px dashed var(--border-subtle);
  border-radius: 10px;
  padding: 9px 10px;
  background: color-mix(in srgb, var(--bg-base) 95%, white 5%);
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.toolbar-wrap {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 8px;
  background: color-mix(in srgb, var(--bg-base) 94%, white 6%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.stat-grid {
  display: grid;
  grid-template-columns: 2fr repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stat-card {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-base);
  padding: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

:deep(.stat-item .el-statistic__head) {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 2px;
}

:deep(.stat-item .el-statistic__content) {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.stat-item .el-statistic__content .el-statistic__number) {
  font-size: 13px;
  font-weight: 600;
}

.chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* ElTag chip styling */
:deep(.section-chip.el-tag) {
  font-size: 11px;
  color: var(--text-secondary);
  border-color: var(--border-subtle);
  background: var(--bg-subtle);
  padding: 3px 8px;
  height: auto;
}

.preview-scroll {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg-base) 96%, white 4%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.45),
    inset 0 0 0 1px rgba(var(--accent-primary-rgb), 0.05);
}

.preview-text {
  margin: 0;
  padding: 12px;
  color: var(--text-primary);
  font-size: 12px;
  line-height: 1.62;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 1024px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .prompt-preview {
    padding: 10px;
    gap: 8px;
  }

  .preview-header {
    align-items: center;
  }

  .stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
