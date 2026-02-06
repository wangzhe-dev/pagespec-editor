
import { randomString } from "@/utils/index.ts";

// ============================================================================
// 旧版表单配置类型定义
// ============================================================================

interface FormConf {
  formRef: string;
  formModel: string;
  size: string;
  labelPosition: string;
  labelWidth: number;
  formRules: string;
  gutter: number;
  disabled: boolean;
  span: number;
  formBtns: boolean;
  deviceType: string;
}

interface RegList {
  pattern: string;
  message: string;
}

interface ExpandConfig {
  js: string;
  reg?: string;
}

interface LinkConfig {
  remoteAPI: string;
  dictCode: string;
  txt: string;
  key: string;
  linkField: string;
  idField: string;
  pidField: string;
}

interface OptionItem {
  label: string;
  value: string;
}

interface BaseComponentConfig {
  comment: string;
  _hidden: boolean;
  expand: ExpandConfig;
  label: string;
  tag: string;
  tagIcon: string;
  defaultValue: unknown;
  span?: number;
  labelWidth: number | null;
  style?: Record<string, string>;
  disabled: boolean;
  required: boolean;
  regList: RegList[];
  regDataType: string;
  changeTag: boolean;
  document: string;
  [key: string]: unknown;
}

interface InputComponentConfig extends BaseComponentConfig {
  placeholder?: string;
  clearable?: boolean;
  prepend?: string;
  append?: string;
  "prefix-icon"?: string;
  "suffix-icon"?: string;
  maxlength?: number | null;
  "show-word-limit"?: boolean;
  readonly?: boolean;
  "show-password"?: boolean;
  type?: string;
  autosize?: { minRows: number; maxRows: number };
  "controls-position"?: string;
  "step-strictly"?: boolean;
  precision?: number;
  min?: number;
  max?: number;
  step?: number;
}

interface SelectComponentConfig extends BaseComponentConfig {
  isLink?: boolean;
  link_config?: LinkConfig;
  placeholder?: string;
  clearable?: boolean;
  filterable?: boolean;
  multiple?: boolean;
  dictCode?: string;
  dataType?: string;
  options?: OptionItem[];
  optionType?: string;
  border?: boolean;
  size?: string;
  "active-text"?: string;
  "inactive-text"?: string;
  "active-color"?: string | null;
  "inactive-color"?: string | null;
  "active-value"?: boolean;
  "inactive-value"?: boolean;
  "picker-options"?: Record<string, unknown>;
  format?: string;
  "value-format"?: string;
  readonly?: boolean;
  max?: number;
  "allow-half"?: boolean;
  "show-text"?: boolean;
  "show-score"?: boolean;
  action?: string;
  accept?: string;
  name?: string;
  "auto-upload"?: boolean;
  showTip?: boolean;
  buttonText?: string;
  fileSize?: number;
  sizeUnit?: string;
  "list-type"?: string;
  "show-stops"?: boolean;
  range?: boolean;
  vertical?: boolean;
  src?: string;
}

interface LayoutTempChild {
  formId?: string;
  renderKey?: string | number;
  layout: string;
  comment?: string;
  vModel?: string;
  label: string;
  tag: string;
  tagIcon: string;
  span?: number;
  defaultValue: unknown;
  changeTag: boolean;
  document: string;
  [key: string]: unknown;
}

interface LayoutTempComponentConfig {
  label: string;
  tagIcon: string;
  layout: string;
  tag?: string;
  shadowType?: string;
  isHeader?: boolean;
  leftTitle?: string;
  leftIcon?: string;
  rightBtn?: boolean;
  block?: boolean;
  tempComponents?: boolean;
  children?: LayoutTempChild[];
  changeTag: boolean;
  document: string;
  [key: string]: unknown;
}

interface LayoutComponentConfig {
  comment: string;
  rangeFlag?: boolean;
  _hidden: boolean;
  activeds?: boolean;
  isNumbers?: boolean;
  border?: boolean;
  align?: string;
  size?: string;
  stripe?: boolean;
  expand?: { js: string };
  addExpandJs?: string;
  delExpandJs?: string;
  layout: string;
  oneOf?: string;
  tagIcon: string;
  label: string;
  changeTag: boolean;
  defaultValue?: unknown[];
  children?: Record<string, unknown>[];
  basis?: string;
  span?: number;
}

