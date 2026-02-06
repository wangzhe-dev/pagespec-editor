<template>
  <div class="container">
    <div class="left-board">
      <el-scrollbar class="left-scrollbar">
        <div class="components-list">
          <div class="components-title">
            <svg-icon icon-class="component" /> 布局型组件
          </div>
          <draggable class="components-draggable" :list="layoutComponents"
            :group="{ name: 'componentsGroup', pull: 'clone', put: false }" :clone="cloneComponent"
            draggable=".components-item" :sort="false" item-key="label" @end="onEnd">
            <template #item="{ element }">
              <div class="components-item" @click="addComponent(element)">
                <div class="components-body">
                  <svg-icon :icon-class="element.tagIcon" />
                  {{ element.label }}
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </el-scrollbar>
    </div>

    <div class="center-board">
      <div class="center-scrollbar">
        <div class="center-board-container">
          <div class="center-board-row">
            <div class="center-board-row-list flex flex-row">
              <draggable class="drawing-board" :list="drawingList" :animation="340" group="componentsGroup"
                item-key="formId">
                <template #item="{ element, index }">
                  <draggable-item :key="element.renderKey ?? element.formId ?? index" :drawing-list="drawingList"
                    :element="element" :index="index" :active-id="activeId" :form-conf="formConf"
                    @activeItem="activeFormItem" @copyItem="drawingItemCopy" @deleteItem="drawingItemDelete" />
                </template>
              </draggable>
              <div v-show="!drawingList.length" class="empty-info">
                从左侧拖入或点选组件进行表单设计
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { randomString, titleCase } from "@/utils/index.ts";
import { defineComponent, nextTick } from "vue";
import draggable from "vuedraggable";
import DraggableItem from "./DraggableItem.vue";
import {
  formConf,
  inputComponents,
  layoutComponents,
  layoutTempComponents,
  selectComponents,
} from "./utils/config.ts";

type FormId = string | number;



interface CanvasNode {
  formId?: FormId;
  renderKey?: string | number;
  layout?: string;
  oneOf?: string;
  basis?: string;
  tempComponents?: boolean;
  tag?: string;
  tagIcon?: string;
  label?: string;
  placeholder?: string;
  vModel?: string;
  componentName?: string;
  gutter?: number;
  dictCode?: string;
  options?: unknown[];
  span?: number;
  children?: CanvasNode[];
  [key: string]: unknown;
}

let oldActiveId: FormId | undefined;
let tempActiveData: CanvasNode | undefined;
let oldBodyOnDrop: ((this: GlobalEventHandlers, ev: DragEvent) => unknown) | null = null;

