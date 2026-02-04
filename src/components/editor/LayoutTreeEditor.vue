<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePagesStore, useUIStore } from '@/app/store';
import { getBlocksByCategory, getBlockMeta } from '@/domain/registry';
import type { LayoutNode } from '@/domain/schema';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Trash2,
  FileText,
  Columns,
  Layers,
  SquareStack,
  Table,
  GitBranch,
  ClipboardList,
  CreditCard,
  Square,
  PanelRight,
  BarChart3,
  Puzzle,
} from 'lucide-vue-next';

const pagesStore = usePagesStore();
const uiStore = useUIStore();

// Icon mapping
const iconMap: Record<string, any> = {
  FileText, Columns, Layers, SquareStack, Table, GitBranch,
  ClipboardList, CreditCard, Square, PanelRight, BarChart3, Puzzle,
};

const expandedNodes = ref<Set<string>>(new Set());
const showAddMenu = ref<string | null>(null);

const activePage = computed(() => pagesStore.activePage);
const selectedNodeId = computed(() => uiStore.selectedNodeId);

// Block categories for add menu
const blockCategories = computed(() => [
  { key: 'layout', label: '布局', blocks: getBlocksByCategory('layout') },
  { key: 'container', label: '容器', blocks: getBlocksByCategory('container').filter(b => b.type !== 'PageRoot') },
  { key: 'data', label: '数据', blocks: getBlocksByCategory('data') },
  { key: 'form', label: '表单', blocks: getBlocksByCategory('form') },
  { key: 'overlay', label: '弹层', blocks: getBlocksByCategory('overlay') },
  { key: 'chart', label: '图表', blocks: getBlocksByCategory('chart') },
]);

function toggleExpand(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId);
  } else {
    expandedNodes.value.add(nodeId);
  }
}

function selectNode(nodeId: string) {
  uiStore.selectNode(nodeId);
}

function toggleAddMenu(parentId: string, e: Event) {
  e.stopPropagation();
  showAddMenu.value = showAddMenu.value === parentId ? null : parentId;
}

function addNode(parentId: string, blockType: LayoutNode['type']) {
  if (!activePage.value) return;
  
  const newNode = pagesStore.addNode(activePage.value.id, parentId, blockType);
  if (newNode) {
    expandedNodes.value.add(parentId);
    uiStore.selectNode(newNode.id);
    uiStore.showToast('success', `已添加 ${getBlockMeta(blockType)?.label || blockType}`);
  }
  showAddMenu.value = null;
}

function deleteNode(nodeId: string, e: Event) {
  e.stopPropagation();
  if (!activePage.value) return;
  
  if (nodeId === activePage.value.root.id) {
    uiStore.showToast('warning', '不能删除根节点');
    return;
  }
  
  pagesStore.deleteNode(activePage.value.id, nodeId);
  if (selectedNodeId.value === nodeId) {
    uiStore.selectNode(null);
  }
  uiStore.showToast('info', '节点已删除');
}

function getIcon(iconName: string) {
  return iconMap[iconName] || Square;
}

function canHaveChildren(node: LayoutNode): boolean {
  const meta = getBlockMeta(node.type);
  return meta?.allowChildren ?? false;
}

function hasChildren(node: LayoutNode): boolean {
  return 'children' in node && Array.isArray(node.children) && node.children.length > 0;
}

function getNodeLabel(node: LayoutNode): string {
  const meta = getBlockMeta(node.type);
  if (node.label) return node.label;
  if (node.type === 'Tab' && 'title' in node) return (node as any).title;
  if (node.type === 'PageRoot' && 'title' in node) return (node as any).title;
  return meta?.label || node.type;
}

function closeMenu() {
  showAddMenu.value = null;
}

// Auto expand root
if (activePage.value) {
  expandedNodes.value.add(activePage.value.root.id);
}
</script>

