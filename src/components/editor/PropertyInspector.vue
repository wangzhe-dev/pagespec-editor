<script setup lang="ts">
/**
 * PropertyInspector - 属性检查器
 * 显示和编辑选中节点的属性
 */
import { usePagesStore, useUIStore } from '@/app/store';
import { getBlockMeta } from '@/domain/registry';
import type { LayoutNode } from '@/domain/schema';
import { debounce } from '@/utils';
import { ChevronDown, ChevronRight, Settings2 } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { PropertyField, PropertySection } from './property';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

const activePage = computed(() => pagesStore.activePage);
const selectedNodeId = computed(() => uiStore.selectedNodeId);
const propertyMode = computed(() => uiStore.propertyMode);

// 查找选中节点
const selectedNode = computed<LayoutNode | null>(() => {
  if (!activePage.value || !selectedNodeId.value) return null;
  return findNode(activePage.value.root as unknown as LayoutNode, selectedNodeId.value);
});

const blockMeta = computed(() => {
  if (!selectedNode.value) return null;
  return getBlockMeta(selectedNode.value.type);
});

const propertySchema = computed(() => blockMeta.value?.propertySchema || []);
const advancedSchema = computed(() => blockMeta.value?.advancedSchema || []);

const showAdvanced = ref(false);

// 本地表单状态
const formData = ref<Record<string, any>>({});

// 同步表单数据与选中节点
watch(selectedNode, (node) => {
  if (node) {
    formData.value = { ...node };
  } else {
    formData.value = {};
  }
}, { immediate: true, deep: true });

// 防抖更新
const debouncedUpdate = debounce((key: string, value: any) => {
  if (!activePage.value || !selectedNodeId.value) return;
  pagesStore.updateNode(activePage.value.id, selectedNodeId.value, { [key]: value });
}, 300);

function updateField(key: string, value: any) {
  formData.value[key] = value;
  debouncedUpdate(key, value);
}

function findNode(root: LayoutNode, nodeId: string): LayoutNode | null {
  if (root.id === nodeId) return root;
  if ('children' in root && Array.isArray(root.children)) {
    for (const child of root.children) {
      const found = findNode(child, nodeId);
      if (found) return found;
    }
  }
  return null;
}
</script>

<template>
  <div class="property-inspector">
    <div class="panel-header">
      <span class="panel-title">属性</span>
      <div class="mode-switch">
        <button
          :class="{ active: propertyMode === 'basic' }"
          @click="uiStore.setPropertyMode('basic')"
        >
          基础
        </button>
        <button
          :class="{ active: propertyMode === 'advanced' }"
          @click="uiStore.setPropertyMode('advanced')"
        >
          高级
        </button>
      </div>
    </div>

    <div v-if="!selectedNode" class="empty-state">
      <Settings2 :size="32" class="empty-icon" />
      <p>选择一个节点查看属性</p>
    </div>

    <div v-else class="property-form">
      <!-- 节点信息 -->
      <div class="node-info">
        <div class="node-type-badge">{{ selectedNode.type }}</div>
        <input
          type="text"
          class="node-label-input"
          :value="formData.label || ''"
          @input="updateField('label', ($event.target as HTMLInputElement).value)"
          placeholder="节点标签（可选）"
        />
      </div>

      <!-- 基础属性 -->
      <PropertySection
        title="基础属性"
        :fields="propertySchema"
        :form-data="formData"
        @update="updateField"
      />

      <!-- 高级属性 -->
      <div v-if="advancedSchema.length > 0 && propertyMode === 'advanced'" class="property-section">
        <button class="section-toggle" @click="showAdvanced = !showAdvanced">
          <ChevronDown v-if="showAdvanced" :size="14" />
          <ChevronRight v-else :size="14" />
          <span>高级属性</span>
        </button>

        <div v-if="showAdvanced" class="advanced-fields">
          <PropertyField
            v-for="field in advancedSchema"
            :key="field.key"
            :field="field"
            :value="formData[field.key]"
            @update="updateField(field.key, $event)"
          />
        </div>
      </div>

      <!-- 组件覆盖 -->
      <div v-if="propertyMode === 'advanced'" class="property-section">
        <div class="section-title">组件覆盖</div>
        <div class="form-field">
          <label>使用组件</label>
          <input
            type="text"
            :value="formData.componentOverride ?? ''"
            @input="updateField('componentOverride', ($event.target as HTMLInputElement).value)"
            placeholder="留空使用默认组件"
          />
          <span class="field-hint">覆盖项目配置中的组件映射</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.property-inspector {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.mode-switch {
  display: flex;
  background: var(--bg-subtle);
  border-radius: 4px;
  padding: 2px;
}

.mode-switch button {
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: 3px;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.mode-switch button.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  padding: 24px;
}

.empty-icon {
  opacity: 0.3;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 13px;
}

.property-form {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.node-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.node-type-badge {
  padding: 4px 8px;
  background: var(--accent-subtle);
  color: var(--accent-primary);
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  flex-shrink: 0;
}

.node-label-input {
  flex: 1;
  padding: 6px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.node-label-input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.property-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.section-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 0;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.section-toggle:hover {
  color: var(--text-primary);
}

.form-field {
  margin-bottom: 12px;
}

.form-field label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.form-field.inline label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-field input[type="text"],
.form-field input[type="number"],
.form-field select {
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.form-field input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-primary);
}

.field-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}

.array-field {
  background: var(--bg-subtle);
  border-radius: 8px;
  padding: 12px;
}

.array-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.array-header label {
  margin-bottom: 0;
}

.add-item-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--accent-primary);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 11px;
  cursor: pointer;
}

.add-item-btn:hover {
  background: var(--accent-hover);
}

.array-item {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
}

.array-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.item-index {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.remove-item-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
}

.remove-item-btn:hover {
  background: var(--danger-subtle);
  color: var(--danger);
}

.array-item-fields {
  display: grid;
  gap: 8px;
}

.sub-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sub-field label {
  font-size: 11px;
  color: var(--text-muted);
}

.sub-field input,
.sub-field select {
  padding: 6px 8px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px !important;
  cursor: pointer;
}

.empty-array {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 12px;
}

.advanced-fields {
  padding-top: 8px;
}
</style>