export default defineComponent({
  components: {
    draggable,
    DraggableItem,
  },
  data() {
    return {
      idGlobal: 100,
      formConf,
      inputComponents,
      selectComponents,
      layoutComponents,
      layoutTempComponents,
      labelWidth: 100,
      drawingList: [] as CanvasNode[],
      drawingData: {} as Record<string, unknown>,
      activeId: 1 as FormId,
      drawerVisible: false,
      formData: {} as Record<string, unknown>,
      dialogVisible: false,
      generateConf: null as unknown,
      showFileName: false,
      activeData: {} as CanvasNode,
      pageTypes: "create",
      jsonTemplate: {} as Record<string, unknown>,
      dictChild: null,
      dragging: false,
      draggedControl: {} as CanvasNode,
    };
  },
  created() {
    // 防止 firefox 下 拖拽 会新打卡一个选项卡
    oldBodyOnDrop = document.body.ondrop;
    document.body.ondrop = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };
  },
  beforeUnmount() {
    document.body.ondrop = oldBodyOnDrop;
  },
  watch: {
    "activeData.label": function (
      this: { activeData: CanvasNode; activeId: FormId },
      val: string | undefined,
      oldVal: string | undefined
    ) {
      const { activeData } = this;
      if (
        typeof activeData.placeholder !== "string" ||
        !activeData.tag ||
        oldActiveId !== this.activeId
      ) {
        return;
      }
      activeData.placeholder =
        activeData.placeholder.replace(oldVal ?? "", "") + (val ?? "");
    },

    activeId: {
      handler(val: FormId) {
        oldActiveId = val;
      },
      immediate: true,
    },
  },
  methods: {
    buildDefaultGridCol(this: any): CanvasNode {
      return {
        formId: randomString(8),
        renderKey: Date.now(),
        layout: "gridCol",
        oneOf: "gridCol",
        tagIcon: "component",
        label: "GridCol",
        basis: "basis-1/2",
        componentName: `col${randomString(8)}`,
        children: [],
      };
    },
    activeFormItem(this: { activeData: CanvasNode; activeId: FormId }, element: CanvasNode) {
      this.activeData = element;
      this.activeId = element.formId ?? randomString(8);
    },
    onEnd(
      this: { activeData: CanvasNode; activeId: FormId },
      obj: { from: unknown; to: unknown }
    ) {
      if (obj.from !== obj.to) {
        this.activeData = tempActiveData ?? {};
        this.activeId = randomString(8);
      }
    },
    addComponent(this: any, item: CanvasNode) {
      const clone = this.cloneComponent(item);
      this.drawingList.push(clone);
      this.activeFormItem(clone);
    },
    cloneComponent(this: any, origin: CanvasNode): CanvasNode {
      const clone = JSON.parse(JSON.stringify(origin)) as CanvasNode;
      clone.formId = randomString(8);
      clone.span = formConf.span;
      clone.renderKey = Date.now(); // 改变renderKey后可以实现强制更新组件
      tempActiveData = clone;

      if (!clone.layout) clone.layout = "colFormItem";
      if (clone.layout === "colFormItem") {
        if (clone.tag === "el-divider") {
          delete clone.label;
        } else {
          clone.vModel = `field${randomString(8)}`;
          if (typeof clone.placeholder === "string" && typeof clone.label === "string") {
            clone.placeholder += clone.label;
          }
        }
        tempActiveData = clone;
      } else if (clone.layout === "rowFormItem" && !clone.oneOf) {
        if (clone.tempComponents) {
          delete clone.label;
          clone.componentName = `row${randomString(8)}`;
          clone.gutter = this.formConf.gutter;
        } else {
          delete clone.label;
          clone.componentName = `row${randomString(8)}`;
          clone.gutter = this.formConf.gutter;
        }
        tempActiveData = clone;
      } else if (clone.layout === "subTable") {
        // 表格
        clone.vModel = `sub_field${randomString(8)}`;
        tempActiveData = clone;
      } else if (clone.layout === "card" && !clone.oneOf) {
        // 卡片容器
        delete clone.label;
        if (clone.tagIcon === "ocr") {
          clone.vModel = `field${randomString(8)}`;
        }
        clone.componentName = `row${randomString(8)}`;
        clone.gutter = this.formConf.gutter;
        tempActiveData = clone;
      } else if (clone.layout === "layoutGrid") {
        clone.componentName = `row${randomString(8)}`;
        clone.gutter = this.formConf.gutter;
        tempActiveData = clone;
      } else if (clone.layout === "gridRow") {
        clone.componentName = `row${randomString(8)}`;
        if (!Array.isArray(clone.children) || !clone.children.length) {
          clone.children = [this.buildDefaultGridCol()];
        } else {
          clone.children = clone.children.map((child: CanvasNode) =>
            this.createIdAndKey(child)
          );
        }
        tempActiveData = clone;
      } else if (clone.layout === "gridCol") {
        clone.componentName = `col${randomString(8)}`;
        clone.basis = typeof clone.basis === "string" ? clone.basis : "basis-1/2";
        if (!Array.isArray(clone.children)) {
          clone.children = [];
        }
        tempActiveData = clone;
      }
      return tempActiveData ?? clone;
    },
    AssembleFormData(this: any) {
      this.formData = {
        fields: JSON.parse(JSON.stringify(this.drawingList)),
        ...this.formConf,
      };
    },
    generate(this: any, data: unknown) {
      const operationType =
        typeof this.operationType === "string" ? this.operationType : "";
      const func = this[`exec${titleCase(operationType)}`] as
        | ((payload: unknown) => void)
        | undefined;
      this.generateConf = data;
      func && func(data);
    },
    execRun(this: any) {
      this.AssembleFormData();
      this.drawerVisible = true;
    },

    drawingItemCopy(this: any, item: CanvasNode, parent: CanvasNode[]) {
      let clone = JSON.parse(JSON.stringify(item)) as CanvasNode;
      clone = this.createIdAndKey(clone);
      parent.push(clone);
      this.activeFormItem(clone);
    },
    createIdAndKey(this: any, item: CanvasNode): CanvasNode {
      item.formId = randomString(8);
      item.renderKey = Date.now();
      if (item.layout === "colFormItem") {
        item.vModel = `field${randomString(8)}`;
      } else if (item.layout === "rowFormItem") {
        item.componentName = `row${randomString(8)}`;
      } else if (item.layout === "gridRow") {
        item.componentName = `row${randomString(8)}`;
      } else if (item.layout === "gridCol") {
        item.componentName = `col${randomString(8)}`;
        item.basis = typeof item.basis === "string" ? item.basis : "basis-1/2";
      } else if (item.layout === "card") {
        item.vModel = `field${randomString(8)}`;
      } else if (item.layout === "subTable") {
        item.vModel = `field${randomString(8)}`;
        item.activeds = true;
        item.border = false;
        item.activeds = true;
        item.align = "center";
        item.size = "medium";
        item.stripe = false;
        item.addExpandJs = "";
        item.delExpandJs = "";
        item.expand = {
          js: "",
        };
        item.children = [];
        item.rangeFlag = false;
      }
      if (Array.isArray(item.children)) {
        item.children = item.children.map((childItem) =>
          this.createIdAndKey(childItem)
        );
      }

      return item;
    },
    drawingItemDelete(this: any, index: number, parent: CanvasNode[]) {
      parent.splice(index, 1);
      void nextTick(() => {
        const len = this.drawingList.length;
        if (len) {
          this.activeFormItem(this.drawingList[len - 1]);
        }
      });
    },
  },
});
</script>

