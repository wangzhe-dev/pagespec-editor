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
  basis?: string
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
    const getChildren = (node: CanvasNode): CanvasNode[] =>
      Array.isArray(node.children) ? node.children : []

    const spanToBasisClassMap: Record<number, string> = {
      24: 'basis-full',
      20: 'basis-5/6',
      18: 'basis-3/4',
      16: 'basis-2/3',
      12: 'basis-1/2',
      8: 'basis-1/3',
      6: 'basis-1/4',
      4: 'basis-1/6',
    }

    function resolveSpanLayout(span: unknown): { basisClass: string; style?: Record<string, string> } {
      const raw = Number(span ?? 24)
      const normalized = Number.isFinite(raw) ? Math.min(24, Math.max(1, raw)) : 24
      const basisClass = spanToBasisClassMap[normalized]
      if (basisClass) {
        return { basisClass }
      }
      const percent = (normalized / 24) * 100
      return {
        basisClass: 'basis-full',
        style: {
          flexBasis: `${percent}%`,
          maxWidth: `${percent}%`,
        },
      }
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

    function renderDraggableChildren(parentElement: CanvasNode, className: string): any {
      const children = getChildren(parentElement)
      return (
        <draggable
          list={children}
          animation={340}
          group="componentsGroup"
          class={className}
          item-key="formId"
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
      colFormItem(element, index, parent) {
        let className =
          props.activeId === element.formId
            ? 'drawing-item active-from-item'
            : 'drawing-item'
        const { basisClass, style } = resolveSpanLayout(element.span)
        if (props.formConf.unFocusedComponentBorder) {
          className += ' unfocus-bordered'
        }

        return (
          <div
            class={`${className} ${basisClass} shrink-0`}
            style={style}
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
              <Render
                key={element.renderKey}
                conf={element}
                {...{
                  'onUpdate:modelValue': (val: any) => {
                    element.defaultValue = val
                  },
                }}
              />
            </div>
            {itemBtns(element, index, parent)}
          </div>
        )
      },

      rowFormItem(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-item'
            : 'drawing-row-item'
        const { basisClass, style } = resolveSpanLayout(element.span)

        return (
          <div class={`${basisClass} shrink-0`} style={style}>
            <el-row
              gutter={element.gutter}
              class={className}
              onClick={(event: MouseEvent) => {
                emit('activeItem', element)
                event.stopPropagation()
              }}
            >
              {renderDraggableChildren(element, 'drag-wrapper')}
              {itemBtns(element, index, parent)}
            </el-row>
          </div>
        )
      },

      gridRow(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item grid-row-item active-from-item'
            : 'drawing-row-item grid-row-item'

        return (
          <div
            class={className}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <span class="component-name">{element.label || 'GridRow'}</span>
            {renderDraggableChildren(element, 'drag-wrapper grid-row-wrapper')}
            {itemBtns(element, index, parent)}
          </div>
        )
      },

      gridCol(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? `drawing-row-item grid-col-item ${element.basis || 'basis-1/2'} active-from-item`
            : `drawing-row-item grid-col-item ${element.basis || 'basis-1/2'}`

        return (
          <div
            class={className}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <span class="component-name">{element.label || 'GridCol'}</span>
            {renderDraggableChildren(element, 'drag-wrapper grid-col-wrapper')}
            {itemBtns(element, index, parent)}
          </div>
        )
      },

      card(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-card-item'
            : 'drawing-row-item'
        const { basisClass, style } = resolveSpanLayout(element.span)

        return (
          <div
            class={`${className} ${basisClass} shrink-0`}
            style={style}
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
          </div>
        )
      },
      subTable(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-card-item'
            : 'drawing-row-item'
        const { basisClass, style } = resolveSpanLayout(element.span)

        return (
          <div
            class={`${className} ${basisClass} shrink-0`}
            style={style}
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
          </div>
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
