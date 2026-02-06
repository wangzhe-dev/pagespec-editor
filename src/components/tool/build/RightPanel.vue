<template>
  <div class="right-board">
    <el-tabs v-model="currentTab" class="center-tabs">
      <el-tab-pane label="组件属性" name="field" />
      <el-tab-pane label="表单属性" name="form" />
      <el-tab-pane label="设备调试" name="deviceType" />
    </el-tabs>
    <div class="field-box">
      <!-- <a
        class="document-link"
        target="_blank"
        :href="documentLink"
        title="查看组件文档"
      >
        <i class="el-icon-link" />
      </a> -->
      <el-scrollbar class="right-scrollbar">
        <!-- 组件属性 -->
        <el-form
          v-show="currentTab === 'field' && showField"
          size="small"
          label-width="90px"
        >
          <el-form-item v-if="activeData.changeTag" label="组件类型">
            <el-select
              v-model="activeData.tagIcon"
              placeholder="请选择组件类型"
              :style="{ width: '100%' }"
              @change="tagChange"
            >
              <el-option-group
                v-for="group in tagList"
                :key="group.label"
                :label="group.label"
              >
                <el-option
                  v-for="item in group.options"
                  :key="item.label"
                  :label="item.label"
                  :value="item.tagIcon"
                >
                  <svg-icon class="node-icon" :icon-class="item.tagIcon" />
                  <span> {{ item.label }}</span>
                </el-option>
              </el-option-group>
            </el-select>
          </el-form-item>

          <el-form-item
            v-if="activeData.vModel !== undefined && !noneTag"
            label="字段名"
          >
            <el-input
              v-model="activeData.vModel"
              placeholder="请输入字段名（v-model）"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.componentName !== undefined && !noneTag"
            label="组件名"
          >
            {{ activeData.componentName }}
          </el-form-item>
          <el-form-item
            v-if="activeData.label !== undefined && !noneTag"
            label="标题"
          >
            <el-input v-model="activeData.label" placeholder="请输入标题" />
          </el-form-item>
          <el-form-item
            v-if="activeData.placeholder !== undefined"
            label="占位说明"
          >
            <el-input
              v-model="activeData.placeholder"
              placeholder="请输入占位说明"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.comment !== undefined"
            label="问题注释"
          >
            <el-input
              v-model="activeData.comment"
              placeholder="请输入问题注释"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['start-placeholder'] !== undefined"
            label="开始占位"
          >
            <el-input
              v-model="activeData['start-placeholder']"
              placeholder="请输入占位提示"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['end-placeholder'] !== undefined"
            label="结束占位"
          >
            <el-input
              v-model="activeData['end-placeholder']"
              placeholder="请输入占位提示"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.span !== undefined && !activeData.oneOf"
            label="表单栅格"
          >
            <el-slider
              v-model="activeData.span"
              :max="24"
              :min="1"
              :marks="{ 12: '' }"
              @change="spanChange"
            />
          </el-form-item>
          <el-form-item
            v-if="
              activeData.layout === 'rowFormItem' &&
              !activeData.oneOf &&
              !activeData.tempComponents
            "
            label="栅格间隔"
          >
            <el-input-number
              v-model="activeData.gutter"
              :min="0"
              placeholder="栅格间隔"
            />
          </el-form-item>
          <el-form-item
            v-if="
              activeData.layout === 'rowFormItem' &&
              !activeData.oneOf &&
              !activeData.tempComponents
            "
            label="布局模式"
          >
            <el-radio-group v-model="activeData.type">
              <el-radio-button label="default" />
              <el-radio-button label="flex" />
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="
              activeData.justify !== undefined && activeData.type === 'flex'
            "
            label="水平排列"
          >
            <el-select
              v-model="activeData.justify"
              placeholder="请选择水平排列"
              :style="{ width: '100%' }"
            >
              <el-option
                v-for="(item, index) in justifyOptions"
                :key="index"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="activeData.align !== undefined && activeData.type === 'flex'"
            label="垂直排列"
          >
            <el-radio-group v-model="activeData.align">
              <el-radio-button label="top" />
              <el-radio-button label="middle" />
              <el-radio-button label="bottom" />
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="activeData.labelWidth !== undefined"
            label="标签宽度"
          >
            <el-input
              v-model.number="activeData.labelWidth"
              type="number"
              placeholder="请输入标签宽度"
            />
          </el-form-item>
          <!-- <el-form-item
            v-if="activeData.style && activeData.style.width !== undefined"
            label="组件宽度"
          >
            <el-input
              v-model="activeData.style.width"
              placeholder="请输入组件宽度"
              clearable
            />
          </el-form-item> -->
          <el-form-item
            v-if="
              activeData.vModel !== undefined && !activeData.oneOf && !noneTag
            "
            label="默认值"
          >
            <el-input
              :value="setDefaultValue(activeData.defaultValue)"
              placeholder="请输入默认值"
              @input="onDefaultValueInput"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-checkbox-group'"
            label="至少应选"
          >
            <el-input-number
              :value="activeData.min"
              :min="0"
              placeholder="至少应选"
              @input="$set(activeData, 'min', $event ? $event : undefined)"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-checkbox-group'"
            label="最多可选"
          >
            <el-input-number
              :value="activeData.max"
              :min="0"
              placeholder="最多可选"
              @input="$set(activeData, 'max', $event ? $event : undefined)"
            />
          </el-form-item>
          <el-form-item v-if="activeData.prepend !== undefined" label="前缀">
            <el-input v-model="activeData.prepend" placeholder="请输入前缀" />
          </el-form-item>
          <el-form-item v-if="activeData.append !== undefined" label="后缀">
            <el-input v-model="activeData.append" placeholder="请输入后缀" />
          </el-form-item>
          <el-form-item
            v-if="activeData['prefix-icon'] !== undefined"
            label="前图标"
          >
            <el-input
              v-model="activeData['prefix-icon']"
              placeholder="请输入前图标名称"
            >
              <el-button
                slot="append"
                icon="el-icon-thumb"
                @click="openIconsDialog('prefix-icon')"
              >
                选择
              </el-button>
            </el-input>
          </el-form-item>
          <el-form-item
            v-if="activeData['suffix-icon'] !== undefined"
            label="后图标"
          >
            <el-input
              v-model="activeData['suffix-icon']"
              placeholder="请输入后图标名称"
            >
              <el-button
                slot="append"
                icon="el-icon-thumb"
                @click="openIconsDialog('suffix-icon')"
              >
                选择
              </el-button>
            </el-input>
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-cascader'"
            label="选项分隔符"
          >
            <el-input
              v-model="activeData.separator"
              placeholder="请输入选项分隔符"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.autosize !== undefined"
            label="最小行数"
          >
            <el-input-number
              v-model="activeData.autosize.minRows"
              :min="1"
              placeholder="最小行数"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.autosize !== undefined"
            label="最大行数"
          >
            <el-input-number
              v-model="activeData.autosize.maxRows"
              :min="1"
              placeholder="最大行数"
            />
          </el-form-item>
          <el-form-item v-if="activeData.min !== undefined" label="最小值">
            <el-input-number v-model="activeData.min" placeholder="最小值" />
          </el-form-item>
          <el-form-item v-if="activeData.max !== undefined" label="最大值">
            <el-input-number v-model="activeData.max" placeholder="最大值" />
          </el-form-item>
          <el-form-item v-if="activeData.step !== undefined" label="步长">
            <el-input-number v-model="activeData.step" placeholder="步数" />
          </el-form-item>
          <el-form-item v-if="activeData.tagIcon == 'slider'" label="方向">
            <!-- <el-input-number v-model="activeData.vertical" placeholder="方向" /> -->
            <el-switch
              v-model="activeData.vertical"
              active-text="纵向"
              inactive-text="横行"
            >
            </el-switch>
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-input-number'"
            label="精度"
          >
            <el-input-number
              v-model="activeData.precision"
              :min="0"
              placeholder="精度"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-input-number'"
            label="按钮位置"
          >
            <el-radio-group v-model="activeData['controls-position']">
              <el-radio-button label=""> 默认 </el-radio-button>
              <el-radio-button label="right"> 右侧 </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="activeData.maxlength !== undefined"
            label="最多输入"
          >
            <el-input
              v-model="activeData.maxlength"
              placeholder="请输入字符长度"
            >
              <template slot="append"> 个字符 </template>
            </el-input>
          </el-form-item>
          <el-form-item
            v-if="activeData['active-text'] !== undefined"
            label="开启提示"
          >
            <el-input
              v-model="activeData['active-text']"
              placeholder="请输入开启提示"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['inactive-text'] !== undefined"
            label="关闭提示"
          >
            <el-input
              v-model="activeData['inactive-text']"
              placeholder="请输入关闭提示"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['active-value'] !== undefined"
            label="开启值"
          >
            <el-input
              :value="setDefaultValue(activeData['active-value'])"
              placeholder="请输入开启值"
              @input="onSwitchValueInput($event, 'active-value')"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['inactive-value'] !== undefined"
            label="关闭值"
          >
            <el-input
              :value="setDefaultValue(activeData['inactive-value'])"
              placeholder="请输入关闭值"
              @input="onSwitchValueInput($event, 'inactive-value')"
            />
          </el-form-item>
          <el-form-item
            v-if="
              activeData.type !== undefined &&
              'el-date-picker' === activeData.tag
            "
            label="时间类型"
          >
            <el-select
              v-model="activeData.type"
              placeholder="请选择时间类型"
              :style="{ width: '100%' }"
              @change="dateTypeChange"
            >
              <el-option
                v-for="(item, index) in dateOptions"
                :key="index"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="activeData.name !== undefined" label="文件字段名">
            <el-input
              v-model="activeData.name"
              placeholder="请输入上传文件字段名"
            />
          </el-form-item>
          <el-form-item v-if="activeData.accept !== undefined" label="文件类型">
            <el-select
              v-model="activeData.accept"
              placeholder="请选择文件类型"
              :style="{ width: '100%' }"
              clearable
            >
              <el-option label="图片" value="image/*" />
              <el-option label="视频" value="video/*" />
              <el-option label="音频" value="audio/*" />
              <el-option label="excel" value=".xls,.xlsx" />
              <el-option label="word" value=".doc,.docx" />
              <el-option label="pdf" value=".pdf" />
              <el-option label="txt" value=".txt" />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="activeData.fileSize !== undefined"
            label="文件大小"
          >
            <el-input
              v-model.number="activeData.fileSize"
              placeholder="请输入文件大小"
            >
              <el-select
                slot="append"
                v-model="activeData.sizeUnit"
                :style="{ width: '66px' }"
              >
                <el-option label="KB" value="KB" />
                <el-option label="MB" value="MB" />
                <el-option label="GB" value="GB" />
              </el-select>
            </el-input>
          </el-form-item>
          <el-form-item v-if="activeData.action !== undefined" label="上传地址">
            <el-input
              v-model="activeData.action"
              placeholder="请输入上传地址"
              clearable
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['list-type'] !== undefined"
            label="列表类型"
          >
            <el-radio-group v-model="activeData['list-type']" size="small">
              <el-radio-button label="text"> text </el-radio-button>
              <el-radio-button label="picture"> picture </el-radio-button>
              <el-radio-button label="picture-card">
                picture-card
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="activeData.buttonText !== undefined"
            v-show="'picture-card' !== activeData['list-type']"
            label="按钮文字"
          >
            <el-input
              v-model="activeData.buttonText"
              placeholder="请输入按钮文字"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['range-separator'] !== undefined"
            label="分隔符"
          >
            <el-input
              v-model="activeData['range-separator']"
              placeholder="请输入分隔符"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['picker-options'] !== undefined"
            label="时间段"
          >
            <el-input
              v-model="activeData['picker-options'].selectableRange"
              placeholder="请输入时间段"
            />
          </el-form-item>
          <el-form-item v-if="activeData.format !== undefined" label="时间格式">
            <el-input
              :value="activeData.format"
              placeholder="请输入时间格式"
              @input="setTimeValue($event)"
            />
          </el-form-item>
          <template
            v-if="
              ['el-checkbox-group', 'el-radio-group', 'el-select'].indexOf(
                activeData.tag
              ) > -1
            "
          >
            <el-form-item
              v-if="['el-select'].indexOf(activeData.tag) > -1"
              label="是否联动"
            >
              <el-switch
                @change="isLinkChange"
                v-model="activeData['isLink']"
              />
            </el-form-item>
            <el-divider>选项</el-divider>
            <el-form-item label-width="0">
              <el-radio-group v-model="activeData.dataType" size="small">
                <el-radio-button label="static"> 静态数据 </el-radio-button>
                <el-radio-button label="dynamic"> 字典数据 </el-radio-button>
                <el-radio-button label="remoteAPI" v-if="activeData.isLink">
                  远程接口
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <template v-if="activeData.dataType === 'static'">
              <draggable
                :list="activeData.options"
                :animation="340"
                group="selectItem"
                handle=".option-drag"
                :item-key="
                  (item) =>
                    item.__dragKey || (item.__dragKey = randomString(8))
                "
              >
                <template #item="{ element: item, index }">
                  <div class="select-item">
                    <div class="select-line-icon option-drag">
                      <i class="el-icon-s-operation" />
                    </div>
                    <el-input
                      v-model="item.label"
                      placeholder="选项名"
                      size="small"
                    />
                    <el-input
                      placeholder="选项值"
                      size="small"
                      :value="item.value"
                      @input="setOptionValue(item, $event)"
                    />
                    <div
                      class="close-btn select-line-icon"
                      @click="activeData.options.splice(index, 1)"
                    >
                      <i class="el-icon-remove-outline" />
                    </div>
                  </div>
                </template>
              </draggable>
              <div style="margin-left: 20px">
                <el-button
                  style="padding-bottom: 0"
                  icon="el-icon-circle-plus-outline"
                  type="text"
                  @click="addSelectItem"
                >
                  添加选项
                </el-button>
              </div>
              <el-divider />
            </template>
            <template v-if="activeData.dataType === 'dynamic'">
              <el-form-item label="字典编码">
                <el-select
                  v-model="activeData.dictCode"
                  placeholder="字典编码"
                  clearable
                  filterable
                  style="width: 100%"
                  @change="
                    (e) => {
                      dictCodeChange(e, activeData);
                    }
                  "
                >
                  <el-option
                    v-for="dict in dictList"
                    :key="dict.dictId"
                    :label="dict.dictName"
                    :value="dict.dictType"
                  />
                </el-select>
              </el-form-item>
              <el-divider />
            </template>

            <template
              v-if="activeData.dataType === 'remoteAPI' && activeData.isLink"
            >
              <el-form-item label="接口地址">
                <el-input
                  v-model="activeData.link_config.remoteAPI"
                  placeholder="接口地址"
                />
              </el-form-item>
              <el-form-item label="当前ID">
                <el-input
                  v-model="activeData.link_config.idField"
                  placeholder="当前ID"
                />
              </el-form-item>
              <el-form-item label="上下级ID">
                <el-input
                  v-model="activeData.link_config.pidField"
                  placeholder="上下级ID"
                />
              </el-form-item>
              <el-form-item label="级联字段">
                <el-input
                  v-model="activeData.link_config.linkField"
                  placeholder="例如city,area逗号分隔"
                />
              </el-form-item>
              <el-form-item label="字段name">
                <el-input
                  v-model="activeData.link_config.txt"
                  placeholder="显示字段name"
                />
              </el-form-item>
              <el-form-item label="字段key">
                <el-input
                  v-model="activeData.link_config.key"
                  placeholder="显示字段key"
                />
              </el-form-item>
              <el-divider />
            </template>
          </template>

          <template v-if="['el-cascader'].indexOf(activeData.tag) > -1">
            <el-divider>选项</el-divider>
            <el-form-item label="数据类型">
              <el-radio-group v-model="activeData.dataType" size="small">
                <el-radio-button label="dynamic"> 动态数据 </el-radio-button>
                <el-radio-button label="static"> 静态数据 </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <template v-if="activeData.dataType === 'dynamic'">
              <el-form-item label="标签键名">
                <el-input
                  v-model="activeData.labelKey"
                  placeholder="请输入标签键名"
                />
              </el-form-item>
              <el-form-item label="值键名">
                <el-input
                  v-model="activeData.valueKey"
                  placeholder="请输入值键名"
                />
              </el-form-item>
              <el-form-item label="子级键名">
                <el-input
                  v-model="activeData.childrenKey"
                  placeholder="请输入子级键名"
                />
              </el-form-item>
            </template>

            <el-tree
              v-if="activeData.dataType === 'static'"
              draggable
              :data="activeData.options"
              node-key="id"
              :expand-on-click-node="false"
              :render-content="renderContent"
            />
            <div
              v-if="activeData.dataType === 'static'"
              style="margin-left: 20px"
            >
              <el-button
                style="padding-bottom: 0"
                icon="el-icon-circle-plus-outline"
                type="text"
                @click="addTreeItem"
              >
                添加父级
              </el-button>
            </div>
            <el-divider />
          </template>

          <el-form-item
            v-if="activeData.optionType !== undefined"
            label="选项样式"
          >
            <el-radio-group v-model="activeData.optionType">
              <el-radio-button label="default"> 默认 </el-radio-button>
              <el-radio-button label="button"> 按钮 </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="activeData['active-color'] !== undefined"
            label="开启颜色"
          >
            <el-color-picker v-model="activeData['active-color']" />
          </el-form-item>
          <el-form-item
            v-if="activeData['inactive-color'] !== undefined"
            label="关闭颜色"
          >
            <el-color-picker v-model="activeData['inactive-color']" />
          </el-form-item>

          <el-form-item
            v-if="activeData['allow-half'] !== undefined"
            label="允许半选"
          >
            <el-switch v-model="activeData['allow-half']" />
          </el-form-item>
          <el-form-item
            v-if="activeData['show-text'] !== undefined"
            label="辅助文字"
          >
            <el-switch
              v-model="activeData['show-text']"
              @change="rateTextChange"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['show-score'] !== undefined"
            label="显示分数"
          >
            <el-switch
              v-model="activeData['show-score']"
              @change="rateScoreChange"
            />
          </el-form-item>
          <el-form-item
            v-if="activeData['show-stops'] !== undefined"
            label="显示间断点"
          >
            <el-switch v-model="activeData['show-stops']" />
          </el-form-item>
          <el-form-item v-if="activeData.range !== undefined" label="范围选择">
            <el-switch v-model="activeData.range" @change="rangeChange" />
          </el-form-item>
          <el-form-item
            v-if="
              activeData.border !== undefined &&
              activeData.optionType === 'default'
            "
            label="是否带边框"
          >
            <el-switch v-model="activeData.border" />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-color-picker'"
            label="颜色格式"
          >
            <el-select
              v-model="activeData['color-format']"
              placeholder="请选择颜色格式"
              :style="{ width: '100%' }"
              @change="colorFormatChange"
            >
              <el-option
                v-for="(item, index) in colorFormatOptions"
                :key="index"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item
            v-if="
              activeData.size !== undefined &&
              (activeData.optionType === 'button' ||
                activeData.border ||
                activeData.tag === 'el-color-picker') &&
              !activeData.oneOf
            "
            label="选项尺寸"
          >
            <el-radio-group v-model="activeData.size">
              <el-radio-button label="medium"> 中等 </el-radio-button>
              <el-radio-button label="small"> 较小 </el-radio-button>
              <el-radio-button label="mini"> 迷你 </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item
            v-if="activeData['show-word-limit'] !== undefined"
            label="输入统计"
          >
            <el-switch v-model="activeData['show-word-limit']" />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-input-number'"
            label="严格步数"
          >
            <el-switch v-model="activeData['step-strictly']" />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-cascader'"
            label="是否多选"
          >
            <el-switch v-model="activeData.props.props.multiple" />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-cascader'"
            label="展示全路径"
          >
            <el-switch v-model="activeData['show-all-levels']" />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-cascader'"
            label="可否筛选"
          >
            <el-switch v-model="activeData.filterable" />
          </el-form-item>
          <!-- <el-form-item
            v-if="activeData.clearable !== undefined"
            label="能否清空"
          >
            <el-switch v-model="activeData.clearable" />
          </el-form-item> -->
          <el-form-item
            v-if="activeData.showTip !== undefined"
            label="显示提示"
          >
            <el-switch v-model="activeData.showTip" />
          </el-form-item>
          <el-form-item
            v-if="
              activeData.multiple !== undefined && activeData.name === 'file'
            "
            label="多选文件"
          >
            <el-switch v-model="activeData.multiple" />
          </el-form-item>
          <el-form-item
            v-if="activeData['auto-upload'] !== undefined"
            label="自动上传"
          >
            <el-switch v-model="activeData['auto-upload']" />
          </el-form-item>
          <el-form-item
            v-if="activeData.readonly !== undefined"
            label="是否只读"
          >
            <el-switch v-model="activeData.readonly" />
          </el-form-item>
          <el-form-item
            v-if="activeData.disabled !== undefined"
            label="是否禁用"
          >
            <el-switch v-model="activeData.disabled" />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-select'"
            label="是否可搜索"
          >
            <el-switch v-model="activeData.filterable" />
          </el-form-item>
          <el-form-item
            v-if="activeData.tag === 'el-select' && !activeData.isLink"
            label="是否多选"
          >
            <el-switch v-model="activeData.multiple" @change="multipleChange" />
          </el-form-item>
          <el-form-item
            v-if="activeData.required !== undefined"
            label="是否必填"
          >
            <el-switch v-model="activeData.required" />
          </el-form-item>
          <el-form-item label="是否隐藏">
            <el-switch v-model="activeData._hidden" />
          </el-form-item>
          <template v-if="['zb'].indexOf(activeData.tagIcon) > -1">
            <el-divider>列配置</el-divider>
            <el-row class="mb8">
              <el-col :span="12">
                <el-button @click="subAdd(activeData)" type="primary"
                  >添加列配置</el-button
                >
              </el-col>
              <el-col :span="12">
                <el-button @click="subRowAdd(activeData)" type="primary"
                  >添加行数据</el-button
                >
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="12">
                <el-form-item label="显示边框">
                  <el-switch v-model="activeData.border" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="显示序号">
                  <el-switch v-model="activeData.isNumbers" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="12">
                <el-form-item label="是否操作">
                  <el-switch v-model="activeData.activeds" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开启斑马线">
                  <el-switch v-model="activeData.stripe" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="开启复制">
                  <el-switch v-model="activeData.rangeFlag" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="对齐方式">
              <el-radio-group v-model="activeData.align">
                <el-radio-button label="center"> 居中 </el-radio-button>
                <el-radio-button label="left"> 居左 </el-radio-button>
                <el-radio-button label="right"> 居右 </el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="表格大小">
              <el-radio-group v-model="activeData.size">
                <el-radio-button label="medium"> 中等 </el-radio-button>
                <el-radio-button label="small"> 较小 </el-radio-button>
                <el-radio-button label="mini"> 迷你 </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </template>
          <!-- jsz增强 -->
          <el-form-item style="margin-top: 20px" label="JS增强" v-if="!noneTag">
            <div class="ta-full-screen-box" :data-full-screen="fs.jsBtn">
              <el-button
                v-if="!fs.jsBtn"
                class="ta-fs-button"
                @click="fs.jsBtn = true"
                >全屏</el-button
              >
              <i
                v-if="fs.jsBtn"
                class="el-icon-circle-close ta-fs-button-close text-danger"
                @click="fs.jsBtn = false"
              ></i>
              <div class="ta-fs-content">
                <CAceEditor
                  v-if="activeData.expand !== undefined"
                  mode="javascript"
                  v-model="activeData.expand.js"
                  :expandType="'js'"
                ></CAceEditor>
              </div>
            </div>
          </el-form-item>

          <template v-if="activeData.layoutTree && !activeData.oneOf">
            <el-divider>布局结构树</el-divider>
            <el-tree
              :data="[activeData]"
              :props="layoutTreeProps"
              node-key="renderKey"
              default-expand-all
              draggable
            >
              <span slot-scope="{ node, data }">
                <span class="node-label">
                  <svg-icon class="node-icon" :icon-class="data.tagIcon" />
                  {{ node.label }}
                </span>
              </span>
            </el-tree>
          </template>

          <template
            v-if="
              activeData.layout === 'colFormItem' &&
              activeData.tag !== 'el-button' &&
              !noneTag
            "
          >
            <el-divider>校验选项</el-divider>
            <el-form-item>
              <el-radio-group v-model="activeData.regDataType" size="small">
                <el-radio-button label="regStatic"> 正则校验 </el-radio-button>
                <el-radio-button label="regDynamic"> JS校验 </el-radio-button>
              </el-radio-group>
            </el-form-item>

            <template v-if="activeData.regDataType === 'regStatic'">
              <div
                v-for="(item, index) in activeData.regList"
                :key="index"
                class="reg-item"
              >
                <span
                  class="close-btn"
                  @click="activeData.regList.splice(index, 1)"
                >
                  <i class="el-icon-close" />
                </span>
                <el-form-item label="表达式">
                  <el-input v-model="item.pattern" placeholder="请输入正则" />
                </el-form-item>
                <el-form-item label="错误提示" style="margin-bottom: 0">
                  <el-input
                    v-model="item.message"
                    placeholder="请输入错误提示"
                  />
                </el-form-item>
              </div>
              <div style="margin-left: 20px">
                <el-button
                  icon="el-icon-circle-plus-outline"
                  type="text"
                  @click="addReg"
                >
                  添加规则
                </el-button>
              </div>
            </template>
            <template v-if="activeData.regDataType === 'regDynamic'">
              <el-form-item label="JS校验增强">
                <div class="ta-full-screen-box" :data-full-screen="fs.regBtn">
                  <el-button
                    v-if="!fs.regBtn"
                    class="ta-fs-button"
                    @click="fs.regBtn = true"
                    >全屏</el-button
                  >
                  <i
                    v-if="fs.regBtn"
                    class="el-icon-circle-close ta-fs-button-close text-danger"
                    @click="fs.regBtn = false"
                  ></i>
                  <div class="ta-fs-content">
                    <CAceEditor
                      v-if="activeData.expand !== undefined"
                      mode="javascript"
                      v-model="activeData.expand.reg"
                      :expandType="'reg'"
                    ></CAceEditor>
                  </div>
                </div>
              </el-form-item>
            </template>
          </template>

          <template v-if="['el-text'].indexOf(activeData.tag) > -1">
            <el-form-item label="上下间距">
              <el-row>
                <el-col :span="11">
                  <el-input-number
                    :step="1"
                    v-model="activeData.pt"
                    :min="0"
                    :max="300"
                    style="width: 100%"
                    size="small"
                  ></el-input-number>
                </el-col>
                <el-col :span="2" style="text-align: center">~</el-col>
                <el-col :span="11">
                  <el-input-number
                    :step="1"
                    v-model="activeData.pb"
                    :min="0"
                    :max="300"
                    style="width: 100%"
                    size="small"
                  ></el-input-number>
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item label="左右间距">
              <el-row>
                <el-col :span="11">
                  <el-input-number
                    :step="1"
                    v-model="activeData.pl"
                    :min="0"
                    :max="300"
                    style="width: 100%"
                    size="small"
                  ></el-input-number>
                </el-col>
                <el-col :span="2" style="text-align: center">~</el-col>
                <el-col :span="11">
                  <el-input-number
                    :step="1"
                    v-model="activeData.pr"
                    :min="0"
                    :max="300"
                    style="width: 100%"
                    size="small"
                  ></el-input-number>
                </el-col>
              </el-row>
            </el-form-item>
            <c-editor ref="editor" v-model="activeData.defaultValue" />
          </template>
          <template v-if="['el-card'].indexOf(activeData.tag) > -1">
            <el-form-item label="左侧标题">
              <el-input
                :value="activeData.leftTitle"
                placeholder="请输入标题"
                @input="onDefaultValueInput($event, 'leftTitle')"
              />
            </el-form-item>
            <el-form-item label="是否显示标题">
              <el-switch v-model="activeData.isHeader" />
            </el-form-item>
          </template>
        </el-form>
        <!-- 表单属性 -->
        <el-form v-show="currentTab === 'form'" size="small" label-width="90px">
          <el-form-item label="表单名">
            <el-input
              :disabled="pageTypes && pageTypes === 'edit'"
              v-model="formConf.formRef"
              placeholder="请输入表单名（ref）"
            />
          </el-form-item>
          <el-form-item label="表单尺寸">
            <el-radio-group v-model="formConf.size">
              <el-radio-button label="medium"> 中等 </el-radio-button>
              <el-radio-button label="small"> 较小 </el-radio-button>
              <el-radio-button label="mini"> 迷你 </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标签对齐">
            <el-radio-group v-model="formConf.labelPosition">
              <el-radio-button label="left"> 左对齐 </el-radio-button>
              <el-radio-button label="right"> 右对齐 </el-radio-button>
              <el-radio-button label="top"> 顶部对齐 </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="标签宽度">
            <el-input-number
              v-model="formConf.labelWidth"
              placeholder="标签宽度"
            />
          </el-form-item>
          <el-form-item label="栅格间隔">
            <el-input-number
              v-model="formConf.gutter"
              :min="0"
              placeholder="栅格间隔"
            />
          </el-form-item>
          <!-- <el-form-item label="禁用表单">
            <el-switch v-model="formConf.disabled" />
          </el-form-item> -->
          <el-form-item label="表单按钮">
            <el-switch v-model="formConf.formBtns" />
          </el-form-item>
          <!-- <el-form-item label="显示未选中组件边框">
            <el-switch v-model="formConf.unFocusedComponentBorder" />
          </el-form-item> -->
        </el-form>

        <el-form
          v-show="currentTab === 'deviceType'"
          size="small"
          label-width="90px"
        >
          <p class="crf-tips">
            注：调试配置仅用于本次调试，实际显示以真机为主！！！
          </p>
          <el-divider />
          <el-form-item label="设备类型">
            <el-radio-group v-model="formConf.deviceType">
              <el-radio-button label="PC">PC端</el-radio-button>
              <el-radio-button label="mobile">移动端</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </el-scrollbar>
    </div>

    <treeNode-dialog
      :visible.sync="dialogVisible"
      title="添加选项"
      @commit="addNode"
    />
    <icons-dialog
      :visible.sync="iconsVisible"
      :current="activeData[currentIconModel]"
      @select="setIcon"
    />

    <el-dialog
      width="89%"
      title="列配置"
      :visible.async="subVisible"
      :show-close="false"
      ref="subVisible"
    >
      <!-- :extTablesJson="extTablesJson"
        :dataSource="dataSource"
        :beforeEditMethodFn="beforeEditMethod"
        @valueChange="handleValueChange" -->
      <CvxeTable
        ref="subConfigTable"
        keep-source
        dragSortKey="orderNum"
        dragSort
        :minHeight="500"
        toolbar
        border
        :columns="subColumns"
        :dataSource="subColumnsData"
        @handlePasteInput="handlePasteInput"
      >
        <template v-slot:toolbarSuffix>
          <div style="display: flex">
            <el-button type="primary" plain size="mini" @click="addsubItem">
              添加列
            </el-button>
            <!-- <div class="ml10" style="display: flex">
              <addPop
                expandType="js"
                title="添加行JS增强"
                v-model="addExpandJs"
                @btnPop="btnPop"
              ></addPop>
              <delPop
                class="ml10"
                expandType="js"
                title="删除行JS增强"
                v-model="addExpandJs"
                @btnPop="btnPop"
              ></delPop>
            </div> -->
          </div>
        </template>
        <template #actions="{ row, rowIndex }">
          <template>
            <span class="drag-btn">
              <i class="el-icon-rank" />
            </span>
          </template>
        </template>
        <template #actionDictCode="{ row, rowIndex }">
          <el-select
            v-model="row.dictCode"
            placeholder="字典编码"
            clearable
            filterable
            style="width: 100%"
            @change="
              (e) => {
                handleValueChange(e, row);
              }
            "
          >
            <el-option
              v-for="dict in dictList"
              :key="dict.dictId"
              :label="dict.dictName"
              :value="dict.dictType"
            />
          </el-select>
        </template>

        <template #rightAction="{ row, rowIndex }">
          <div class="close-btn-sub select-line-icon" @click="delSub(row)">
            <i class="el-icon-remove-outline" />
          </div>
        </template>
      </CvxeTable>
      <div slot="footer" class="dialog-footer">
        <el-button @click="subVisible = false">关 闭</el-button>
        <el-button type="primary" @click="subSave">保 存</el-button>
      </div>
    </el-dialog>

    <el-dialog
      width="89%"
      title="添加行"
      :visible.async="subRowVisible"
      :show-close="false"
    >
      <CEditable
        ref="subRow"
        :dataModel="[]"
        :widget="subRowActived"
      ></CEditable>
      <div slot="footer" class="dialog-footer">
        <el-button @click="subRowVisible = false">关 闭</el-button>
        <el-button type="primary" @click="subRowSave">保 存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import TreeNodeDialog from "./TreeNodeDialog";
