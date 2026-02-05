/**
 * useDragDrop - 统一的拖拽工具函数
 * 解决多层嵌套容器的拖拽冲突问题
 */

import { canAddChild, createBlockNode } from '@/domain/registry';
import type { BlockType, LayoutNode } from '@/domain/schema';

// ============================================================================
// 常量定义
// ============================================================================

// 统一的拖拽组名 - 所有 block 共用一个 group
export const DRAG_GROUP_BLOCKS = 'blocks';
export const DRAG_GROUP_FIELDS = 'fields';

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 从拖拽事件中解析被拖拽元素的类型
 */
export function resolveDraggedType(element: any): BlockType | null {
  if (!element || typeof element !== 'object') return null;

  // 来自调色板的新组件
  if (element.kind === 'palette-block') {
    return element.blockType as BlockType;
  }

  // 已有的节点
  if (element.type) {
    return element.type as BlockType;
  }

  return null;
}

/**
 * 检查是否是后代节点（防止循环嵌套）
 */
export function isDescendant(root: LayoutNode, targetId: string): boolean {
  if (root.id === targetId) return true;
  if ('children' in root && Array.isArray(root.children)) {
    return root.children.some((child: LayoutNode) => isDescendant(child, targetId));
  }
  return false;
}

/**
 * 判断是否是调色板拖拽（新组件）
 */
export function isPaletteItem(element: any): boolean {
  return element?.kind === 'palette-block';
}

/**
 * 判断是否是同一个列表内的排序
 */
export function isSameListSort(evt: any): boolean {
  const from = evt.from;
  const to = evt.to;
  return from === to;
}

// ============================================================================
// 拖拽验证函数工厂
// ============================================================================

export interface MoveValidatorOptions {
  /** 容器节点 */
  containerNode: LayoutNode;
  /** 容器类型 */
  containerType: BlockType;
  /** 允许的子节点类型（不指定则使用 registry 规则） */
  allowedChildTypes?: BlockType[];
  /** 禁止的子节点类型 */
  disallowedChildTypes?: BlockType[];
  /** 最大子节点数量 */
  maxChildren?: number;
  /** 当前子节点列表 */
  childrenList?: LayoutNode[];
}

/**
 * 创建拖拽验证函数
 */
export function createMoveValidator(options: MoveValidatorOptions) {
  const {
    containerNode,
    containerType,
    allowedChildTypes,
    disallowedChildTypes = [],
    maxChildren,
    childrenList,
  } = options;

  return function moveValidator(evt: any): boolean {
    const dragged = evt.draggedContext?.element;
    const targetList = evt.relatedContext?.list as LayoutNode[] | undefined;
    const sourceList = evt.draggedContext?.list as LayoutNode[] | undefined;

    // 解析被拖拽元素的类型
    const childType = resolveDraggedType(dragged);
    if (!childType) return false;

    // 检查禁止类型
    if (disallowedChildTypes.includes(childType)) {
      return false;
    }

    // 检查允许类型
    if (allowedChildTypes && allowedChildTypes.length > 0) {
      if (!allowedChildTypes.includes(childType)) {
        return false;
      }
    } else {
      // 使用 registry 规则验证
      if (!canAddChild(containerType, childType)) {
        return false;
      }
    }

    // 防止循环嵌套：不能将节点拖入自己的后代
    if (dragged?.id && isDescendant(dragged as LayoutNode, containerNode.id)) {
      return false;
    }

    // 检查最大子节点数量限制
    if (maxChildren !== undefined && targetList && sourceList !== targetList) {
      const currentCount = childrenList?.length ?? targetList.length;
      if (currentCount >= maxChildren) {
        return false;
      }
    }

    return true;
  };
}

// ============================================================================
// 拖拽组配置工厂
// ============================================================================

export interface DragGroupOptions {
  /** group 名称 */
  name?: string;
  /** 是否可以拖出 */
  pull?: boolean | 'clone';
  /** 是否可以放入 */
  put?: boolean | string[];
}

/**
 * 创建标准的 block 拖拽组配置
 */
export function createBlockDragGroup(options: DragGroupOptions = {}): object {
  return {
    name: options.name ?? DRAG_GROUP_BLOCKS,
    pull: options.pull ?? true,
    put: options.put ?? true,
  };
}

/**
 * 创建只读调色板的拖拽组配置（只能拖出，不能放入）
 */
export function createPaletteDragGroup(): object {
  return {
    name: DRAG_GROUP_BLOCKS,
    pull: 'clone',
    put: false,
  };
}

/**
 * 创建字段拖拽组配置
 */
export function createFieldDragGroup(options: DragGroupOptions = {}): object {
  return {
    name: options.name ?? DRAG_GROUP_FIELDS,
    pull: options.pull ?? true,
    put: options.put ?? true,
  };
}

// ============================================================================
// 拖拽事件处理工厂
// ============================================================================

export interface DragEventHandlers {
  onAdd?: (evt: any) => void;
  onEnd?: (evt: any) => void;
  onUpdate?: (evt: any) => void;
  onChange?: (evt: any) => void;
}

/**
 * 创建选中新添加节点的处理函数
 */
export function createAddHandler(
  selectNode: (id: string | null) => void,
  getList: () => LayoutNode[]
): (evt: any) => void {
  return (evt: any) => {
    const list = getList();
    const added = list[evt.newIndex];
    if (added?.id) {
      selectNode(added.id);
    }
  };
}

// ============================================================================
// 调色板克隆函数
// ============================================================================

/**
 * 克隆调色板中的 block 为新节点
 */
export function clonePaletteBlock(item: { type: string }): LayoutNode {
  return createBlockNode(item.type as BlockType);
}