<style lang="scss">
.editor-tabs {
  background: #121315;

  .el-tabs__header {
    margin: 0;
    border-bottom-color: #121315;

    .el-tabs__nav {
      border-color: #121315;
    }
  }

  .el-tabs__item {
    height: 32px;
    line-height: 32px;
    color: #888a8e;
    border-left: 1px solid #121315 !important;
    background: #363636;
    margin-right: 5px;
    user-select: none;
  }

  .el-tabs__item.is-active {
    background: #1e1e1e;
    border-bottom-color: #1e1e1e !important;
    color: #fff;
  }

  .el-icon-edit {
    color: #f1fa8c;
  }

  .el-icon-document {
    color: #a95812;
  }
}

// home
.right-scrollbar {
  .el-scrollbar__view {
    padding: 12px 18px 15px 15px;
  }
}

.left-scrollbar .el-scrollbar__wrap {
  box-sizing: border-box;
  overflow-x: hidden !important;
  margin-bottom: 0 !important;
}

.center-tabs {
  .el-tabs__header {
    margin-bottom: 0 !important;
  }

  .el-tabs__item {
    width: 33%;
    text-align: center;
  }

  .el-tabs__nav {
    width: 100%;
  }
}

.reg-item {
  padding: 12px 6px;
  background: #f8f8f8;
  position: relative;
  border-radius: 4px;

  .close-btn {
    position: absolute;
    right: -6px;
    top: -6px;
    display: block;
    width: 16px;
    height: 16px;
    line-height: 16px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    color: #fff;
    text-align: center;
    z-index: 1;
    cursor: pointer;
    font-size: 12px;

    &:hover {
      background: rgba(210, 23, 23, 0.5);
    }
  }

  &+.reg-item {
    margin-top: 18px;
  }
}