type TriggerType = "blur" | "change";

interface TriggerMap {
  [tagName: string]: TriggerType;
}

// ============================================================================
// 新版布局构建器类型定义
// ============================================================================

interface LayoutBuilderConf {
  groupName: string;
  defaultColSpan: number;
  minColSpan: number;
  maxColSpan: number;
}

interface LayoutPaletteItem {
  id: string;
  type: string;
  label: string;
  description: string;
}

// ============================================================================
// 旧版表单配置导出
// ============================================================================

export const formConf: FormConf = {
  formRef: "elForm",
  formModel: "formData",
  size: "medium",
  labelPosition: "top",
  labelWidth: 100,
  formRules: "rules",
  gutter: 15,
  disabled: false,
  span: 24,
  formBtns: true,
  deviceType: "PC",
};

export const inputComponents: InputComponentConfig[] = [
  {
    label: "单行文本",
    tag: "el-input",
    tagIcon: "input",
    placeholder: "请输入",
    defaultValue: undefined,
    span: 24,
    labelWidth: null,
    style: { width: "100%" },
    clearable: true,
    prepend: "",
    append: "",
    "prefix-icon": "",
    "suffix-icon": "",
    maxlength: null,
    "show-word-limit": false,
    readonly: false,
    disabled: false,
    required: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/input",
    comment: "",
    expand: {
      js: "",
      reg: "",
    },
    _hidden: false,
  },
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "多行文本",
    tag: "el-input",
    tagIcon: "textarea",
    type: "textarea",
    placeholder: "请输入",
    defaultValue: undefined,
    span: 24,
    labelWidth: null,
    autosize: {
      minRows: 4,
      maxRows: 4,
    },
    style: { width: "100%" },
    maxlength: null,
    "show-word-limit": false,
    readonly: false,
    disabled: false,
    required: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/input",
  },
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "密码",
    tag: "el-input",
    tagIcon: "password",
    placeholder: "请输入",
    defaultValue: undefined,
    span: 24,
    "show-password": true,
    labelWidth: null,
    style: { width: "100%" },
    clearable: true,
    prepend: "",
    append: "",
    "prefix-icon": "",
    "suffix-icon": "",
    maxlength: null,
    "show-word-limit": false,
    readonly: false,
    disabled: false,
    required: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/input",
  },
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "计数器",
    tag: "el-input-number",
    tagIcon: "number",
    placeholder: "",
    defaultValue: undefined,
    style: { width: "100%" },
    span: 24,
    labelWidth: null,
    min: undefined,
    max: undefined,
    step: undefined,
    "step-strictly": false,
    precision: undefined,
    "controls-position": "",
    disabled: false,
    required: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/input-number",
  },
];

