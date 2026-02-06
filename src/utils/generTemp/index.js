import Vue from "vue";

/** 一个空方法 */
export const noop = () => {};

/**
 * 随机生成数字
 *
 * 示例：生成长度为 12 的随机数：randomNumber(12)
 * 示例：生成 3~23 之间的随机数：randomNumber(3, 23)
 *
 * @param1 最小值 | 长度
 * @param2 最大值
 * @return int 生成后的数字
 */

export function randomNumber() {
  // 生成 最小值 到 最大值 区间的随机数
  const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };
  if (arguments.length === 1) {
    let [length] = arguments;
    // 生成指定长度的随机数字，首位一定不是 0
    let nums = [...Array(length).keys()].map((i) =>
      i > 0 ? random(0, 9) : random(1, 9)
    );
    return parseInt(nums.join(""));
  } else if (arguments.length >= 2) {
    let [min, max] = arguments;
    return random(min, max);
  } else {
    return Number.NaN;
  }
}

export function randomKey() {
  return Date.now() + "_" + randomNumber(6);
}

/**
 * 随机生成字符串
 * @param length 字符串的长度
 * @param chats 可选字符串区间（只会生成传入的字符串中的字符）
 * @return string 生成的字符串
 */
export function randomString(length, chats) {
  if (!length) length = 1;
  if (!chats) chats = "0123456789qwertyuioplkjhgfdsazxcvbnm";
  let str = "";
  for (let i = 0; i < length; i++) {
    let num = randomNumber(0, chats.length - 1);
    str += chats[num];
  }
  return str;
}

/**
 * 通用封装options
 * 用于将一组数据封装成组件可识别的options
 */
export const packageOptions = (source = [], labelName, valueName) => {
  // const labels = labelName.split(',');
  return source.map((item) => {
    return {
      label: item[labelName],
      value: item[valueName] + "",
      id: item[valueName],
    };
  });
};
/**
 * 获取指定的 $refs 对象
 * 有时候可能会遇到组件未挂载到页面中的情况，导致无法获取 $refs 中的某个对象
 * 这个方法可以等待挂载完成之后再返回 $refs 的对象，避免报错
 **/
export const getRefPromise = (_this, name, ms = 10) => {
  return new Promise((resolve) => {
    (function next() {
      let ref = _this.$refs[name];
      if (ref) {
        resolve(ref);
      } else {
        setTimeout(() => {
          next();
        }, ms);
      }
    })();
  });
};

/**
 * 深度克隆对象、数组
 * 注意：无法克隆带有方法的对象或数组
 * @param obj 被克隆的对象
 * @return 克隆后的对象
 */
export const cloneObject = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

export const subTableSupportTypes = {
  "el-input": "input",
  "el-input-number": "inputNumber",
  "el-select": "select",
  "el-cascader": "cascader",
  "el-switch": "switch",
  "el-rate": "rate",
  "el-slider": "slider",
  radio: "radio",
  checkbox: "checkbox",
  time: "time",
  date: "date",
  datetime: "datetime",
  "el-color-picker": "colorPicker",
  "el-slider": "slider",
  "el-rate": "rate",
  normal: "normal",
};

// /**
//  * 检查是否是子表支持的类型
//  * @returns {boolean}
//  */
// export const subTableCheckType = (checkType) => {
//   // 检查拖入的组件是否已被支持
//   for (let type of subTableSupportTypes) {
//     if (`${checkType}`.toLowerCase() === type.toLowerCase()) {
//       return true;
//     }
//   }
//   return false;
// };

/**
 * 递归调用处理所有的组件（包括栅格或其他容器组件内的组件）
 * 注：这是一个同步方法
 */
export const recursiveAllWidget = (dataList, handler) => {
  let flagBreak = false;
  const breakFn = () => (flagBreak = true);
  // 递归方法
  const recursive = (array, parent) => {
    for (let item of array) {
      if (flagBreak) break;
      // 判断是否是栅格或其他容器组件
      if (item.layout == "rowFormItem") {
        // if (item.children) {
        //   for (let column of item.children) {
        //     if (flagBreak) break;
        //     recursive(column.children, item, breakFn);
        //     if (flagBreak) break;
        //   }
        // } else
        if (item.tagIcon === "jxq") {
          // 卡片和tab需要特殊处理
          recursive(item.children, item, breakFn);
        } else if (item.tagIcon === "ocr") {
          // for (let pane of item.panes) {
          //   if (flagBreak) break;
          //   recursive(pane.list, item, breakFn);
          //   if (flagBreak) break;
          // }
        }
      }
      // 执行处理回调
      try {
        if (typeof handler === "function") handler(item, parent, breakFn);
      } catch (e) {
        console.error(e);
      }
      if (flagBreak) break;
    }
  };
  recursive(dataList, null);
};

/** 寻找某个组件的父级，如果有父级就返回，没有就返回 null */
export const findElementParent = (list, element) => {
  let flag = null;
  recursiveAllWidget(list, (item, parent) => {
    if (item === element && flag === null) {
      flag = parent;
    }
  });
  return flag;
};

/**
 * 可用于判断是否成功
 * @type {symbol}
 */
export const succeedSymbol = Symbol();
/**
 * 可用于判断是否失败
 * @type {symbol}
 */
export const failedSymbol = Symbol();

/**
 * 使 promise 无论如何都会 resolve，除非传入的参数不是一个Promise对象或返回Promise对象的方法
 * 一般用在 Promise.all 中
 *
 * @param promise 可传Promise对象或返回Promise对象的方法
 * @returns {Promise<any>}
 */
