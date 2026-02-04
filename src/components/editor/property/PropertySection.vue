<script setup lang="ts">
/**
 * PropertySection - 属性分组组件
 * 渲染一组属性字段
 */
import type { PropertyField as PropertyFieldType } from '@/domain/registry';
import ArrayField from './ArrayField.vue';
import PropertyField from './PropertyField.vue';

defineProps<{
  title?: string;
  fields: PropertyFieldType[];
  formData: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: 'update', key: string, value: any): void;
}>();

function handleUpdate(key: string, value: any) {
  emit('update', key, value);
}
</script>

<template>
  <div class="property-section">
    <div v-if="title" class="section-title">{{ title }}</div>

    <template v-for="field in fields" :key="field.key">
      <!-- 数组类型 -->
      <ArrayField
        v-if="field.type === 'array' && field.arrayItemSchema"
        :field="field"
        :value="formData[field.key]"
        @update="handleUpdate(field.key, $event)"
      />

      <!-- 普通字段 -->
      <PropertyField
        v-else
        :field="field"
        :value="formData[field.key]"
        @update="handleUpdate(field.key, $event)"
      />
    </template>
  </div>
</template>

<style scoped>
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
</style>