export const selectComponents: SelectComponentConfig[] = [
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    isLink: false,
    link_config: {
      remoteAPI: "",
      dictCode: "",
      txt: "",
      key: "",
      linkField: "",
      idField: "id",
      pidField: "pid",
    },
    label: "下拉选择",
    tag: "el-select",
    tagIcon: "select",
    placeholder: "请选择",
    defaultValue: undefined,
    span: 24,
    labelWidth: null,
    style: { width: "100%" },
    clearable: true,
    disabled: false,
    required: false,
    filterable: false,
    multiple: false,
    dictCode: "",
    dataType: "static",
    regDataType: "regStatic",
    options: [
      {
        label: "选项一",
        value: "1",
      },
      {
        label: "选项二",
        value: "2",
      },
    ],
    regList: [],
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/select",
  },

  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "单选框组",
    tag: "el-radio-group",
    tagIcon: "radio",
    defaultValue: undefined,
    span: 24,
    labelWidth: null,
    style: {},
    optionType: "default",
    border: false,
    size: "medium",
    disabled: false,
    required: false,
    regDataType: "regStatic",
    dataType: "static",
    options: [
      {
        label: "选项一",
        value: "1",
      },
      {
        label: "选项二",
        value: "2",
      },
    ],
    regList: [],
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/radio",
  },
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "多选框组",
    tag: "el-checkbox-group",
    tagIcon: "checkbox",
    defaultValue: [],
    span: 24,
    labelWidth: null,
    style: {},
    optionType: "default",
    border: false,
    size: "medium",
    disabled: false,
    required: false,
    regDataType: "regStatic",
    dataType: "static",
    options: [
      {
        label: "选项一",
        value: "1",
      },
      {
        label: "选项二",
        value: "2",
      },
    ],
    regList: [],
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/checkbox",
  },
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "开关",
    tag: "el-switch",
    tagIcon: "switch",
    defaultValue: false,
    span: 24,
    labelWidth: null,
    style: {},
    disabled: false,
    required: false,
    "active-text": "",
    "inactive-text": "",
    "active-color": null,
    "inactive-color": null,
    "active-value": true,
    "inactive-value": false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/switch",
  },
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "时间选择",
    tag: "el-time-picker",
    tagIcon: "time",
    placeholder: "请选择",
    defaultValue: null,
    span: 24,
    labelWidth: null,
    disabled: false,
    clearable: true,
    required: false,
    "picker-options": {
      selectableRange: "00:00:00-23:59:59",
    },
    format: "HH:mm:ss",
    "value-format": "HH:mm:ss",
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/time-picker",
  },

  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "日期选择",
    tag: "el-date-picker",
    tagIcon: "date",
    placeholder: "请选择",
    defaultValue: null,
    type: "date",
    span: 24,
    labelWidth: null,
    style: { width: "100%" },
    disabled: false,
    clearable: true,
    required: false,
    format: "yyyy-MM-dd",
    "value-format": "yyyy-MM-dd",
    readonly: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/date-picker",
  },

  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "评分",
    tag: "el-rate",
    tagIcon: "rate",
    defaultValue: 0,
    span: 24,
    labelWidth: null,
    style: {},
    max: 5,
    "allow-half": false,
    "show-text": false,
    "show-score": false,
    disabled: false,
    required: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/rate",
  },

  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "上传",
    tag: "el-upload",
    tagIcon: "upload",
    action: "https://jsonplaceholder.typicode.com/posts/",
    defaultValue: null,
    labelWidth: null,
    disabled: false,
    required: false,
    accept: "",
    name: "file",
    "auto-upload": true,
    showTip: false,
    buttonText: "点击上传",
    fileSize: 2,
    sizeUnit: "MB",
    "list-type": "text",
    multiple: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    document: "https://element.eleme.cn/#/zh-CN/component/upload",
  },
  {
    comment: "",
    _hidden: false,
    expand: {
      js: "",
      reg: "",
    },
    label: "标尺",
    tag: "el-slider",
    tagIcon: "slider",
    defaultValue: null,
    span: 24,
    labelWidth: null,
    disabled: false,
    required: false,
    min: 0,
    max: 100,
    step: 5,
    "show-stops": false,
    range: false,
    regList: [],
    regDataType: "regStatic",
    changeTag: true,
    vertical: false,
    document: "https://element.eleme.cn/#/zh-CN/component/slider",
  },
  // {
  //   comment: "",
  //   _hidden: false,
  //   expand: {
  //     js: "",
  //     reg: "",
  //   },
  //   label: "关节图",
  //   tag: "el-image",
  //   tagIcon: "gj",
  //   defaultValue: undefined,
  //   labelWidth: null,
  //   disabled: false,
  //   required: false,
  //   regList: [],
  //   regDataType: "regStatic",
  //   src: require("@/assets/images/CRF.png"),
  //   changeTag: true,
  //   document: "https://element.eleme.cn/#/zh-CN/component/upload",
  // },
];

