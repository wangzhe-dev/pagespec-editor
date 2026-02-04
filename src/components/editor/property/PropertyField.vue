<script setup lang="ts">
/**
 * PropertyField - 通用属性字段组件
 * 根据 field.type 渲染不同的输入控件
 */
import type { PropertyField } from '@/domain/registry';
import { computed } from 'vue';

const props = defineProps<{
  field: PropertyField;
  value: any;
}>();

const emit = defineEmits<{
  (e: 'update', value: any): void;
}>();

// 当前值，带默认值回退
const currentValue = computed(() => {
  return props.value ?? props.field.defaultValue ?? '';
});

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update', target.value);
}

function handleNumber(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update', Number(target.value));
}

function handleSelect(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update', target.value);
}

function handleCheckbox(event: Event) {
  const target = event.target as HTMLInputElement;
  emit('update', target.checked);
}
</script>

<template>
  <div class="property-field" :class="{ inline: field.type === 'boolean' }">
    <!-- Text input -->
    <template v-if="field.type === 'text'">
      <label>{{ field.label }}</label>
      <input
        type="text"
        :value="currentValue"
        @input="handleInput"
        :placeholder="field.placeholder"
      />
      <span v-if="field.description" class="field-hint">{{ field.description }}</span>
    </template>

    <!-- Number input -->
    <template v-else-if="field.type === 'number'">
      <label>{{ field.label }}</label>
      <input
        type="number"
        :value="value ?? field.defaultValue ?? 0"
        @input="handleNumber"
        :min="field.min"
        :max="field.max"
      />
    </template>

    <!-- Select -->
    <template v-else-if="field.type === 'select'">
      <label>{{ field.label }}</label>
      <select :value="currentValue" @change="handleSelect">
        <option v-for="opt in field.options" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </template>

    <!-- Boolean -->
    <template v-else-if="field.type === 'boolean'">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="value ?? field.defaultValue ?? false"
          @change="handleCheckbox"
        />
        {{ field.label }}
      </label>
    </template>
  </div>
</template>

<style scoped>
.property-field {
  margin-bottom: 12px;
}

.property-field label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.property-field.inline label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.property-field input[type="text"],
.property-field input[type="number"],
.property-field select {
  width: 100%;
  padding: 8px 10px;
  background: var(--bg-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 13px;
}

.property-field input:focus,
.property-field select:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.property-field input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent-primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.field-hint {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