import { isNumberStr } from "@/utils/index";
import IconsDialog from "./IconsDialog";
import CAceEditor from "@/components/OnLine/comp/ace";
import { packageOptions } from "@/utils/generTemp/index.js";
import Pop from "../tablePop/CInputPop.vue";
import addPop from "../tablePop/CaddBtnPop.vue";
import delPop from "../tablePop/CdelBtnPop.vue";
import CEditable from "@/components/OnLine/comp/CEditable/index.vue";
import {
  inputComponents,
  selectComponents,
  layoutComponents,
} from "@/utils/generator/config";
import { listType } from "@/api/system/dict/type";

const dateTimeFormat = {
  date: "yyyy-MM-dd",
  week: "yyyy 第 WW 周",
  month: "yyyy-MM",
  year: "yyyy",
  datetime: "yyyy-MM-dd HH:mm:ss",
  daterange: "yyyy-MM-dd",
  monthrange: "yyyy-MM",
  datetimerange: "yyyy-MM-dd HH:mm:ss",
};
import { randomString } from "@/utils/generTemp/index.js";

export default {
  components: {
    draggable,
    TreeNodeDialog,
    IconsDialog,
    CAceEditor,
    Pop,
    addPop,
    delPop,
    CEditable,
  },
  props: ["showField", "activeData", "formConf", "pageTypes"],
  data() {
    return {
      addExpandJs: "",
      delExpandJs: "",
      subRowVisible: false,
      subRowActived: {},
      subColumnsData: [],
      subColumns: [
        {
          title: "",
          type: "slot",
          width: "50px",
          slotName: "actions",
        },
        {
          title: "排序",
          key: "orderNum",
          isOrder: true,
          type: "hidden",
          defaultValue: 0,
        },
        {
          title: "",
          key: "layout",
          type: "hidden",
          defaultValue: "colFormItem",
        },
        {
          title: "",
          key: "formId",
          type: "hidden",
          // defaultValue: randomString(8),
        },
        {
          title: "",
          key: "renderKey",
          type: "hidden",
          // defaultValue: +new Date() + randomString(8),
        },
        {
          title: "字段名称",
          key: "label",
          defaultValue: "",
          type: "input",
          placeholder: "请输入字段名称",
          pasteFlag: true,
        },
        {
          title: "字段KEY",
          key: "vModel",
          type: "input",
          placeholder: "请输入字段KEY",
          // defaultValue: `field${randomString(8)}`,
        },
        {
          title: "字段类型",
          key: "tagType",
          type: "select",
          options: [
            // 下拉选项
            { label: "文本框", value: "el-input" },
            { label: "下拉框", value: "el-select" },
            { label: "日期(yyyy-MM-dd)", value: "date" },
            { label: "日期（yyyy-MM-dd HH:mm:ss）", value: "datetime" },
            { label: "计数器", value: "el-input-number" },
            { label: "单选组", value: "radio" },
            { label: "多选组", value: "checkbox" },
            // { label: "开关", value: "el-switch" },
            { label: "时间（HH:mm:ss）", value: "time" },
            { label: "normal", value: "normal" },
          ],
          defaultValue: "el-input",
          alwayCol: true,
        },
        {
          title: "默认值",
          key: "defaultValue",
          type: "input",
          defaultValue: "",
        },
        {
          title: "字典code",
          key: "dictCode",
          type: "slot",
          slotName: "actionDictCode",
        },
        {
          title: "显示列",
          key: "hidden",
          type: "checkbox",
          customValue: ["Y", "N"],
          defaultChecked: true,
          width: "70",
          alwayCol: true,
        },
        {
          title: "显示控件",
          key: "isdefaultTag",
          type: "checkbox",
          customValue: ["Y", "N"],
          defaultChecked: false,
          width: "80",
          alwayCol: true,
        },

        {
          title: "是否必填",
          key: "required",
          type: "checkbox",
          customValue: ["Y", "N"],
          defaultChecked: false,
          width: "80",
          alwayCol: true,
        },
        {
          title: "校验提示",
          key: "requiredMessage",
          type: "input",
          defaultValue: "${title}",
        },
        {
          title: "js增强",
          key: "expandJs",
          slots: {
            default: ({ row }) => {
              return [
                <Pop
                  expandType={"js"}
                  onChanges={(val) => {
                    row.expandJs = val;
                  }}
                  title={"JS增强"}
                  v-model={row.expandJs}
                ></Pop>,
              ];
            },
          },
        },
        {
          title: "自定义校验",
          key: "expandReg",
          // type: "input",
          slots: {
            default: ({ row }) => {
              return [
                <Pop
                  expandType={"reg"}
                  onChanges={(val) => {
                    row.expandReg = val;
                  }}
                  title={"自定义校验"}
                  v-model={row.expandReg}
                ></Pop>,
              ];
            },
          },
        },
        {
          title: "列宽",
          key: "width",
          type: "input",
          defaultValue: "auto",
        },
        {
          title: "操作",
          type: "slot",
          width: "50px",
          slotName: "rightAction",
        },
      ],
      subVisible: false, // 子表添加列弹框
      currentTab: "field",
      currentNode: null,
      dialogVisible: false,
      iconsVisible: false,
      currentIconModel: null,
      dateTypeOptions: [
        {
          label: "日(date)",
          value: "date",
        },
        {
          label: "周(week)",
          value: "week",
        },
        {
          label: "月(month)",
          value: "month",
        },
        {
          label: "年(year)",
          value: "year",
        },
        {
          label: "日期时间(datetime)",
          value: "datetime",
        },
      ],
      dateRangeTypeOptions: [
        {
          label: "日期范围(daterange)",
          value: "daterange",
        },
        {
          label: "月范围(monthrange)",
          value: "monthrange",
        },
        {
          label: "日期时间范围(datetimerange)",
          value: "datetimerange",
        },
      ],
      colorFormatOptions: [
        {
          label: "hex",
          value: "hex",
        },
        {
          label: "rgb",
          value: "rgb",
        },
        {
          label: "rgba",
          value: "rgba",
        },
        {
          label: "hsv",
          value: "hsv",
        },
        {
          label: "hsl",
          value: "hsl",
        },
      ],
      justifyOptions: [
        {
          label: "start",
          value: "start",
        },
        {
          label: "end",
          value: "end",
        },
        {
          label: "center",
          value: "center",
        },
        {
          label: "space-around",
          value: "space-around",
        },
        {
          label: "space-between",
          value: "space-between",
        },
      ],
      layoutTreeProps: {
        label(data, node) {
          return data.componentName || `${data.label}: ${data.vModel}`;
        },
      },
      fs: {
        jsBtn: false,
        regBtn: false,
        editor: false,
      },
      dictList: [],
      expandType: "js",
    };
  },
  computed: {
    documentLink() {
      return (
        this.activeData.document ||
        "https://element.eleme.cn/#/zh-CN/component/installation"
      );
    },
    dateOptions() {
      if (
        this.activeData.type !== undefined &&
        this.activeData.tag === "el-date-picker"
      ) {
        if (this.activeData["start-placeholder"] === undefined) {
          return this.dateTypeOptions;
        }
        return this.dateRangeTypeOptions;
      }
      return [];
    },
    tagList() {
      return [
        {
          label: "输入型组件",
          options: inputComponents,
        },
        {
          label: "选择型组件",
          options: selectComponents,
        },
      ];
    },
    noneTag() {
      let is =
        this.activeData.tag == "el-divider" ||
        this.activeData.tag == "el-text" ||
        this.activeData.tempComponents ||
        // this.activeData.layout == "rowFormItem" ||
        this.activeData.layout == "card";
      return is;
    },
  },

  created() {
    this.getList();
  },
  methods: {
    btnPop(val, type) {
      this.activeData[type] = val;
    },
    subRowSave() {
      let xtable =
        this.$refs.subRow.$refs[
          "multipleTable_" + this.subRowActived.renderKey
        ];
      let newData = xtable.getTableData();
      for (let i = 0; i < newData.length; i++) {
        let element = newData[i];
        delete element.rowId;
      }
      this.activeData.defaultValue = newData;
      this.subRowVisible = false;
    },
    subRowAdd(activeData) {
      if (activeData && activeData.children.length) {
        this.subRowActived = {
          ...activeData,
          activeds: true,
          children: activeData.children.map((v) => {
            if (v.tagType == "el-input") {
              return {
                ...v,
                pasteFlag: true,
                alwayCol: false,
              };
            } else if (v.tagType == "normal") {
              return {
                ...v,
                pasteFlag: true,
                tagType: "el-input",
                alwayCol: false,
              };
            } else {
              return { ...v, alwayCol: false };
            }
          }),
        }; 
        this.subRowVisible = true;
      }
    },
    handleValueChange(val, row) {
      if (val) {
        this.getDicts(val).then((res) => {
          if (res.code == 200) {
            this.$set(
              row,
              "options",
              packageOptions(res.data, "dictLabel", "dictValue")
            );
            this.$set(row, "defaultValue", "");
          } else {
            console.group(`查询字典(${column.dictCode})发生异常`);
            console.warn(res.message);
            console.groupEnd();
          }
        });
      } else {
        this.$set(row, "options", []);
      }
    },
    handlePasteInput({ visibleData }) {
      this.subColumnsData = visibleData.map((v) => {
        return {
          ...v,
          formId: v.formId || randomString(8),
          renderKey: v.renderKey || +new Date() + randomString(8),
          layout: "colFormItem",
          vModel: v.vModel || `field${randomString(8)}`,
        };
      });
    },
    subSave() {
      let subConfigTable = this.$refs.subConfigTable;
      let newData = subConfigTable.getTableData();
      for (let i = 0; i < newData.length; i++) {
        let element = newData[i];
        delete element.rowId;
      }
      if (newData && newData.length) {
        let newval = [];
        newData.forEach((v) => {
          if (v.label) {
            newval.push(v);
          }
        });
        this.activeData.children = newval;
      }
      this.subVisible = false;
      this.subColumnsData = [];
    },
    // 子表列添加每一项
    addsubItem() {
      let subConfigTable = this.$refs.subConfigTable;
      // let newData = subConfigTable.getTableData();
      subConfigTable.addRows({
        formId: randomString(8),
        renderKey: +new Date() + randomString(8),
        layout: "colFormItem",
        vModel: `field${randomString(8)}`,
      });
      this.subColumnsData = subConfigTable.getTableData();
    },
    delSub(row) {
      let subConfigTable = this.$refs.subConfigTable;
      let newData = subConfigTable.getTableData();
      if (newData.length > 1) {
        subConfigTable.removeRows(row);
      } else {
        this.$modal.msgError("至少保留一个字段");
      }
    },
    // 子表添加配置
    subAdd(activeData) {
      this.subColumnsData = activeData.children;
      this.addExpandJs = JSON.parse(JSON.stringify(activeData.addExpandJs));
      this.delExpandJs = JSON.parse(JSON.stringify(activeData.delExpandJs));
      this.subVisible = true;
    },
    editorOpen() {
      this.fs.editor = true;
      this.$nextTick(() => {
        const editor = this.$refs.editor;
        setTimeout(() => {
          const tinyEditor = editor.$refs.tinyEditor.editor;
          if (tinyEditor) {
            tinyEditor.execCommand("mceFullScreen"); // 调用全屏命令
          }
        }, 10);
      });
    },
    isLinkChange(val) {
      const valueFormat = val ? "remoteAPI" : "dynamic";
      this.$set(this.activeData, "dataType", valueFormat);
    },
    dictCodeChange(val, activeData) {
      if (val) {
        this.getDicts(val).then((res) => {
          if (res.code == 200) {
            this.$set(
              activeData,
              "options",
              packageOptions(res.data, "dictLabel", "dictValue")
            );
            this.$set(activeData, "dataType", "dynamic");
          } else {
            console.group(`查询字典(${column.dictCode})发生异常`);
            console.warn(res.message);
            console.groupEnd();
          }
        });
      } else {
        this.$set(activeData, "options", []);
      }
    },
    /** 查询字典类型列表 */
    getList() {
      listType({ pageNum: 1, pageSize: 100000 }).then((response) => {
        this.dictList = response.rows;
      });
    },
    addReg() {
      this.activeData.regList.push({
        pattern: "",
        message: "",
      });
    },
    addSelectItem() {
      this.activeData.options.push({
        label: "",
        value: "",
      });
    },
    addTreeItem() {
      ++this.idGlobal;
      this.dialogVisible = true;
      this.currentNode = this.activeData.options;
    },
    renderContent(h, { node, data, store }) {
      return (
        <div class="custom-tree-node">
          <span>{node.label}</span>
          <span class="node-operation">
            <i
              on-click={() => this.append(data)}
              class="el-icon-plus"
              title="添加"
            ></i>
            <i
              on-click={() => this.remove(node, data)}
              class="el-icon-delete"
              title="删除"
            ></i>
          </span>
        </div>
      );
    },
    append(data) {
      if (!data.children) {
        this.$set(data, "children", []);
      }
      this.dialogVisible = true;
      this.currentNode = data.children;
    },
    remove(node, data) {
      const { parent } = node;
      const children = parent.data.children || parent.data;
      const index = children.findIndex((d) => d.id === data.id);
      children.splice(index, 1);
    },
    addNode(data) {
      this.currentNode.push(data);
    },
    setOptionValue(item, val) {
      item.value = isNumberStr(val) ? +val : val;
    },
    setDefaultValue(val) {
      if (Array.isArray(val)) {
        return val.join(",");
      }
      if (["string", "number"].indexOf(val) > -1) {
        return val;
      }
      if (typeof val === "boolean") {
        return `${val}`;
      }
      return val;
    },
    onDefaultValueInput(str, text) {
      if (Array.isArray(this.activeData.defaultValue)) {
        // 数组
        this.$set(
          this.activeData,
          "defaultValue",
          str.split(",").map((val) => (isNumberStr(val) ? +val : val))
        );
      } else if (["true", "false"].indexOf(str) > -1) {
        // 布尔
        this.$set(this.activeData, "defaultValue", JSON.parse(str));
      } else {
        if (text) {
          this.$set(this.activeData, text, isNumberStr(str) ? +str : str);
        }
        // 字符串和数字
        this.$set(
          this.activeData,
          "defaultValue",
          isNumberStr(str) ? +str : str
        );
      }
    },
    onSwitchValueInput(val, name) {
      if (["true", "false"].indexOf(val) > -1) {
        this.$set(this.activeData, name, JSON.parse(val));
      } else {
        this.$set(this.activeData, name, isNumberStr(val) ? +val : val);
      }
    },
    setTimeValue(val, type) {
      const valueFormat = type === "week" ? dateTimeFormat.date : val;
      this.$set(this.activeData, "defaultValue", null);
      this.$set(this.activeData, "value-format", valueFormat);
      this.$set(this.activeData, "format", val);
    },

    spanChange(val) {
      this.formConf.span = val;
    },
    multipleChange(val) {
      this.$set(this.activeData, "defaultValue", val ? [] : "");
    },
    dateTypeChange(val) {
      this.setTimeValue(dateTimeFormat[val], val);
    },
    rangeChange(val) {
      this.$set(
        this.activeData,
        "defaultValue",
        val ? [this.activeData.min, this.activeData.max] : this.activeData.min
      );
    },
    rateTextChange(val) {
      if (val) this.activeData["show-score"] = false;
    },
    rateScoreChange(val) {
      if (val) this.activeData["show-text"] = false;
    },
    colorFormatChange(val) {
      this.activeData.defaultValue = null;
      this.activeData["show-alpha"] = val.indexOf("a") > -1;
      this.activeData.renderKey = +new Date(); // 更新renderKey,重新渲染该组件
    },
    openIconsDialog(model) {
      this.iconsVisible = true;
      this.currentIconModel = model;
    },
    setIcon(val) {
      this.activeData[this.currentIconModel] = val;
    },
    tagChange(tagIcon) {
      let target = inputComponents.find((item) => item.tagIcon === tagIcon);
      if (!target)
        target = selectComponents.find((item) => item.tagIcon === tagIcon);
      this.$emit("tag-change", target);
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .close-btn-sub {
  cursor: pointer;
  &.select-line-icon {
    color: #f56c6c;
  }
}
.right-board {
  width: 350px;
  position: absolute;
  right: 0;
  top: 0;
  padding-top: 3px;
  .field-box {
    position: relative;
    // height: calc(100vh - 42px);
    height: calc(100vh - 130px);
    box-sizing: border-box;
    overflow: hidden;
  }
  .el-scrollbar {
    height: 100%;
  }
}

.select-item {
  display: flex;
  border: 1px dashed #fff;
  box-sizing: border-box;
  & .close-btn {
    cursor: pointer;
    color: #f56c6c;
  }
  & .el-input + .el-input {
    margin-left: 4px;
  }
}
.select-item + .select-item {
  margin-top: 4px;
}
.select-item.sortable-chosen {
  border: 1px dashed rgb(255, 89, 64);
}
.select-line-icon {
  line-height: 32px;
  font-size: 22px;
  padding: 0 4px;
  color: #777;
}
.option-drag {
  cursor: move;
}
.time-range {
  .el-date-editor {
    width: 227px;
  }
  ::v-deep .el-icon-time {
    display: none;
  }
}
.document-link {
  position: absolute;
  display: block;
  width: 26px;
  height: 26px;
  top: 0;
  left: 0;
  cursor: pointer;
  background: #409eff;
  z-index: 1;
  border-radius: 0 0 6px 0;
  text-align: center;
  line-height: 26px;
  color: #fff;
  font-size: 18px;
}
.node-label {
  font-size: 14px;
}
.node-icon {
  color: #bebfc3;
}
.ta-full-screen-box {
  position: relative;
  ::v-deep .el-textarea__inner {
    color: #fff;
    background-color: #444;
  }

  .ta-fs-button {
    position: absolute;
    top: -1px;
    right: 0px;
    width: 42px;
    height: 22px;
    padding: 0;
    z-index: 10;
    font-size: 12px;
  }

  // 全屏后的样式
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
.crf-tips {
  color: #f56c6c;
  font-size: 10px;
  line-height: 18px;
  margin-top: 6px;
}
</style>