export const alwaysResolve = (promise) => {
  return new Promise((resolve, reject) => {
    let p = promise;
    if (typeof promise === "function") {
      p = promise();
    }
    if (p instanceof Promise) {
      p.then((data) => {
        resolve({ type: succeedSymbol, data });
      }).catch((error) => {
        resolve({ type: failedSymbol, error });
      });
    } else {
      reject(
        "alwaysResolve: 传入的参数不是一个Promise对象或返回Promise对象的方法"
      );
    }
  });
};

/**
 * 下载文件
 * @param url
 * @param fileName
 */
export const downloadFile = (url, fileName) => {
  if (!url) {
    return;
  }
  //获取文件名
  if (!fileName) {
    let lastIndex = url.lastIndexOf("/");
    if (lastIndex != -1) {
      fileName = url.substring(lastIndex + 1);
    }
  }
  let link = document.createElement("a");
  let event = new MouseEvent("click");
  link.href = url;
  link.target = "_blank";
  link.download = fileName || "下载图片";
  // 触发a的单击事件
  link.dispatchEvent(event);
};
/**
 * @description: 下载图片
 * @param {*} url: 图片地址
 * @param {*} name: 图片名称
 * @return {*} result
 */
export const downloadImage = (url, name) => {
  if (!url) {
    return;
  }
  let image = new Image();
  image.setAttribute("crossOrigin", "anonymous");
  image.src = url;
  image.onload = () => {
    let canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    let ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height);
    canvas.toBlob((blob) => {
      let url = URL.createObjectURL(blob);
      let eleLink = document.createElement("a");
      eleLink.download = name;
      eleLink.href = url;
      eleLink.click();
      eleLink.remove();
      // 用完释放URL对象
      URL.revokeObjectURL(url);
    });
  };
};

/**
 *
 * 深度冻结对象
 * @param obj Object or Array
 */
export const freezeDeep = (obj) => {
  if (obj != null) {
    if (Array.isArray(obj)) {
      obj.forEach((item) => freezeDeep(item));
    } else if (typeof obj === "object") {
      Object.values(obj).forEach((value) => {
        freezeDeep(value);
      });
    }
    Object.freeze(obj);
  }
};

/**
 * 简单实现防抖方法
 *
 * 防抖(debounce)函数在第一次触发给定的函数时，不立即执行函数，而是给出一个期限值(delay)，比如100ms。
 * 如果100ms内再次执行函数，就重新开始计时，直到计时结束后再真正执行函数。
 * 这样做的好处是如果短时间内大量触发同一事件，只会执行一次函数。
 *
 * @param fn 要防抖的函数
 * @param delay 防抖的毫秒数
 * @returns {Function}
 */
export const simpleDebounce = (fn, delay = 100) => {
  let timer = null;
  return function () {
    let args = arguments;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

/**
 * 根据组件名获取父级
 * @param vm
 * @param name
 * @returns {Vue | null|null|Vue}
 */
export const getVmParentByName = (vm, name) => {
  let parent = vm.$parent;
  if (parent && parent.$options) {
    if (parent.$options.name === name) {
      return parent;
    } else {
      let res = getVmParentByName(parent, name);
      if (res) {
        return res;
      }
    }
  }
  return null;
};

/**
 * 如果值不存在就 push 进数组，反之不处理
 * @param array 要操作的数据
 * @param value 要添加的值
 * @param key 可空，如果比较的是对象，可能存在地址不一样但值实际上是一样的情况，可以传此字段判断对象中唯一的字段，例如 id。不传则直接比较实际值
 * @returns {boolean} 成功 push 返回 true，不处理返回 false
 */
export const pushIfNotExist = (array, value, key) => {
  for (let item of array) {
    if (key && item[key] === value[key]) {
      return false;
    } else if (item === value) {
      return false;
    }
  }
  array.push(value);
  return true;
};

export const isEmpty = (str) => {
  return str == null || str === "";
};

/**
 * 下拉选项里的value值全都 toString
 * @param options
 */
export const optionsValueToString = (options) => {
  if (Array.isArray(options) && options.length > 0) {
    return options.map((opt) => {
      let label = opt.label || opt.text || opt.title;
      return {
        value: (isEmpty(opt.value) ? label : opt.value).toString(),
        label: label || opt.value,
      };
    });
  }
  return [];
};

/**
 * 使一个值永远不会为（null | undefined）
 *
 * @param value 要处理的值
 * @param def 默认值，如果value为（null | undefined）则返回的默认值，可不传，默认为''
 */
export const neverNull = (value, def) => {
  return value == null ? neverNull(def, "") : value;
};

/**
 * 过滤数组空值（null | undefined | 空字符串）
 * 用法： let arr = [];  arr.filter(filterEmpty);
 *
 * @param v
 */
export const filterEmpty = (v) => {
  return v != null && v !== "";
};

/**
 * 过滤对象中为空的属性
 * 用法：let obj = {};  filterObjectEmpty(obj)
 *
 * @param obj 要过滤的对象
 */
export const filterObjectEmpty = (obj) => {
  if (typeof obj !== "object") {
    return;
  }
  for (let key of Object.keys(obj)) {
    if (!filterEmpty(obj[key])) {
      delete obj[key];
    }
  }
  return obj;
};

/**
 * 获取事件冒泡路径，兼容 IE11，Edge，Chrome，Firefox，Safari
 * 目前使用的地方：JEditableTable Span模式
 */
export function getEventPath(event) {
  let target = event.target;
  let path = (event.composedPath && event.composedPath()) || event.path;

  if (path !== null) {
    return path.indexOf(window) < 0 ? path.concat(window) : path;
  }

  if (target === window) {
    return [window];
  }

  let getParents = (node, memo) => {
    memo = memo || [];
    const parentNode = node.parentNode;

    if (!parentNode) {
      return memo;
    } else {
      return getParents(parentNode, memo.concat(parentNode));
    }
  };
  return [target].concat(getParents(target), window);
}