<template>
  <div class="layout-tree-editor" @click="closeMenu">
    <div class="panel-header">
      <span class="panel-title">布局树</span>
    </div>
    
    <div v-if="!activePage" class="empty-tree">
      <p>请先选择一个页面</p>
    </div>
    
    <div v-else class="tree-container">
      <!-- Render tree recursively -->
      <template v-for="(node, index) in [activePage.root]" :key="node.id">
        <div class="tree-node-wrapper">
          <!-- Node row -->
          <div 
            class="tree-node"
            :class="{ 
              selected: node.id === selectedNodeId,
              'has-children': hasChildren(node as any),
            }"
            :style="{ paddingLeft: '12px' }"
            @click.stop="selectNode(node.id)"
          >
            <!-- Expand toggle -->
            <button 
              v-if="hasChildren(node as any)"
              class="expand-btn"
              @click.stop="toggleExpand(node.id)"
            >
              <ChevronDown v-if="expandedNodes.has(node.id)" :size="14" />
              <ChevronRight v-else :size="14" />
            </button>
            <span v-else class="expand-placeholder" />
            
            <!-- Icon -->
            <component 
              :is="getIcon(getBlockMeta(node.type)?.icon || 'Square')" 
              :size="14" 
              class="node-icon"
            />
            
            <!-- Label -->
            <span class="node-label">{{ getNodeLabel(node as any) }}</span>
            <span class="node-type">({{ node.type }})</span>
            
            <!-- Actions -->
            <div class="node-actions">
              <button 
                v-if="canHaveChildren(node as any)"
                class="action-btn add"
                @click.stop="toggleAddMenu(node.id, $event)"
                title="添加子节点"
              >
                <Plus :size="12" />
              </button>
            </div>
            
            <!-- Add menu -->
            <div 
              v-if="showAddMenu === node.id" 
              class="add-menu"
              @click.stop
            >
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
                  @click="addNode(node.id, block.type)"
                >
                  <component :is="getIcon(block.icon)" :size="14" />
                  <span>{{ block.label }}</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Children (recursive) -->
          <template v-if="expandedNodes.has(node.id) && hasChildren(node as any)">
            <ChildNodes 
              :nodes="(node as any).children"
              :depth="1"
              :expanded-nodes="expandedNodes"
              :selected-node-id="selectedNodeId"
              :show-add-menu="showAddMenu"
              :block-categories="blockCategories"
              :get-icon="getIcon"
              :can-have-children="canHaveChildren"
              :has-children="hasChildren"
              :get-node-label="getNodeLabel"
              @toggle-expand="toggleExpand"
              @select-node="selectNode"
              @toggle-add-menu="toggleAddMenu"
              @add-node="addNode"
              @delete-node="deleteNode"
            />
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<!-- Child nodes component for recursion -->
<script lang="ts">
import { defineComponent, PropType } from 'vue';

const ChildNodes = defineComponent({
  name: 'ChildNodes',
  props: {
    nodes: { type: Array as PropType<LayoutNode[]>, required: true },
    depth: { type: Number, required: true },
    expandedNodes: { type: Object as PropType<Set<string>>, required: true },
    selectedNodeId: { type: String as PropType<string | null>, default: null },
    showAddMenu: { type: String as PropType<string | null>, default: null },
    blockCategories: { type: Array as PropType<any[]>, required: true },
    getIcon: { type: Function, required: true },
    canHaveChildren: { type: Function, required: true },
    hasChildren: { type: Function, required: true },
    getNodeLabel: { type: Function, required: true },
  },
  emits: ['toggle-expand', 'select-node', 'toggle-add-menu', 'add-node', 'delete-node'],
  components: { ChevronRight, ChevronDown, Plus, Trash2 },
});
</script>

<template>
  <component :is="ChildNodes" v-bind="$props">
    <template v-for="node in nodes" :key="node.id">
      <div class="tree-node-wrapper">
        <div 
          class="tree-node"
          :class="{ 
            selected: node.id === selectedNodeId,
            'has-children': hasChildren(node),
          }"
          :style="{ paddingLeft: (depth * 16 + 12) + 'px' }"
          @click.stop="$emit('select-node', node.id)"
        >
          <button 
            v-if="hasChildren(node)"
            class="expand-btn"
            @click.stop="$emit('toggle-expand', node.id)"
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
              @click.stop="$emit('toggle-add-menu', node.id, $event)"
              title="添加子节点"
            >
              <Plus :size="12" />
            </button>
            <button 
              class="action-btn delete"
              @click.stop="$emit('delete-node', node.id, $event)"
              title="删除节点"
            >
              <Trash2 :size="12" />
            </button>
          </div>
          
          <div 
            v-if="showAddMenu === node.id" 
            class="add-menu"
            @click.stop
          >
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
                @click="$emit('add-node', node.id, block.type)"
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
            @toggle-expand="$emit('toggle-expand', $event)"
            @select-node="$emit('select-node', $event)"
            @toggle-add-menu="(id, e) => $emit('toggle-add-menu', id, e)"
            @add-node="(p, t) => $emit('add-node', p, t)"
            @delete-node="(id, e) => $emit('delete-node', id, e)"
          />
        </template>
      </div>
    </template>
  </component>
</template>

<style scoped>
.layout-tree-editor {
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

.empty-tree {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
}

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
}

.tree-node-wrapper {
  position: relative;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.1s;
  position: relative;
}

.tree-node:hover {
  background: var(--bg-hover);
}

.tree-node.selected {
  background: var(--accent-subtle);
}

.expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
}

.expand-btn:hover {
  background: var(--bg-subtle);
  color: var(--text-primary);
}

.expand-placeholder {
  width: 18px;
  flex-shrink: 0;
}

.node-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.tree-node.selected .node-icon {
  color: var(--accent-primary);
}

.node-label {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-type {
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
}

.node-actions {
  display: flex;
  gap: 2px;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.1s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
}

.action-btn:hover {
  background: var(--bg-subtle);
}

.action-btn.add:hover {
  background: var(--accent-subtle);
  color: var(--accent-primary);
}

.action-btn.delete:hover {
  background: var(--danger-subtle);
  color: var(--danger);
}

.add-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  padding: 8px;
  min-width: 200px;
  max-height: 300px;
  overflow: auto;
}

.add-menu-category {
  margin-bottom: 8px;
}

.add-menu-category:last-child {
  margin-bottom: 0;
}

.category-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 4px 8px;
}

.add-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
}

.add-menu-item:hover {
  background: var(--accent-subtle);
  color: var(--accent-primary);
}
</style>
