<script setup lang="ts">
import { getBlockMeta } from '@/domain/registry';
import type { LayoutNode } from '@/domain/schema';
import { ChevronRight, ChevronDown, Plus, Trash2 } from 'lucide-vue-next';

defineOptions({ name: 'ChildNodes' });

defineProps<{
  nodes: LayoutNode[];
  depth: number;
  expandedNodes: Set<string>;
  selectedNodeId: string | null;
  showAddMenu: string | null;
  blockCategories: Array<{
    key: string;
    label: string;
    blocks: Array<{ type: LayoutNode['type']; label: string; icon: string }>;
  }>;
  getIcon: (iconName: string) => any;
  canHaveChildren: (node: LayoutNode) => boolean;
  hasChildren: (node: LayoutNode) => boolean;
  getNodeLabel: (node: LayoutNode) => string;
}>();

const emit = defineEmits<{
  (e: 'toggle-expand', nodeId: string): void;
  (e: 'select-node', nodeId: string): void;
  (e: 'toggle-add-menu', nodeId: string, event: Event): void;
  (e: 'add-node', parentId: string, type: LayoutNode['type']): void;
  (e: 'delete-node', nodeId: string, event: Event): void;
}>();
</script>

<template>
  <template v-for="node in nodes" :key="node.id">
    <div class="tree-node-wrapper">
      <div
        class="tree-node"
        :class="{
          selected: node.id === selectedNodeId,
          'has-children': hasChildren(node),
        }"
        :style="{ paddingLeft: (depth * 16 + 12) + 'px' }"
        @click.stop="emit('select-node', node.id)"
      >
        <button
          v-if="hasChildren(node)"
          class="expand-btn"
          @click.stop="emit('toggle-expand', node.id)"
        >
          <ChevronDown v-if="expandedNodes.has(node.id)" :size="14" />
          <ChevronRight v-else :size="14" />
        </button>
        <span v-else class="expand-placeholder" />

        <component
          :is="getIcon(getBlockMeta(node.type)?.icon || 'Square')"
          :size="14"
          class="node-icon"
        />

        <span class="node-label">{{ getNodeLabel(node) }}</span>
        <span class="node-type">({{ node.type }})</span>

        <div class="node-actions">
          <button
            v-if="canHaveChildren(node)"
            class="action-btn add"
            @click.stop="emit('toggle-add-menu', node.id, $event)"
            title="添加子节点"
          >
            <Plus :size="12" />
          </button>
          <button
            class="action-btn delete"
            @click.stop="emit('delete-node', node.id, $event)"
            title="删除节点"
          >
            <Trash2 :size="12" />
          </button>
        </div>

        <div v-if="showAddMenu === node.id" class="add-menu" @click.stop>
          <div
            v-for="category in blockCategories"
            :key="category.key"
            class="add-menu-category"
          >
            <div class="category-label">{{ category.label }}</div>
            <button
              v-for="block in category.blocks"
              :key="block.type"
              class="add-menu-item"
              @click="emit('add-node', node.id, block.type)"
            >
              <component :is="getIcon(block.icon)" :size="14" />
              <span>{{ block.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <template v-if="expandedNodes.has(node.id) && hasChildren(node)">
        <ChildNodes
          :nodes="node.children"
          :depth="depth + 1"
          :expanded-nodes="expandedNodes"
          :selected-node-id="selectedNodeId"
          :show-add-menu="showAddMenu"
          :block-categories="blockCategories"
          :get-icon="getIcon"
          :can-have-children="canHaveChildren"
          :has-children="hasChildren"
          :get-node-label="getNodeLabel"
          @toggle-expand="emit('toggle-expand', $event)"
          @select-node="emit('select-node', $event)"
          @toggle-add-menu="(id, e) => emit('toggle-add-menu', id, e)"
          @add-node="(p, t) => emit('add-node', p, t)"
          @delete-node="(id, e) => emit('delete-node', id, e)"
        />
      </template>
    </div>
  </template>
</template>