.action-bar {
  & .el-button+.el-button {
    margin-left: 15px;
  }

  & i {
    font-size: 20px;
    vertical-align: middle;
    position: relative;
    top: -1px;
  }
}

.custom-tree-node {
  width: 100%;
  font-size: 14px;

  .node-operation {
    float: right;
  }

  i[class*="el-icon"]+i[class*="el-icon"] {
    margin-left: 6px;
  }

  .el-icon-plus {
    color: #409eff;
  }

  .el-icon-delete {
    color: #157a0c;
  }
}

.left-scrollbar .el-scrollbar__view {
  overflow-x: hidden;
}

.el-rate {
  display: inline-block;
  vertical-align: text-top;
}

.el-upload__tip {
  line-height: 1.2;
}

$selectedColor: #f6f7ff;
$lighterBlue: #409eff;

.container {
  position: relative;
  width: 100%;
  height: calc(100vh - 130px);
}

.components-list {
  padding: 8px;
  box-sizing: border-box;
  height: 100%;

  .components-item {
    display: inline-block;
    width: 48%;
    margin: 1%;
    transition: transform 0ms !important;
  }
}

.components-draggable {
  padding-bottom: 20px;
}

.components-title {
  font-size: 14px;
  color: #222;
  margin: 6px 2px;

  .svg-icon {
    color: #666;
    font-size: 18px;
  }
}

.components-body {
  padding: 8px 10px;
  background: $selectedColor;
  font-size: 12px;
  cursor: move;
  border: 1px dashed $selectedColor;
  border-radius: 3px;

  .svg-icon {
    color: #777;
    font-size: 15px;
  }

  &:hover {
    border: 1px dashed #787be8;
    color: #787be8;

    .svg-icon {
      color: #787be8;
    }
  }
}

.left-board {
  width: 260px;
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
}

.left-scrollbar {
  height: calc(100vh - 130px);
  overflow: hidden;
}

.center-scrollbar {
  height: calc(100vh - 120px);
  border-left: 1px solid #f1e8e8;
  border-right: 1px solid #f1e8e8;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
}

.center-board {
  height: 100vh;
  width: auto;
  // margin: 0 350px 0 260px;
  box-sizing: border-box;
}

.action-bar {
  position: relative;
  height: 42px;
  text-align: right;
  padding: 0 15px;
  box-sizing: border-box;
  border: 1px solid #f1e8e8;
  border-top: none;
  border-left: none;

  .delete-btn {
    color: #f56c6c;
  }
}

.center-board-container {
  height: 100%;
  box-sizing: border-box;
  padding: 10px;
  // position: relative;
}

.center-board-row {
  padding: 5px 0 50px 0;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -ms-flex-direction: column;
  flex-direction: column;

  &>.center-board-row-list {
    height: 100%;
  }
}

.center-board-row-list {
  display: flex;
  flex-direction: row;
  width: 100%;
  padding: 0 0 100px 0;
}