export const layoutTempComponents: LayoutTempComponentConfig[] = [
  {
    label: "基线期模板",
    tagIcon: "jxq",
    layout: "rowFormItem",
    tempComponents: true,
    children: [
      {
        formId: randomString(8),
        renderKey: +new Date() + randomString(8),
        layout: "colFormItem",
        comment: "是否入组",
        vModel: "fEnrolled",
        _hidden: false,
        expand: {
          js: "",
          reg: "",
        },
        label: "是否入组",
        tag: "el-radio-group",
        tagIcon: "radio",
        defaultValue: undefined,
        span: 24,
        labelWidth: null,
        style: {},
        optionType: "default",
        border: false,
        size: "medium",
        disabled: false,
        required: true,
        regDataType: "regStatic",
        dataType: "dynamic",
        dictCode: "radio_status",
        options: [
          {
            label: "选项一",
            value: "1",
          },
          {
            label: "选项二",
            value: "2",
          },
        ],
        regList: [],
        changeTag: true,
        document: "https://element.eleme.cn/#/zh-CN/component/radio",
      },
      {
        formId: randomString(8),
        renderKey: +new Date() + randomString(8),
        layout: "colFormItem",
        comment: "访视日期",
        vModel: "fDate",
        _hidden: false,
        expand: {
          js: "",
          reg: "",
        },
        label: "访视日期",
        tag: "el-date-picker",
        tagIcon: "date",
        placeholder: "请选择",
        defaultValue: null,
        type: "date",
        span: 24,
        labelWidth: null,
        style: { width: "100%" },
        disabled: false,
        clearable: true,
        required: true,
        format: "yyyy-MM-dd",
        "value-format": "yyyy-MM-dd",
        readonly: false,
        regList: [],
        regDataType: "regStatic",
        changeTag: true,
        document: "https://element.eleme.cn/#/zh-CN/component/date-picker",
      },
    ],
    changeTag: false,
    document: "https://element.eleme.cn/#/zh-CN/component/upload",
  },
  {
    label: "OCR分组",
    layout: "card",
    tagIcon: "ocr",
    tag: "el-card",
    shadowType: "never",
    isHeader: true,
    leftTitle: "OCR分组",
    leftIcon: "我是标题",
    rightBtn: true,
    children: [],
    changeTag: false,
    document: "https://element.eleme.cn/#/zh-CN/component/upload",
  },
  {
    label: "描述分组",
    layout: "card",
    block: false,
    tagIcon: "fz",
    tag: "el-card",
    shadowType: "never",
    isHeader: true,
    leftTitle: "我是标题",
    leftIcon: "我是标题",
    rightBtn: false,
    children: [
      {
        span: 24,
        formId: randomString(8),
        renderKey: +new Date() + randomString(8),
        vModel: `field${randomString(8)}`,
        layout: "text",
        label: "文本描述",
        tag: "el-text",
        tagIcon: "wbText",
        defaultValue: "我是一段红色文字描述！！！",
        pt: "0",
        pb: "0",
        pl: "0",
        pr: "0",
        changeTag: false,
        document: "https://element.eleme.cn/#/zh-CN/component/upload",
      },
    ],
    changeTag: false,
    document: "https://element.eleme.cn/#/zh-CN/component/upload",
  },

  {
    label: "分割符",
    tag: "el-divider",
    tagIcon: "fgx",
    layout: "fgx",
    changeTag: false,
    document: "https://element.eleme.cn/#/zh-CN/component/upload",
  },
  {
    layout: "text",
    label: "文本描述",
    tag: "el-text",
    tagIcon: "wbText",
    defaultValue: "我是一段文字描述！！！",
    pt: "0",
    pb: "0",
    pl: "0",
    pr: "0",
    changeTag: false,
    document: "https://element.eleme.cn/#/zh-CN/component/upload",
  },
];

