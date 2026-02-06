<template>
  <el-popover
    ref="vpopover"
    v-model="visible"
    :placement="position"
    overlayClassName="j-input-pop"
  >
    <div class="el-popover__title">
      <span>{{ title }}</span>
      <span style="float: right" title="关闭">
        <i
          style="margin-right: 10px"
          class="el-icon-full-screen"
          @click="clickScreen"
        ></i>

        <i class="el-icon-close" @click="closePopover"></i>
      </span>
    </div>

    <div :style="{ width: width + 'px' }">
      <div class="c-textarea-pop" :data-full-screen="Screen">
        <div class="ta-fs-content">
          <i
            v-if="Screen"
            class="el-icon-circle-close ta-fs-button-close text-danger"
            @click="Screen = false"
          ></i>
          <Ace
            mode="javascript"
            v-model="inputContent"
            :expandType="expandType"
            @input="inputs"
          ></Ace>
        </div>
      </div>
    </div>
    <div slot="reference">
      <span
        style="
          cursor: pointer;
          overflow: hidden;
          display: inline-block;
          width: 100%;
        "
        @click.stop="pop"
        v-if="inputContent"
        >{{ inputContent }}</span
      >
      <i
        v-if="!inputContent"
        style="cursor: pointer"
        class="el-input__icon el-icon-s-tools"
        @click.stop="pop"
      ></i>
    </div>
    <!-- <el-input
      slot="reference"
      v-model="inputContent"
      disabled
      @change="handleInputChange"
    >
      <i
        slot="suffix"
        style="color: black; cursor: pointer"
        class="el-input__icon el-icon-s-tools"
        @click.stop="pop"
      ></i>
    </el-input> -->
  </el-popover>
</template>

<script>
import Ace from "./ace.vue";
export default {
  components: {
    Ace,
  },
  name: "JInputPop",
  props: {
    title: {
      type: String,
      default: "",
      required: false,
    },
    position: {
      type: String,
      default: "left",
      required: false,
    },
    height: {
      type: Number,
      default: 400,
      required: false,
    },
    width: {
      type: Number,
      default: 600,
      required: false,
    },
    value: {
      type: String,
      required: false,
    },
    popContainer: {
      type: String,
      default: "",
      required: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      required: false,
    },
    expandType: {
      type: String,
      required: false,
      default: () => "",
    },
  },
  data() {
    return {
      visible: false,
      inputContent: "",
      Screen: false,
    };
  },

  watch: {
    value: {
      immediate: true,
      handler: function () {
        if (this.value) {
          this.inputContent = this.value;
        }
      },
    },
  },
  model: {
    prop: "value",
    event: "change",
  },
  methods: {
    clickScreen() {
      this.Screen = true;
    },
    closePopover() {
      this.$refs.vpopover.doClose();
    },
    inputs(value) {
      this.$emit("changes", value);
    },
    handleInputChange(value) {
      this.inputContent = value;
      this.$emit("change", this.inputContent);
    },
    pop() {
      // disabled 不弹窗
      // if (this.disabled) {
      //   return;
      // }
      this.visible = true;
      // this.$nextTick(() => {
      //   this.$refs.textarea.focus();
      // });
    },
    getPopupContainer(node) {
      if (!this.popContainer) {
        return node.parentNode;
      } else {
        return document.getElementById(this.popContainer);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
// .aaa {
//   .is-disabled {
//     ::v-deep .el-input__inner {
//       background-color: #fff;
//       border-color: #fff;
//       color: #c0c4cc;
//       cursor: auto;
//       /* cursor: not-allowed; */
//     }
//   }
// }
.c-textarea-pop {
  ::v-deep .el-textarea__inner {
    color: #fff;
    background-color: #444;
  }
  &[data-full-screen="false"] {
    .ta-fs-content {
      width: 300px;
      height: 300px;
    }
  }

  &[data-full-screen="true"] {
    .ta-fs-content {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 9998;
      // padding: 20px;
      background-color: #f5f5f5;
      ::v-deep .ace-container {
        height: 100% !important;
      }
    }

    .ta-fs-button-close {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      font-size: 24px;
    }

    .screen-icon {
      text-align: center;
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      border: 1px solid #ec6a5e;
      background: #ec6a5e;
      color: #fff;
      .i-icon svg {
        position: relative;
      }
    }
  }
}
</style>
