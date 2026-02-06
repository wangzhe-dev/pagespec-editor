<script lang="tsx">
/* @jsxImportSource vue */
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import { defineComponent, type PropType } from 'vue'
import draggable from 'vuedraggable'
import Render from './utils/render'

type LayoutKind =
  | 'colFormItem'
  | 'rowFormItem'
  | 'card'
  | 'text'
  | 'fgx'
  | 'subTable'
  | 'gridRow'
  | 'gridCol'

interface BaseCanvasNode {
  formId?: string | number
  renderKey?: string | number
  layout?: LayoutKind | string
  basis?: string
  span?: number
  label?: string
  labelWidth?: number | null
  required?: boolean
  defaultValue?: unknown
  tag?: string
  tagIcon?: string
  type?: string
  justify?: string
  align?: string
  gutter?: number
  componentName?: string
  minHeight?: number
  children?: CanvasNode[]
  oneOf?: string
  isHeader?: boolean
  leftTitle?: string
  rightBtn?: boolean
  [key: string]: unknown
}

interface GridRowNode extends BaseCanvasNode {
  layout: 'gridRow'
  children: CanvasNode[]
}

interface GridColNode extends BaseCanvasNode {
  layout: 'gridCol'
  children: CanvasNode[]
}

type CanvasNode = BaseCanvasNode | GridRowNode | GridColNode

interface FormConf {
  unFocusedComponentBorder?: boolean
  [key: string]: unknown
}

