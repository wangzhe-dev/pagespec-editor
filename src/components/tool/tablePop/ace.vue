<template>
  <div
    class="ace-container"
    :style="{
      height: '100%',
    }"
  >
    <div class="ace-editor" ref="acetab"></div>
  </div>
</template>

<script>
import ace from "ace-builds";
import "ace-builds/webpack-resolver"; // 在 webpack 环境中使用必须要导入
import "ace-builds/src-noconflict/theme-monokai"; // 默认设置的主题
// import "ace-builds/src-noconflict/theme-chrome"; // 默认设置的主题
import "ace-builds/src-noconflict/mode-javascript"; // 默认设置的语言模式
import "ace-builds/src-noconflict/snippets/text";
import "ace-builds/src-min-noconflict/ext-language_tools";
import XEUtils from "xe-utils";

/**
 * @displayName CAceEditor ACE编辑器
 */
export default {
  name: "CAceEditor",
  props: {
    value: {
      type: String,
      required: false,
      default: () => {
        return "";
      },
    },
    expandType: {
      type: String,
      required: false,
      default: () => {
        return "js";
      },
    },
  },
  data() {
    return {
      expand_Type: "",
      aceEditor: null,
      codeValue: this.value,
      completerData_js: [
        {
          meta: "获取当前行数据",
          caption: "api.getTableRow()",
          value: "let rows = api.getTableRow();",
          score: 1,
        },
        {
          meta: "设置当前行某一列的数据(当前列key, value)",
          caption: "api.setTableRow(key, value)",
          value: "let rows = api.setTableRow(key, 'value');",
          score: 1,
        },
        {
          meta: "获取当前单元格的值",
          caption: "api.getCurrentVal()",
          value: "let cellVal = api.getCurrentVal();",
          score: 1,
        },
        {
          meta: "获取form表单的值(传入字段KEY)",
          caption: "api.getFormData",
          value: "let val = api.getFormData('字段名');",
          score: 1,
        },
        {
          meta: "设置form表单的值(传入key, value)",
          caption: "api.setFormData",
          value: "api.setFormData('字段名','123');",
          score: 1,
        },

        {
          meta: "根据出生日期计算年纪(年月日)",
          caption: "_utils",
          value: "_utils.calculateAge();",
          score: 1,
        },
        {
          meta: "get请求",
          caption: "api.getUrlAction",
          value:
            'getUrlAction("get接口地址").then(res=>{\n let {code , data} = res;\n if(code == 200){\n // ...data\n }\n})',
          score: 1,
        },
        {
          meta: "POST请求",
          caption: "api.postAction",
          value:
            ' postAction("post接口地址","参数").then(res=>{\n let {code , data} = res;\n if(code == 200){\n // ...data\n }\n})',
          score: 1,
        },
        //TODO: 待补充！！
      ],
      completerData_reg: [
        {
          meta: "函数式JS检验",
          caption: "api.handler",
          value:
            "function handler({ cellValue, row, column }, callback) {\r\n // cellValue 当前值 row 当前行区某个字段值 row['xxxx'] 字段名\r\n if (cellValue) {\r\n callback(true);\r\n } else if (cellValue) {\r\n // callback(false, \"${title}\");\r\n }\r\n callback(true);\r\n}\r\n",
          score: 1,
        },
        // {
        //   meta: "表格开启前置编辑方法",
        //   caption: "api.beforeEditMethod",
        //   value:
        //     "function beforeEditMethod({row ,column}){\n // row 当前开启编辑行 column 当前编辑列\n // ....逻辑处理 false不可开启 \n // if(row['字段名'] == 'xxxx' && column['field'] == '字段名'){\n // return false; \n // }\n return true;\n}",
        //   score: 1,
        // },
      ],
    };
  },
  watch: {
    value(newVal) {
      let vm = this;
      this.codeValue = newVal;
      let position = vm.aceEditor && vm.aceEditor.getCursorPosition();
      // // 使用 setValue 设置新的代码内容，并保留光标位置
      if (vm.aceEditor) {
        vm.aceEditor.setValue(newVal, 1);
        // 延迟恢复光标位置
        setTimeout(() => {
          vm.aceEditor.moveCursorTo(position.row, position.column);
          const cursorPos = this.aceEditor.getCursorPosition();
          const line = this.aceEditor.getSession().getLine(cursorPos.row);
          const lastChar = line[cursorPos.column - 1];
          if (
            lastChar == ";" ||
            lastChar == "{" ||
            lastChar == "}" ||
            lastChar == "(" ||
            lastChar == ")" ||
            lastChar == " " ||
            typeof lastChar == "undefined" ||
            !/[a-zA-Z0-9]/.test(lastChar)
          ) {
            return;
          }
          this.aceEditor.execCommand("startAutocomplete");
        }, 20);
      }
    },
  },
  computed: {
    // computedCompleterData() {
    //   let data = [];
    //   if (this.expandType == "js") {
    //     data = [];
    //     data = this.completerData_js;
    //   } else {
    //     data = [];
    //     data = this.completerData_reg;
    //   }
    //   return XEUtils.clone(data, true);
    // },
  },
  mounted() {
    this.initFn();
  },
  methods: {
    initFn() {
      this.aceEditor = ace.edit(this.$refs.acetab, {
        minLines: 5, // 最小行数
        fontSize: 14, // 设置字体大小
        theme: "ace/theme/monokai", // 设置主题
        mode: "ace/mode/javascript", // 设置语言模式
        tabSize: 2, // 设置制表符大小
        value: this.codeValue, // 设置初始代码内容
      });

      // 激活自动提示功能
      this.aceEditor.setOptions({
        enableSnippets: true, // 如果需要启用代码片段
        enableLiveAutocompletion: true, // 实时补全
        enableBasicAutocompletion: true, // 基本补全
      });

      const langTools = ace.require("ace/ext/language_tools");
      let _that = this;
      const myCompleter = {
        getCompletions: function (editor, session, pos, prefix, callback) {
          // 如果有输入的内容，进行过滤
          if (prefix.length > 0) {
            callback(null, [
              {
                meta: "获取当前单元格的值",
                caption: "api.getCurrentVal()",
                value: "let cellVal = api.getCurrentVal();",
                score: 1,
              },
              {
                meta: "获取指定某一列的值返回Array",
                caption: "api.getCurrentColumnVal('列key')",
                value: "let columnArr = api.getCurrentVal('列key');",
                score: 1,
              },
              {
                meta: "获取当前行数据",
                caption: "api.getTableRow()",
                value: "let rows = api.getTableRow();",
                score: 1,
              },
              {
                meta: "设置当前行某一列的数据(当前列key, value)",
                caption: "api.setTableRow(key, value)",
                value: "api.setTableRow(key, 'value');",
                score: 1,
              },
              {
                meta: "获取form表单的值(传入字段KEY)",
                caption: "api.getFormData",
                value: "let val = api.getFormData('字段名');",
                score: 1,
              },
              {
                meta: "设置form表单的值(传入key, value)",
                caption: "api.setFormData",
                value: "api.setFormData('字段名','123');",
                score: 1,
              },
              {
                meta: "根据出生日期计算年纪(年月日)",
                caption: "_utils",
                value: "_utils.calculateAge();",
                score: 1,
              },
              {
                meta: "函数式JS检验",
                caption: "api.handler",
                value:
                  "function handler({ cellValue, row, column }, callback) {\r\n // cellValue 当前值 row 当前行区某个字段值 row['xxxx'] 字段名\r\n if (cellValue) {\r\n callback(true);\r\n } else if (cellValue) {\r\n // callback(false, \"${title}\");\r\n }\r\n callback(true);\r\n}\r\n",
                score: 1,
              },
              {
                meta: "get请求",
                caption: "api.getUrlAction",
                value:
                  'getUrlAction("get接口地址").then(res=>{\n let {code , data} = res;\n if(code == 200){\n // ...data\n }\n})',
                score: 1,
              },
              {
                meta: "POST请求",
                caption: "api.postAction",
                value:
                  ' postAction("post接口地址","参数").then(res=>{\n let {code , data} = res;\n if(code == 200){\n // ...data\n }\n})',
                score: 1,
              },
            ]);
          } else {
            callback(null, []); // 如果没有输入内容，返回空数组
          }
        },
      };

      langTools.addCompleter(myCompleter);

      this.aceEditor.getSession().on("change", () => {
        const value = this.aceEditor.getValue();
        this.$emit("input", value);
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.ace-editor {
  height: 100% !important;
  min-height: 400px !important;
}
</style>
