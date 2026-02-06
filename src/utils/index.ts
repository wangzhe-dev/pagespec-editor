/**
 * Utility Functions
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// Class utilities
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Clipboard
// ============================================================================

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const result = document.execCommand('copy');
    document.body.removeChild(textarea);
    return result;
  } catch (e) {
    console.error('Failed to copy to clipboard:', e);
    return false;
  }
}

// ============================================================================
// Debounce
// ============================================================================

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ============================================================================
// Throttle
// ============================================================================

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// Deep Clone
// ============================================================================

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// ============================================================================
// JSON Export/Import
// ============================================================================

export function downloadJSON(data: any, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importJSON(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// ============================================================================
// String utilities
// ============================================================================

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function toPascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

// ============================================================================
// Date formatting
// ============================================================================

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (minutes > 0) return `${minutes} 分钟前`;
  return '刚刚';
}

// ============================================================================
// ID generation
// ============================================================================

export function generateId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// Title Case
// ============================================================================
export function titleCase(str: string): string {
  return str.replace(/( |^)[a-z]/g, (L: string) => L.toUpperCase())
}



// ============================================================================
// Beautifier Options
// ============================================================================
export interface BeautifierOptions {
  indent_size?: number | string;
  indent_char?: string;
  max_preserve_newlines?: number | string;
  preserve_newlines?: boolean;
  keep_array_indentation?: boolean;
  break_chained_methods?: boolean;
  indent_scripts?: 'normal' | 'separate' | string;
  brace_style?: string;
  space_before_conditional?: boolean;
  unescape_strings?: boolean;
  jslint_happy?: boolean;
  end_with_newline?: boolean;
  wrap_line_length?: number | string;
  indent_inner_html?: boolean;
  comma_first?: boolean;
  e4x?: boolean;
  indent_empty_lines?: boolean;
  [key: string]: any;
}

export const beautifierConf: Readonly<Record<'html' | 'js', BeautifierOptions>> = {
  html: {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: -1,
    preserve_newlines: false,
    keep_array_indentation: false,
    break_chained_methods: false,
    indent_scripts: 'separate',
    brace_style: 'end-expand',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: false,
    end_with_newline: true,
    wrap_line_length: 110,
    indent_inner_html: true,
    comma_first: false,
    e4x: true,
    indent_empty_lines: true,
  },
  js: {
    indent_size: 2,
    indent_char: ' ',
    max_preserve_newlines: -1,
    preserve_newlines: false,
    keep_array_indentation: false,
    break_chained_methods: false,
    indent_scripts: 'normal',
    brace_style: 'end-expand',
    space_before_conditional: true,
    unescape_strings: false,
    jslint_happy: true,
    end_with_newline: true,
    wrap_line_length: 110,
    indent_inner_html: true,
    comma_first: false,
    e4x: true,
    indent_empty_lines: true,
  },
};

/**
 * Get beautifier options for a given language, optionally merging overrides.
 */
export function getBeautifierOptions(
  lang: 'html' | 'js',
  overrides?: Partial<BeautifierOptions>,
): BeautifierOptions {
  return { ...(beautifierConf[lang] as BeautifierOptions), ...(overrides || {}) };
}

// ============================================================================
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

export function randomNumber(min: number, max?: number) {
  // 生成 最小值 到 最大值 区间的随机数
  const random = (from: number, to: number) => {
    return Math.floor(Math.random() * (to - from + 1) + from);
  };

  if (max === undefined) {
    const length = min;
    // 生成指定长度的随机数字，首位一定不是 0
    let nums = [...Array(length).keys()].map((i) =>
      i > 0 ? random(0, 9) : random(1, 9)
    );
    return parseInt(nums.join(""));
  }

  return random(min, max);
}

/**
 * 随机生成字符串
 * @param length 字符串的长度
 * @param chats 可选字符串区间（只会生成传入的字符串中的字符）
 * @return string 生成的字符串
 */
export function randomString(length?: number, chats?: string): string {
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
export interface PackageOptionsItem {
  label: string;
  value: string;
  id: string | number;
}

export function packageOptions<T extends Record<string, any>>(
  source: T[] = [],
  labelName: keyof T,
  valueName: keyof T
): PackageOptionsItem[] {
  // const labels = labelName.split(',');
  return source.map((item) => {
    return {
      label: item[labelName],
      value: item[valueName] + "",
      id: item[valueName],
    };
  });
}


// ============================================================================
// Make Map
// ============================================================================
export interface MapRecord {
  [key: string]: boolean;
}

export interface MapLookup {
  (val: string): boolean | undefined;
}

export function makeMap(str: string, expectsLowerCase?: boolean): MapLookup {
  const map: MapRecord = Object.create(null);
  const list: string[] = str.split(',');
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? (val: string) => map[val.toLowerCase()]
    : (val: string) => map[val];
}