export default defineComponent({
  name: 'DraggableItem',
  components: { Render, draggable },
  props: {
    element: {
      type: Object as PropType<CanvasNode>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    drawingList: {
      type: Array as PropType<CanvasNode[]>,
      required: true,
    },
    activeId: {
      type: [String, Number] as PropType<string | number>,
      required: true,
    },
    formConf: {
      type: Object as PropType<FormConf>,
      required: true,
    },
  },
  emits: ['activeItem', 'copyItem', 'deleteItem'],
  setup(props, { emit }) {
    const GRID_SPAN_MIN = 3
    const GRID_SPAN_MAX = 24
    const GRID_SPAN_STEP = 3
    const GRID_ROW_MAX_COLS = 8

    const getChildren = (node: CanvasNode): CanvasNode[] =>
      Array.isArray(node.children) ? node.children : []

    function normalizeSpan(rawSpan: number): number {
      if (!Number.isFinite(rawSpan)) return GRID_SPAN_MAX
      const clamped = Math.min(GRID_SPAN_MAX, Math.max(GRID_SPAN_MIN, rawSpan))
      const snapped = Math.round(clamped / GRID_SPAN_STEP) * GRID_SPAN_STEP
      return Math.min(
        GRID_SPAN_MAX,
        Math.max(GRID_SPAN_MIN, snapped)
      )
    }

    function resolveNormalizedSpan(span: unknown): number {
      const raw = Number(span ?? GRID_SPAN_MAX)
      return normalizeSpan(raw)
    }

    function resolveElementSpan(span: unknown): number {
      const raw = Number(span ?? GRID_SPAN_MAX)
      if (!Number.isFinite(raw)) return GRID_SPAN_MAX
      return Math.min(GRID_SPAN_MAX, Math.max(1, Math.round(raw)))
    }

    function getNodeMinHeight(node: CanvasNode, fallback: number): number {
      const raw = Number(node.minHeight ?? fallback)
      if (!Number.isFinite(raw)) return fallback
      return Math.min(1200, Math.max(80, raw))
    }

    function getGridColMaxSpan(current: CanvasNode, siblings: CanvasNode[]): number {
      const occupied = siblings
        .filter((child) => child.layout === 'gridCol' && child !== current)
        .reduce((sum, child) => sum + resolveNormalizedSpan(child.span), 0)
      return Math.max(GRID_SPAN_MIN, GRID_SPAN_MAX - occupied)
    }

    function startHorizontalResize(
      event: MouseEvent,
      node: CanvasNode,
      siblings: CanvasNode[],
      direction: 'left' | 'right'
    ): void {
      event.preventDefault()
      event.stopPropagation()
      const target = event.currentTarget as HTMLElement | null
      const host = target?.parentElement as HTMLElement | null
      const container = host?.parentElement as HTMLElement | null
      const containerWidth = Math.max(1, container?.getBoundingClientRect().width ?? host?.getBoundingClientRect().width ?? 1)
      const startX = event.clientX
      const startSpan = resolveNormalizedSpan(node.span)
      const maxSpan = node.layout === 'gridCol' ? getGridColMaxSpan(node, siblings) : GRID_SPAN_MAX
      const directionSign = direction === 'right' ? 1 : -1

      const onMove = (moveEvent: MouseEvent) => {
        const deltaPx = (moveEvent.clientX - startX) * directionSign
        const nextRawSpan = startSpan + (deltaPx / containerWidth) * GRID_SPAN_MAX
        const nextSpan = Math.min(maxSpan, normalizeSpan(nextRawSpan))
        node.span = nextSpan
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }

    function startVerticalResize(
      event: MouseEvent,
      node: CanvasNode,
      direction: 'top' | 'bottom',
      fallbackHeight: number
    ): void {
      event.preventDefault()
      event.stopPropagation()
      const startY = event.clientY
      const startHeight = getNodeMinHeight(node, fallbackHeight)
      const directionSign = direction === 'bottom' ? 1 : -1

      const onMove = (moveEvent: MouseEvent) => {
        const deltaPx = (moveEvent.clientY - startY) * directionSign
        const nextHeight = Math.min(1200, Math.max(80, Math.round(startHeight + deltaPx)))
        node.minHeight = nextHeight
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    }

    function renderNodeResizeHandles(
      node: CanvasNode,
      siblings: CanvasNode[],
      fallbackHeight: number
    ): any {
      return [
        <span
          class="node-resize-handle node-resize-handle-left"
          onMousedown={(event: MouseEvent) =>
            startHorizontalResize(event, node, siblings, 'left')
          }
        />,
        <span
          class="node-resize-handle node-resize-handle-right"
          onMousedown={(event: MouseEvent) =>
            startHorizontalResize(event, node, siblings, 'right')
          }
        />,
        <span
          class="node-resize-handle node-resize-handle-top"
          onMousedown={(event: MouseEvent) =>
            startVerticalResize(event, node, 'top', fallbackHeight)
          }
        />,
        <span
          class="node-resize-handle node-resize-handle-bottom"
          onMousedown={(event: MouseEvent) =>
            startVerticalResize(event, node, 'bottom', fallbackHeight)
          }
        />,
      ]
    }

    function canMoveToParent(parentElement: CanvasNode, evt: any): boolean {
      if (parentElement.layout !== 'gridRow') {
        return true
      }

      const draggedElement = evt?.draggedContext?.element as CanvasNode | undefined
      if (!draggedElement) {
        return true
      }
      if (draggedElement.layout !== 'gridCol') {
        return false
      }

      const isSameContainer = evt?.from && evt?.to && evt.from === evt.to
      if (isSameContainer) {
        return true
      }

      const currentCols = getChildren(parentElement).filter((child) => child.layout === 'gridCol').length
      if (currentCols >= GRID_ROW_MAX_COLS) {
        return false
      }

      const occupiedSpan = getChildren(parentElement)
        .filter((child) => child.layout === 'gridCol')
        .reduce((sum, child) => sum + resolveNormalizedSpan(child.span), 0)
      const draggedSpan = resolveNormalizedSpan(draggedElement.span)
      return occupiedSpan + draggedSpan <= GRID_SPAN_MAX
    }

    // ===== 操作按钮 =====
    const itemBtns = (element: CanvasNode, index: number, parent: CanvasNode[]) => {
      return [
        <span
          class="drawing-item-copy"
          title="复制"
          onClick={(event: MouseEvent) => {
            emit('copyItem', element, parent)
            event.stopPropagation()
          }}
        >
          <el-icon size={12}><CopyDocument /></el-icon>
        </span>,
        <span
          class="drawing-item-delete"
          title="删除"
          onClick={(event: MouseEvent) => {
            emit('deleteItem', index, parent)
            event.stopPropagation()
          }}
        >
          <el-icon size={12}><Delete /></el-icon>
        </span>,
      ]
    }

    function renderDraggableChildren(
      parentElement: CanvasNode,
      className: string,
      tag = 'div',
      attrs: Record<string, unknown> = {}
    ): any {
      const children = getChildren(parentElement)
      return (
        <draggable
          list={children}
          animation={340}
          group="componentsGroup"
          tag={tag}
          class={className}
          item-key="formId"
          move={(evt: any) => canMoveToParent(parentElement, evt)}
          {...attrs}
        >
          {{
            item: ({ element: el, index: i }: { element: CanvasNode; index: number }) => {
              const layoutFn = el.layout ? layouts[el.layout] : undefined
              if (layoutFn) return layoutFn(el, i, children)
              throw new Error(`没有与${el.layout}匹配的layout`)
            },
          }}
        </draggable>
      )
    }

    // ===== 各类布局渲染器 =====
    const layouts: Record<string, (element: CanvasNode, index: number, parent: CanvasNode[]) => any> = {


      gridRow(element, index, parent) {
        const normalizedSpan = resolveNormalizedSpan(element.span)
        const minHeight = getNodeMinHeight(element, 140)
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item grid-row-item active-from-item'
            : 'drawing-row-item grid-row-item'

        return (
          <div
            class={className}
            style={{ minHeight: `${minHeight}px` }}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <span class="component-name">{`${element.label || 'GridRow'} span${normalizedSpan}`}</span>
            {renderDraggableChildren(
              element,
              'grid-row-wrapper',
              'el-row',
              { gutter: Number(element.gutter ?? 8) }
            )}
            {renderNodeResizeHandles(element, parent, 140)}
            {itemBtns(element, index, parent)}
          </div>
        )
      },

      gridCol(element, index, parent) {
        const normalizedSpan = resolveNormalizedSpan(element.span)
        const minHeight = getNodeMinHeight(element, 110)
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item grid-col-item active-from-item'
            : 'drawing-row-item grid-col-item'

        return (
          <el-col
            span={normalizedSpan}
            class={className}
            style={{ minHeight: `${minHeight}px` }}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <span class="component-name">{`${element.label || 'GridCol'} span${normalizedSpan}`}</span>
            {renderDraggableChildren(element, 'drag-wrapper grid-col-wrapper')}
            {renderNodeResizeHandles(element, parent, 110)}
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },

      card(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-card-item'
            : 'drawing-row-item'
        const normalizedSpan = resolveElementSpan(element.span)

        return (
          <el-col
            span={normalizedSpan}
            class={className}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <el-card shadow="never" body-style="padding:5px">
              {{
                header: element.isHeader
                  ? () => (
                      <div class="clearfix">
                        <span style="font-weight:900">{element.leftTitle}</span>
                      </div>
                    )
                  : undefined,
                default: () => (
                  renderDraggableChildren(element, 'drag-card-wrapper')
                ),
              }}
            </el-card>
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },
      subTable(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-card-item'
            : 'drawing-row-item'
        const normalizedSpan = resolveElementSpan(element.span)

        return (
          <el-col
            span={normalizedSpan}
            class={className}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <div class="field-content">
              {element.label ? (
                <div class="field-label">
                  {element.required ? '* ' : ''}
                  {element.label}
                </div>
              ) : null}
              <c-gener-table widget={element} />
            </div>
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },
    }

    // ===== 根 render =====
    return () => {
      const layoutFn = props.element.layout ? layouts[props.element.layout] : undefined
      if (layoutFn) {
        return layoutFn(props.element, props.index, props.drawingList)
      }
      throw new Error(`没有与${props.element.layout}匹配的layout`)
    }
  },
})
</script>

<style scoped lang="scss">
:deep(.el-slider__stop.el-slider__marks-stop) {
  height: 15px;
  border-radius: 0;
  &:nth-child(5n + 1) {
    height: 23px;
    background: #2f2e2e;
    border-radius: 0;
    margin-top: -2px;
  }
  &:nth-child(10n + 1) {
    width: 2px;
    height: 30px;
    background: #000;
    border-radius: 0;
    margin-top: -5px;
  }
  & {
    content: '';
    width: 1px;
    background-color: #2f2e2e;
    transform: scaleY(0.5);
    transform-origin: 0 0;
  }
}

:deep(.is-vertical .el-slider__stop.el-slider__marks-stop) {
  width: 15px;
  background: #2f2e2e;
  border-radius: 0;
  &:nth-child(5n + 1) {
    width: 23px;
    background: #2f2e2e;
    border-radius: 0;
    margin-left: -2px;
  }
  &:nth-child(10n + 1) {
    width: 30px;
    height: 2px;
    background: #000;
    border-radius: 0;
    margin-left: -3px;
  }
  & {
    content: '';
    height: 1px;
    background-color: #000;
    transform: scaleX(0.5);
    transform-origin: 0 0;
  }
}

:deep(.is-vertical .el-slider__marks-text) {
  user-select: none;
  &:nth-child(5n + 1) {
    margin-left: 15px;
    font-size: 8px;
  }
  &:nth-child(10n + 1) {
    margin-left: 20px;
    font-size: 10px;
  }
}
:deep(.el-slider__marks-text) {
  user-select: none;
  &:nth-child(5n + 1) {
    margin-top: 15px;
    font-size: 8px;
  }
  &:nth-child(10n + 1) {
    margin-top: 20px;
    font-size: 10px;
  }
}

:deep(.el-slider__bar) {
  background-color: #f95959;
  z-index: 1021;
  height: 2px;
  border-radius: 0 0 1px 1px;
  margin-top: 3px;
}
:deep(.el-slider__runway) {
  background-color: #fff;
}
:deep(.is-vertical .el-slider__bar) {
  background-color: #f95959;
  z-index: 1021;
  width: 2px;
  height: auto;
  border-radius: 2px 2px 0 0;
  margin-left: 3px;
}

:deep(.el-slider__button) {
  position: absolute;
  z-index: 1001;
  transform: translateX(-50%);
  background-color: transparent;
  text-align: center;
  user-select: none;
  border-radius: 0;
  line-height: normal;
  width: 0;
  height: 0;
  border: 8px solid transparent;
}

:deep(.is-vertical .el-slider__button) {
  border-left-color: red;
  border-bottom-color: #fff !important;
  margin-top: 0px;
}
:deep(.el-slider__button) {
  border-bottom-color: red;
  margin-top: 20px;
}
:deep(.el-slider__button-wrapper) {
  width: 16px;
  height: 16px;
}
</style>