export const layoutComponents: LayoutComponentConfig[] = [
  {
    comment: "",
    _hidden: false,
    layout: "gridRow",
    oneOf: "gridRow",
    tagIcon: "component",
    label: "GridRow",
    changeTag: false,
    children: [
      {
        layout: "gridCol",
        oneOf: "gridCol",
        tagIcon: "component",
        label: "GridCol",
        span: 12,
        children: [],
      },
    ],
  },
  {
    comment: "",
    _hidden: false,
    layout: "gridCol",
    oneOf: "gridCol",
    tagIcon: "component",
    label: "GridCol",
    changeTag: false,
    span: 12,
    children: [],
  },
  // {
  //   comment: "",
  //   rangeFlag: false,
  //   _hidden: false,
  //   activeds: true,
  //   isNumbers: false,
  //   border: true,
  //   align: "center",
  //   size: "medium",
  //   stripe: false,
  //   expand: {
  //     js: "",
  //   },
  //   addExpandJs: "",
  //   delExpandJs: "",
  //   layout: "subTable",
  //   oneOf: "subTable",
  //   tagIcon: "zb",
  //   label: "设计子表",
  //   changeTag: false,
  //   defaultValue: [],
  //   children: [],
  // },
];

// 组件rule的触发方式，无触发方式的组件不生成rule
export const trigger: TriggerMap = {
  "el-input": "blur",
  "el-input-number": "blur",
  "el-select": "change",
  "el-radio-group": "change",
  "el-checkbox-group": "change",
  "el-cascader": "change",
  "el-time-picker": "change",
  "el-date-picker": "change",
  "el-rate": "change",
};

// ============================================================================
// 新版布局构建器配置（独立于旧版表单逻辑）
// ============================================================================

export const layoutBuilderConf: LayoutBuilderConf = {
  groupName: "layoutBuilderGroup",
  defaultColSpan: 24,
  minColSpan: 1,
  maxColSpan: 24,
};

export const layoutPalette: LayoutPaletteItem[] = [
  {
    id: "palette-row",
    type: "row",
    label: "Row 行容器",
    description: "类似 el-row，内部可放多个 Col",
  },
  {
    id: "palette-col",
    type: "col",
    label: "Col 列容器",
    description: "类似 el-col，可继续嵌套 Row",
  },
];

interface LayoutBuilderNode {
  id: string;
  type: string;
  label: string;
  span: number;
  children: LayoutBuilderNode[];
  [key: string]: unknown;
}

function normalizeColSpan(rawSpan: unknown): number {
  const span = Number(rawSpan ?? layoutBuilderConf.defaultColSpan);
  return Math.max(layoutBuilderConf.minColSpan, Math.min(layoutBuilderConf.maxColSpan, span));
}

function normalizeLayoutChildren(rawChildren: unknown): LayoutBuilderNode[] {
  if (!Array.isArray(rawChildren)) return [];
  return rawChildren
    .filter((child: any) => child && typeof child === "object" && child.type)
    .map((child: any) => createLayoutBuilderNode(child.type, child));
}

export function createLayoutBuilderNode(type: string, overrides: Record<string, any> = {}): LayoutBuilderNode {
  const base =
    type === "row"
      ? {
          type: "row",
          label: "Row",
          children: [{ type: "col", label: "Col", span: 24, children: [] as any[] }],
        }
      : {
          type: "col",
          label: "Col",
          span: 24,
          children: [] as any[],
        };

  const payload = { ...base, ...overrides };
  const childrenSource = Array.isArray(overrides.children)
    ? overrides.children
    : base.children;

  return {
    ...payload,
    id: `layout_${randomString(8)}`,
    span: payload.type === "col" ? normalizeColSpan(payload.span) : 24,
    children: normalizeLayoutChildren(childrenSource),
  };
}

export const layoutRootSeed = [
  {
    type: "row",
    label: "主 Row",
    children: [{ type: "col", label: "主 Col", span: 24, children: [] }],
  },
];

export function getLayoutAllowedChildren(containerType: string): string[] {
  if (containerType === "root") return ["row"];
  if (containerType === "row") return ["col"];
  if (containerType === "col") return ["row"];
  return [];
}

export function canDropLayoutChild(containerType: string, childType: string): boolean {
  if (!childType) return false;
  return getLayoutAllowedChildren(containerType).includes(childType);
}

export function cloneLayoutBuilderTree(node: Record<string, any>): LayoutBuilderNode {
  if (!node || typeof node !== "object" || !node.type) {
    return createLayoutBuilderNode("row");
  }
  return createLayoutBuilderNode(node.type, node);
}
