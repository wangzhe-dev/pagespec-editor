<script setup lang="ts">
/**
 * ArrayField - 数组类型字段组件
 * 支持动态添加/删除/编辑数组项
 */
import type { PropertyField } from '@/domain/registry';
import { Plus, Trash2 } from 'lucide-vue-next';

const props = defineProps<{
  field: PropertyField;
  value: any[];
}>();

const emit = defineEmits<{
  (e: 'update', value: any[]): void;
}>();

// 确保有数组
const items = (): any[] => props.value || [];

// 添加项
function addItem() {
  const schema = props.field.arrayItemSchema || [];
  const newItem: Record<string, any> = {};
  for (const f of schema) {
    newItem[f.key] = f.defaultValue ?? '';
  }
  emit('update', [...items(), newItem]);
}

// 删除项
function removeItem(index: number) {
  const arr = [...items()];
  arr.splice(index, 1);
  emit('update', arr);
}

// 更新项字段
function updateItemField(index: number, fieldKey: string, value: any) {
  const arr = [...items()];
  arr[index] = { ...arr[index], [fieldKey]: value };
  emit('update', arr);
}

function handleInput(index: number, fieldKey: string, event: Event) {
  updateItemField(index, fieldKey, (event.target as HTMLInputElement).value);
}

function handleSelect(index: number, fieldKey: string, event: Event) {
  updateItemField(index, fieldKey, (event.target as HTMLSelectElement).value);
}

function handleCheckbox(index: number, fieldKey: string, event: Event) {
  updateItemField(index, fieldKey, (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <div class="array-field">
    <div class="array-header">
      <label>{{ field.label }}</label>
      <button class="add-item-btn" @click="addItem">
        <Plus :size="12" />
        添加
      </button>
    </div>

    <div
      v-for="(item, index) in items()"
      :key="index"
      class="array-item"
    >
      <div class="array-item-header">
        <span class="item-index">#{{ index + 1 }}</span>
        <button class="remove-item-btn" @click="removeItem(index)">
          <Trash2 :size="12" />
        </button>
      </div>
      <div class="array-item-fields">
        <template v-for="subField in field.arrayItemSchema" :key="subField.key">
          <div class="sub-field">
            <label>{{ subField.label }}</label>
            <input
              v-if="subField.type === 'text'"
              type="text"
              :value="item[subField.key] ?? ''"
              @input="handleInput(index, subField.key, $event)"
            />
            <select
              v-else-if="subField.type === 'select'"
              :value="item[subField.key] ?? ''"
              @change="handleSelect(index, subField.key, $event)"
            >
              <option v-for="opt in subField.options" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <label v-else-if="subField.type === 'boolean'" class="checkbox-label">
              <input
                type="checkbox"
                :checked="item[subField.key] ?? false"
                @change="handleCheckbox(index, subField.key, $event)"
              />
              {{ subField.label }}
            </label>
          </div>
        </template>
      </div>
    </div>

    <div v-if="!items().length" class="empty-array">
      暂无数据，点击上方按钮添加
    </div>
  </div>
</template>

<style scoped>
.array-field {
  background: var(--bg-subtle);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.array-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.array-header label {
  font-size: 12px;
  color: var(--text-secondary);
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

.sub-field input:focus,
.sub-field select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 14px;
  height: 14px;
  accent-color: var(--accent-primary);
}

.empty-array {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 12px;
}
</style>