.drawing-board {
  height: 100%;
  width: 100%;
  flex: 1;
  height: auto;
  min-height: 100px;
  padding-bottom: 0;

  & .el-card__header {
    background-color: #f4f4f5 !important;
  }

  .components-body {
    padding: 0;
    margin: 0;
    font-size: 0;
  }

  .sortable-ghost {
    position: relative;
    display: block;
    overflow: hidden;

    &::before {
      content: " ";
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 3px;
      background: rgb(89, 89, 223);
      z-index: 2;
    }
  }

  .components-item.sortable-ghost {
    width: 100%;
    height: 60px;
    background-color: $selectedColor;
  }

  .from-item-divider {
    height: 50px !important;
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  .active-from-item {
    &>.field-content {
      background: $selectedColor;
      border-radius: 6px;
    }

    &>.from-item-divider {
      background: $selectedColor;
      border-radius: 6px;
    }

    &>.drawing-item-copy,
    &>.drawing-item-delete {
      display: initial;
    }

    &>.component-name {
      color: $lighterBlue;
    }
  }

  .field-content {
    margin-bottom: 15px;
  }

  .field-label {
    font-size: 12px;
    color: #606266;
    line-height: 20px;
    margin-bottom: 6px;
  }

  .el-col {
    margin-bottom: 22px;
  }
}

.drawing-item {
  position: relative;
  cursor: move;
  display: block;
  min-height: 50px;
  height: auto;

  &.unfocus-bordered:not(.activeFromItem)>div:first-child {
    border: 1px dashed #ccc;
  }

  .field-content {
    padding: 12px 10px;
  }
}

.active-from-layoutGrid-item {
  display: flex;
  min-height: 100px;
}

.drawing-row-item {
  position: relative;
  cursor: move;
  box-sizing: border-box;
  border: 1px dashed #ccc;
  border-radius: 3px;
  height: auto;
  padding: 0 2px;
  margin-bottom: 15px;

  // margin-top: 22px;
  .layoutColGrid-item {
    height: 100% !important;
    margin-bottom: 0 !important;
    padding: 30px 0 0 0;

    .drag-layoutGrid-wrapper {
      min-height: 100px;
      height: auto !important;
      /* 高度自适应 */
    }
  }

  .layoutColGrid-item:nth-of-type(even) {
    border-left: 1px dashed #ccc !important;
    /* 添加左侧边框 */
  }

  .el-card__body {
    display: block;
    min-height: 100px;
    display: flex;
    flex-direction: column;

    .drag-card-wrapper {
      min-height: 100px;
      height: 100% !important;
      height: auto;
      /* 高度自适应 */
    }
  }

  .drawing-row-item {
    margin-bottom: 2px;
  }

  .el-col {
    margin-bottom: 22px;
  }

  .field-content {
    margin-bottom: 0;
  }

  .drag-wrapper {
    min-height: 80px;
    height: 100% !important;
  }

  &.active-from-item {
    border: 1px dashed $lighterBlue;
  }

  &.active-from-card-item {
    border: 1px solid $lighterBlue;
    cursor: move;
  }

  &.active-from-layoutGrid-item {
    border: 1px solid $lighterBlue;
    cursor: move;
  }

  .clearfix:before,
  .clearfix:after {
    display: table;
    content: "";
  }

  .clearfix:after {
    clear: both;
  }

  .component-name {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 12px;
    color: #bbb;
    display: inline-block;
    padding: 0 6px;
  }
}

.grid-row-item {
  padding-top: 20px;

  .grid-row-wrapper {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: stretch;
    min-height: 120px;
  }
}

.grid-col-item {
  min-width: 160px;
  flex-shrink: 0;
  padding-top: 20px;

  .grid-col-wrapper {
    min-height: 90px;
    width: 100%;
  }
}

.drawing-item,
.drawing-row-item {
  &:hover {
    &>.field-content {
      background: $selectedColor;
      border-radius: 6px;
    }

    &>.from-item-divider {
      background: $selectedColor;
      border-radius: 6px;
    }

    &>.drawing-item-copy,
    &>.drawing-item-delete {
      display: initial;
    }
  }

  &>.drawing-item-copy,
  &>.drawing-item-delete {
    display: none;
    position: absolute;
    top: -10px;
    width: 22px;
    height: 22px;
    line-height: 22px;
    text-align: center;
    border-radius: 50%;
    font-size: 12px;
    border: 1px solid;
    cursor: pointer;
    z-index: 1;
  }

  &>.drawing-item-copy {
    right: 56px;
    border-color: $lighterBlue;
    color: $lighterBlue;
    background: #fff;

    &:hover {
      background: $lighterBlue;
      color: #fff;
    }
  }

  &>.drawing-item-delete {
    right: 24px;
    border-color: #f56c6c;
    color: #f56c6c;
    background: #fff;

    &:hover {
      background: #f56c6c;
      color: #fff;
    }
  }
}
</style>
