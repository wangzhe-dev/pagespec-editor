<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useSpecStore } from '@/core/store';
import { isContainer } from '@/core/model/guards';

const NodeRenderer = defineAsyncComponent(() => import('./NodeRenderer.vue'));

const props = defineProps<{ gridId: string }>();

const specStore = useSpecStore();

const gridLayoutComp = ref<any>(null);
const gridItemComp = ref<any>(null);
const pluginMessage = ref('未安装 vue-grid-layout，当前使用回退模式。');

const gridNode = computed(() => {
  const node = specStore.currentSpec?.nodes[props.gridId];
  if (!node || !isContainer(node) || node.type !== 'grid') return null;
  return node;
});

const items = computed(() => {
  const source = gridNode.value?.items || [];
  return source.slice().sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    if (a.x !== b.x) return a.x - b.x;
    return a.itemId.localeCompare(b.itemId);
  });
});

const layout = computed(() =>
  items.value.map(item => ({
    i: item.itemId,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  })),
);

const colNum = computed(() => Number(gridNode.value?.props.colNum || 12));
const rowHeight = computed(() => Number(gridNode.value?.props.rowHeight || 30));
const margin = computed(() => {
  const value = gridNode.value?.props.margin;
  if (Array.isArray(value) && value.length === 2) {
    return value as [number, number];
  }
  return [8, 8] as [number, number];
});
const preventCollision = computed(() => Boolean(gridNode.value?.props.preventCollision ?? true));

const hasPlugin = computed(() => Boolean(gridLayoutComp.value && gridItemComp.value));

async function tryLoadGridPlugin() {
  try {
    const moduleName = 'vue-grid-layout';
    const mod = (await import(/* @vite-ignore */ moduleName)) as any;
    gridLayoutComp.value = mod.GridLayout || mod.default?.GridLayout || mod.default;
    gridItemComp.value = mod.GridItem || mod.default?.GridItem;

    if (!gridLayoutComp.value || !gridItemComp.value) {
      pluginMessage.value = 'vue-grid-layout 已找到，但导出不匹配，使用回退模式。';
      return;
    }

    pluginMessage.value = 'vue-grid-layout 已启用。';
  } catch {
    pluginMessage.value = '未检测到 vue-grid-layout，使用回退模式。';
  }
}

function updateByLayout(nextLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>) {
  for (const item of nextLayout) {
    specStore.updateGridItemGeometry(props.gridId, item.i, {
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    });
  }
}

function removeItem(itemId: string) {
  specStore.removeGridItemById(props.gridId, itemId);
}

function patchGeom(itemId: string, key: 'x' | 'y' | 'w' | 'h', value: string) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return;
  specStore.updateGridItemGeometry(props.gridId, itemId, { [key]: numeric });
}

onMounted(() => {
  tryLoadGridPlugin();
});
</script>

<template>
  <div v-if="!gridNode" class="grid-fallback">Grid 节点不存在</div>

  <div v-else class="grid-canvas">
    <p class="grid-plugin-hint">{{ pluginMessage }}</p>

    <component
      :is="gridLayoutComp"
      v-if="hasPlugin"
      :layout="layout"
      :col-num="colNum"
      :row-height="rowHeight"
      :margin="margin"
      :is-draggable="true"
      :is-resizable="true"
      :vertical-compact="true"
      :prevent-collision="preventCollision"
      @layout-updated="updateByLayout"
    >
      <component
        :is="gridItemComp"
        v-for="item in items"
        :key="item.itemId"
        :i="item.itemId"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
      >
        <div class="grid-item-box">
          <div class="grid-item-toolbar">
            <span>{{ item.itemId }}</span>
            <button @click.stop="removeItem(item.itemId)">删除</button>
          </div>
          <NodeRenderer :node-id="item.childId" />
        </div>
      </component>
    </component>

    <div v-else class="grid-fallback-list">
      <article v-for="item in items" :key="item.itemId" class="fallback-item">
        <header>
          <strong>{{ item.itemId }}</strong>
          <button @click.stop="removeItem(item.itemId)">删除</button>
        </header>

        <div class="geom-editor">
          <label>
            x
            <input :value="item.x" @change="patchGeom(item.itemId, 'x', ($event.target as HTMLInputElement).value)" />
          </label>
          <label>
            y
            <input :value="item.y" @change="patchGeom(item.itemId, 'y', ($event.target as HTMLInputElement).value)" />
          </label>
          <label>
            w
            <input :value="item.w" @change="patchGeom(item.itemId, 'w', ($event.target as HTMLInputElement).value)" />
          </label>
          <label>
            h
            <input :value="item.h" @change="patchGeom(item.itemId, 'h', ($event.target as HTMLInputElement).value)" />
          </label>
        </div>

        <NodeRenderer :node-id="item.childId" />
      </article>
    </div>
  </div>
</template>

<style scoped>
.grid-canvas {
  border: 1px dashed var(--border-subtle);
  border-radius: 8px;
  padding: 8px;
  background: var(--bg-base);
}

.grid-plugin-hint {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.grid-item-box,
.fallback-item {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-elevated);
  padding: 6px;
}

.grid-item-toolbar,
.fallback-item header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.grid-fallback-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.geom-editor {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.geom-editor label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.geom-editor input {
  width: 100%;
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  background: var(--bg-base);
  color: var(--text-primary);
  padding: 2px 4px;
}

button {
  border: 1px solid var(--border-strong);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  padding: 2px 8px;
}

button:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.grid-fallback {
  border: 1px dashed var(--danger);
  border-radius: 8px;
  padding: 8px;
  color: var(--danger);
}
</style>
