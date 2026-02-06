import { makeMap } from '@/utils/index.ts'
import { defineComponent, h, type PropType } from 'vue'

// 参考 https://github.com/vuejs/vue/blob/v2.6.10/src/platforms/web/server/util.js
const isAttr = makeMap(
  'accept,accept-charset,accesskey,action,align,alt,async,autocomplete,' +
    'autofocus,autoplay,autosave,bgcolor,border,buffered,challenge,charset,' +
    'checked,cite,class,code,codebase,color,cols,colspan,content,http-equiv,' +
    'name,contenteditable,contextmenu,controls,coords,data,datetime,default,' +
    'defer,dir,dirname,disabled,download,draggable,dropzone,enctype,method,for,' +
    'form,formaction,headers,height,hidden,high,href,hreflang,http-equiv,' +
    'icon,id,ismap,itemprop,keytype,kind,label,lang,language,list,loop,low,' +
    'manifest,max,maxlength,media,method,GET,POST,min,multiple,email,file,' +
    'muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,' +
    'preload,radiogroup,readonly,rel,required,reversed,rows,rowspan,sandbox,' +
    'scope,scoped,seamless,selected,shape,size,type,text,password,sizes,span,' +
    'spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,' +
    'target,title,type,usemap,value,width,wrap'
)

interface GuideMarksConf {
  step: number
  min: number
  max: number
}

type MarksValue = string | Record<string, never>
type GuideMarks = Record<number, MarksValue>

function guideMarks(conf: GuideMarksConf): GuideMarks {
  const { step, min, max } = conf
  const marks: GuideMarks = {}
  for (let i = min; i <= max; i++) {
    if (i % step === 0) {
      marks[i] = i + ''
    } else if (i % 1 === 0) {
      marks[i] = {} as Record<string, never>
    }
  }
  return marks
}

function vModel(
  emit: (event: any, ...args: any[]) => void,
  flatProps: Record<string, any>,
  defaultValue: any,
  conf: any
): void {
  flatProps.modelValue = defaultValue
  if (conf.tagIcon === 'image') {
    flatProps.style = { width: '50px', height: '55px' }
  }
  if (conf.tagIcon === 'slider') {
    flatProps.marks = guideMarks(conf)
    if (conf.vertical) {
      flatProps.style = { height: '250px' }
    }
  }
  flatProps['onUpdate:modelValue'] = (val: any) => {
    emit('update:modelValue', val)
  }
}

// Vue 3 版本: componentChild 不再需要 h 参数，直接 import { h } from 'vue'
const componentChild: Record<string, Record<string, (conf: any, key: string) => any>> = {
  'el-button': {
    default(conf, key) {
      return conf[key]
    },
  },
  'el-input': {
    prepend(conf, key) {
      return conf[key]
    },
    append(conf, key) {
      return conf[key]
    },
  },
  'el-select': {
    options(conf) {
      const list: any[] = []
      conf.options.forEach((item: any) => {
        list.push(
          h('el-option', {
            label: item.label,
            value: item.value,
            disabled: item.disabled,
          })
        )
      })
      return list
    },
  },
  'el-radio-group': {
    options(conf) {
      const list: any[] = []
      conf.options.forEach((item: any) => {
        if (conf.optionType === 'button') {
          list.push(
            h('el-radio-button', { value: item.value }, () => item.label)
          )
        } else {
          list.push(
            h('el-radio', { value: item.value, border: conf.border }, () => item.label)
          )
        }
      })
      return list
    },
  },
  'el-checkbox-group': {
    options(conf) {
      const list: any[] = []
      conf.options.forEach((item: any) => {
        if (conf.optionType === 'button') {
          list.push(
            h('el-checkbox-button', { value: item.value }, () => item.label)
          )
        } else {
          list.push(
            h('el-checkbox', { value: item.value, border: conf.border }, () => item.label)
          )
        }
      })
      return list
    },
  },
  'el-upload': {
    'list-type'(conf) {
      const list: any[] = []
      if (conf['list-type'] === 'picture-card') {
        list.push(h('el-icon', null, () => h('plus')))
      } else {
        list.push(
          h(
            'el-button',
            { size: 'small', type: 'primary' },
            () => conf.buttonText
          )
        )
      }
      if (conf.showTip) {
        list.push(
          h(
            'div',
            { class: 'el-upload__tip' },
            `只能上传不超过 ${conf.fileSize}${conf.sizeUnit} 的${conf.accept}文件`
          )
        )
      }
      return list
    },
  },
}

// 不需要传递给组件的内部属性
const skipKeys = new Set([
  'vModel',
  'defaultValue',
  'regList',
  'regDataType',
  'changeTag',
  'document',
  'tagIcon',
  'layout',
  'formId',
  'renderKey',
  'comment',
  '_hidden',
  'expand',
  'link_config',
  'isLink',
  'dataType',
  'dictCode',
  'options',
  'tempComponents',
  'oneOf',
  'componentName',
  'gutter',
  'leftTitle',
  'leftIcon',
  'rightBtn',
  'isHeader',
  'shadowType',
  'block',
  'showTip',
  'buttonText',
  'fileSize',
  'sizeUnit',
  'optionType',
  'activeds',
  'isNumbers',
  'rangeFlag',
  'addExpandJs',
  'delExpandJs',
  'pt',
  'pb',
  'pl',
  'pr',
])

export default defineComponent({
  name: 'Render',
  props: {
    conf: {
      type: Object as PropType<Record<string, any>>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => {
      const confClone = JSON.parse(JSON.stringify(props.conf))
      const flatProps: Record<string, any> = {}
      const children: any[] = []

      // 构建子组件
      const childObjs = componentChild[confClone.tag]
      if (childObjs) {
        Object.keys(childObjs).forEach((key: string) => {
          const childFunc = childObjs[key]
          if (confClone[key]) {
            children.push(childFunc(confClone, key))
          }
        })
      }

      // 构建 flat props（Vue 3 h() 使用平铺 props）
      Object.keys(confClone).forEach((key: string) => {
        const val = confClone[key]
        if (key === 'vModel') {
          vModel(emit, flatProps, confClone.defaultValue, props.conf)
        } else if (key === 'style') {
          flatProps.style = val
        } else if (key === 'tag') {
          // tag 不传给组件自身
        } else if (skipKeys.has(key)) {
          // 跳过内部属性
        } else {
          flatProps[key] = val
        }
      })

      // 特殊处理 el-text
      if (props.conf.tag === 'el-text') {
        return h('c-text', { widget: props.conf })
      }

      return h(
        props.conf.tag,
        flatProps,
        children.length > 0 ? children.flat() : undefined
      )
    }
  },
})
