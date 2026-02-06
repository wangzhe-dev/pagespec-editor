<script setup>
import { computed } from "vue";
import Draggable from "vuedraggable";
import {
  canDropLayoutChild,
  cloneLayoutBuilderTree,
  layoutBuilderConf,
} from "./utils/config.ts";

defineOptions({
  name: "DraggableItem",
});

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  parentList: {
    type: Array,
    required: true,
  },
  activeId: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["select"]);

const dragGroup = {
  name: layoutBuilderConf.groupName,
  pull: true,
  put: true,
};

const isRow = computed(() => props.item.type === "row");
const isCol = computed(() => props.item.type === "col");

const span = computed(() => {
  const raw = Number(props.item.span ?? layoutBuilderConf.defaultColSpan);
  return Math.max(layoutBuilderConf.minColSpan, Math.min(layoutBuilderConf.maxColSpan, raw));
});

const widthPercent = computed(() => `${(span.value / 24) * 100}%`);

const wrapperStyle = computed(() => {
  if (!isCol.value) {
    return { width: "100%", flex: "0 0 100%" };
  }
  return {
    width: widthPercent.value,
    flex: `0 0 ${widthPercent.value}`,
    maxWidth: widthPercent.value,
  };
});

const nodeClass = computed(() => ({
  "is-active": props.activeId === props.item.id,
  "is-row": isRow.value,
  "is-col": isCol.value,
}));

const itemChildren = computed({
  get() {
    if (!Array.isArray(props.item.children)) {
      props.item.children = [];
    }
    return props.item.children;
  },
  set(nextValue) {
    props.item.children = nextValue;
  },
});

const childHint = computed(() => {
  if (isRow.value) return "拖入 Col";
  return "拖入 Row";
});

function handleSelect(event) {
  event.stopPropagation();
  emit("select", props.item);
}

function handleDelete(event) {
  event.stopPropagation();
  props.parentList.splice(props.index, 1);
}

function handleCopy(event) {
  event.stopPropagation();
  const clone = cloneLayoutBuilderTree(props.item);
  props.parentList.splice(props.index + 1, 0, clone);
  emit("select", clone);
}

function adjustSpan(delta, event) {
  event.stopPropagation();
  if (!isCol.value) return;
  const next = span.value + delta;
  props.item.span = Math.max(
    layoutBuilderConf.minColSpan,
    Math.min(layoutBuilderConf.maxColSpan, next)
  );
}

function resolveDraggedType(evt) {
  const dragged = evt?.draggedContext?.element;
  return dragged && typeof dragged === "object" ? dragged.type : "";
}

function handleChildMove(evt) {
  if (evt.from === evt.to) return true;
  return canDropLayoutChild(props.item.type, resolveDraggedType(evt));
}

function handleChildAdd(evt) {
  const addedNode = itemChildren.value[evt.newIndex];
  if (addedNode) {
    emit("select", addedNode);
  }
}
</script>

<template>
  <div class="layout-wrapper" :style="wrapperStyle">
    <div class="layout-node" :class="nodeClass" @click="handleSelect">
      <div class="node-header node-handle">
        <span class="node-tag">{{ isRow ? "Row" : "Col" }}</span>
        <span class="node-title">{{ item.label || (isRow ? "Row" : "Col") }}</span>

        <div v-if="isCol" class="span-tools">
          <button class="span-btn" type="button" @click="adjustSpan(-1, $event)">-</button>
          <span class="span-text">{{ span }}/24</span>
          <button class="span-btn" type="button" @click="adjustSpan(1, $event)">+</button>
        </div>

        <div class="node-actions">
          <button class="action-btn" type="button" @click="handleCopy">复制</button>
          <button class="action-btn delete" type="button" @click="handleDelete">删除</button>
        </div>
      </div>

      <div class="node-body">
        <Draggable v-model="itemChildren" item-key="id" :group="dragGroup" :move="handleChildMove" :animation="200"
          handle=".node-handle" ghost-class="drag-ghost" chosen-class="drag-chosen" class="child-list"
          @add="handleChildAdd">
          <template #item="{ element, index: childIndex }">
            <DraggableItem :item="element" :index="childIndex" :parent-list="itemChildren" :active-id="activeId"
              @select="emit('select', $event)" />
          </template>
        </Draggable>

        <div v-if="!itemChildren.length" class="empty-zone">
          {{ childHint }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  padding: 4px;
  box-sizing: border-box;
}

.layout-node {
  border: 1px dashed #c7ccd6;
  border-radius: 6px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.layout-node.is-active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.14);
}

.layout-node.is-row {
  border-style: solid;
  border-color: #cfd8e3;
}

.layout-node.is-col {
  background: #fbfcfe;
}

.node-header {
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-bottom: 1px solid #eceff4;
  cursor: move;
  user-select: none;
}

.node-tag {
  min-width: 30px;
  height: 18px;
  line-height: 18px;
  border-radius: 10px;
  text-align: center;
  font-size: 11px;
  color: #fff;
  background: #409eff;
}

.node-title {
  flex: 1;
  font-size: 12px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.span-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.span-btn {
  width: 18px;
  height: 18px;
  border: 1px solid #d8dde6;
  background: #fff;
  color: #606266;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
}

.span-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.span-text {
  min-width: 38px;
  font-size: 11px;
  color: #606266;
  text-align: center;
}

.node-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  height: 22px;
  padding: 0 8px;
  border: 1px solid #d8dde6;
  border-radius: 4px;
  font-size: 12px;
  background: #fff;
  color: #606266;
  cursor: pointer;
}

.action-btn:hover {
  border-color: #409eff;
  color: #409eff;
}

.action-btn.delete:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

.node-body {
  padding: 8px;
}

.child-list {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  min-height: 40px;
}

.empty-zone {
  width: 100%;
  min-height: 44px;
  border: 1px dashed #dce2ea;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
}

.drag-ghost {
  opacity: 0.45;
}

.drag-chosen {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
}
</style>
