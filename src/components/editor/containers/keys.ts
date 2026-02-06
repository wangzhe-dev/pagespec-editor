import type { InjectionKey } from 'vue';

// 标识当前组件在 GridCell 内部（用于子 Grid 判断是否为嵌套模式）
export const IN_GRID_CELL_KEY: InjectionKey<boolean> = Symbol('inGridCell');
