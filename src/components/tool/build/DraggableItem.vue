<script lang="tsx">
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import { defineComponent, type PropType } from 'vue'
import draggable from 'vuedraggable'
import Render from './utils/render'

interface FormElement {
  formId: string | number
  renderKey: string | number
  layout: string
  span?: number
  label?: string
  labelWidth?: number | null
  required?: boolean
  defaultValue?: any
  tag?: string
  tagIcon?: string
  type?: string
  justify?: string
  align?: string
  gutter?: number
  componentName?: string
  children?: FormElement[]
  oneOf?: string
  isHeader?: boolean
  leftTitle?: string
  rightBtn?: boolean
  [key: string]: any
}

interface FormConf {
  unFocusedComponentBorder?: boolean
  [key: string]: any
}

export default defineComponent({
  name: 'DraggableItem',
  components: { Render, draggable },
  props: {
    element: {
      type: Object as PropType<FormElement>,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    drawingList: {
      type: Array as PropType<FormElement[]>,
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
    // ===== 操作按钮 =====
    const itemBtns = (element: FormElement, index: number, parent: FormElement[]) => {
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

    // ===== 递归渲染子节点 =====
    function renderChildren(element: FormElement): any {
      if (!Array.isArray(element.children)) return null
      return element.children.map((el: FormElement, i: number) => {
        const layoutFn = layouts[el.layout]
        if (layoutFn && element.oneOf === 'subTable') {
          el.span = 4
          return layoutFn(el, i, element.children!)
        } else if (layoutFn) {
          return layoutFn(el, i, element.children!)
        }
        throw new Error(`没有与${el.layout}匹配的layout`)
      })
    }

    // ===== 各类布局渲染器 =====
    const layouts: Record<string, (element: FormElement, index: number, parent: FormElement[]) => any> = {
      colFormItem(element, index, parent) {
        let className =
          props.activeId === element.formId
            ? 'drawing-item active-from-item'
            : 'drawing-item'
        if (props.formConf.unFocusedComponentBorder) {
          className += ' unfocus-bordered'
        }

        return (
          <el-col
            span={element.span}
            class={className}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <el-form-item
              label-width={element.labelWidth ? `${element.labelWidth}px` : undefined}
              label={element.label}
              required={element.required}
            >
              <Render
                key={element.renderKey}
                conf={element}
                {...{
                  'onUpdate:modelValue': (val: any) => {
                    element.defaultValue = val
                  },
                }}
              />
            </el-form-item>
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },

      rowFormItem(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-item'
            : 'drawing-row-item'

        let child = renderChildren(element)
        if (element.type === 'flex') {
          child = (
            <el-row
              type={element.type}
              justify={element.justify}
              align={element.align}
            >
              {child}
            </el-row>
          )
        }

        return (
          <el-col span={element.span}>
            <el-row
              gutter={element.gutter}
              class={className}
              onClick={(event: MouseEvent) => {
                emit('activeItem', element)
                event.stopPropagation()
              }}
            >
              <draggable
                list={element.children}
                animation={340}
                group="componentsGroup"
                class="drag-wrapper"
                item-key="formId"
              >
                {{
                  item: ({ element: el, index: i }: { element: FormElement; index: number }) => {
                    const layoutFn = layouts[el.layout]
                    if (layoutFn) return layoutFn(el, i, element.children!)
                    throw new Error(`没有与${el.layout}匹配的layout`)
                  },
                }}
              </draggable>
              {itemBtns(element, index, parent)}
            </el-row>
          </el-col>
        )
      },

      card(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-card-item'
            : 'drawing-row-item'

        return (
          <el-col
            span={element.span}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
            class={className}
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
                  <draggable
                    list={element.children}
                    animation={340}
                    group="componentsGroup"
                    class="drag-card-wrapper"
                    item-key="formId"
                  >
                    {{
                      item: ({ element: el, index: i }: { element: FormElement; index: number }) => {
                        const layoutFn = layouts[el.layout]
                        if (layoutFn) return layoutFn(el, i, element.children!)
                        throw new Error(`没有与${el.layout}匹配的layout`)
                      },
                    }}
                  </draggable>
                ),
              }}
            </el-card>
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },

      text(element, index, parent) {
        let className =
          props.activeId === element.formId
            ? 'drawing-item active-from-item'
            : 'drawing-item'
        if (props.formConf.unFocusedComponentBorder) {
          className += ' unfocus-bordered'
        }

        return (
          <el-col
            span={element.span}
            class={className}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <el-form-item>
              <Render
                key={element.renderKey}
                conf={element}
                {...{
                  'onUpdate:modelValue': (val: any) => {
                    element.defaultValue = val
                  },
                }}
              />
            </el-form-item>
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },

      fgx(element, index, parent) {
        let className =
          props.activeId === element.formId
            ? 'drawing-item active-from-item'
            : 'drawing-item'
        if (props.formConf.unFocusedComponentBorder) {
          className += ' unfocus-bordered'
        }

        return (
          <el-col
            span={element.span}
            class={className}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
          >
            <div class="from-item-divider">
              <el-divider key={element.renderKey} />
            </div>
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },

      subTable(element, index, parent) {
        const className =
          props.activeId === element.formId
            ? 'drawing-row-item active-from-card-item'
            : 'drawing-row-item'

        return (
          <el-col
            span={element.span}
            onClick={(event: MouseEvent) => {
              emit('activeItem', element)
              event.stopPropagation()
            }}
            class={className}
          >
            <el-form-item
              label-width={element.labelWidth ? `${element.labelWidth}px` : undefined}
              label={element.label}
              required={element.required}
            >
              <c-gener-table widget={element} />
            </el-form-item>
            {itemBtns(element, index, parent)}
          </el-col>
        )
      },
    }

    // ===== 根 render =====
    return () => {
      const layoutFn = layouts[props.element.layout]
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
