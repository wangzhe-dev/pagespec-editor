/**
 * Pages Store
 * 页面数据管理
 */

import { createBlockNode } from '@/domain/registry';
import type { LayoutNode, PageSpec, Recipe } from '@/domain/schema';
import { nanoid } from 'nanoid';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const usePagesStore = defineStore('pages', () => {
  // ============================================================================
  // State
  // ============================================================================

  const pages = ref<PageSpec[]>([]);
  const activePageId = ref<string | null>(null);

  // ============================================================================
  // Getters
  // ============================================================================

  const activePage = computed(() => {
    if (!activePageId.value) return null;
    return pages.value.find(p => p.id === activePageId.value) || null;
  });

  const pageCount = computed(() => pages.value.length);

  // ============================================================================
  // Actions - Page CRUD
  // ============================================================================

  function createPage(name: string = '新页面'): PageSpec {
    const now = Date.now();
    const page: PageSpec = {
      id: nanoid(8),
      name,
      root: {
        id: nanoid(8),
        type: 'PageRoot',
        title: name,
        children: [],
      },
      recipes: [],
      dialogs: [],
      drawers: [],
      createdAt: now,
      updatedAt: now,
    };

    pages.value.push(page);
    activePageId.value = page.id;
    return page;
  }

  function deletePage(pageId: string): void {
    const index = pages.value.findIndex(p => p.id === pageId);
    if (index !== -1) {
      pages.value.splice(index, 1);
      if (activePageId.value === pageId) {
        activePageId.value = pages.value[0]?.id || null;
      }
    }
  }

  function setActivePage(pageId: string): void {
    activePageId.value = pageId;
  }

  function updatePage(pageId: string, updates: Partial<PageSpec>): void {
    const page = pages.value.find(p => p.id === pageId);
    if (page) {
      Object.assign(page, updates, { updatedAt: Date.now() });
    }
  }

  function duplicatePage(pageId: string): PageSpec | null {
    const source = pages.value.find(p => p.id === pageId);
    if (!source) return null;

    const now = Date.now();
    const newPage: PageSpec = {
      ...JSON.parse(JSON.stringify(source)),
      id: nanoid(8),
      name: `${source.name} (副本)`,
      createdAt: now,
      updatedAt: now,
    };

    // 重新生成所有节点 ID
    regenerateIds(newPage.root as unknown as LayoutNode);
    newPage.recipes = [];
    newPage.dialogs = [];
    newPage.drawers = [];

    pages.value.push(newPage);
    return newPage;
  }

  // ============================================================================
  // Actions - Node Operations
  // ============================================================================

  function findNode(root: LayoutNode, nodeId: string): LayoutNode | null {
    if (root.id === nodeId) return root;

    if ('children' in root && Array.isArray(root.children)) {
      for (const child of root.children) {
        const found = findNode(child, nodeId);
        if (found) return found;
      }
    }
    return null;
  }

  function findParent(root: LayoutNode, nodeId: string): { parent: LayoutNode; index: number } | null {
    if ('children' in root && Array.isArray(root.children)) {
      for (let i = 0; i < root.children.length; i++) {
        if (root.children[i].id === nodeId) {
          return { parent: root, index: i };
        }
        const found = findParent(root.children[i], nodeId);
        if (found) return found;
      }
    }
    return null;
  }

  function addNode(
    pageId: string,
    parentId: string,
    nodeType: LayoutNode['type'],
    index?: number,
  ): LayoutNode | null {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return null;

    const parent = findNode(page.root as unknown as LayoutNode, parentId);
    if (!parent || !('children' in parent)) return null;

    const newNode = createBlockNode(nodeType);

    if (index !== undefined && index >= 0) {
      parent.children.splice(index, 0, newNode);
    } else {
      parent.children.push(newNode);
    }

    page.updatedAt = Date.now();
    return newNode;
  }

  function updateNode(pageId: string, nodeId: string, updates: Partial<LayoutNode>): void {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return;

    const node = findNode(page.root as unknown as LayoutNode, nodeId);
    if (node) {
      Object.assign(node, updates);
      page.updatedAt = Date.now();
    }
  }

  function deleteNode(pageId: string, nodeId: string): void {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return;

    const result = findParent(page.root as unknown as LayoutNode, nodeId);
    if (result) {
      result.parent.children.splice(result.index, 1);
      page.updatedAt = Date.now();
    }
  }

  // 别名，方便使用
  const removeNode = deleteNode;

  function insertAfterNode(pageId: string, targetNodeId: string, newNode: LayoutNode): void {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return;

    const result = findParent(page.root as unknown as LayoutNode, targetNodeId);
    if (result) {
      result.parent.children.splice(result.index + 1, 0, newNode);
      page.updatedAt = Date.now();
    }
  }

  function moveNode(
    pageId: string,
    nodeId: string,
    newParentId: string,
    newIndex: number,
  ): void {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return;

    // 找到并移除节点
    const result = findParent(page.root as unknown as LayoutNode, nodeId);
    if (!result) return;

    const [node] = result.parent.children.splice(result.index, 1);

    // 添加到新位置
    const newParent = findNode(page.root as unknown as LayoutNode, newParentId);
    if (!newParent || !('children' in newParent)) {
      // 恢复原位置
      result.parent.children.splice(result.index, 0, node);
      return;
    }

    newParent.children.splice(newIndex, 0, node);
    page.updatedAt = Date.now();
  }

  // ============================================================================
  // Actions - Recipe Operations
  // ============================================================================

  function addRecipe(pageId: string, recipe: Recipe): void {
    const page = pages.value.find(p => p.id === pageId);
    if (page) {
      page.recipes.push(recipe);
      page.updatedAt = Date.now();
    }
  }

  function updateRecipe(pageId: string, recipeId: string, updates: Partial<Recipe>): void {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return;

    const recipe = page.recipes.find(r => r.id === recipeId);
    if (recipe) {
      Object.assign(recipe, updates);
      page.updatedAt = Date.now();
    }
  }

  function deleteRecipe(pageId: string, recipeId: string): void {
    const page = pages.value.find(p => p.id === pageId);
    if (!page) return;

    const index = page.recipes.findIndex(r => r.id === recipeId);
    if (index !== -1) {
      page.recipes.splice(index, 1);
      page.updatedAt = Date.now();
    }
  }

  // ============================================================================
  // Actions - Import/Export
  // ============================================================================

  function importPages(data: PageSpec[]): void {
    for (const page of data) {
      const existing = pages.value.find(p => p.id === page.id);
      if (existing) {
        Object.assign(existing, page);
      } else {
        pages.value.push(page);
      }
    }
  }

  function exportPages(): PageSpec[] {
    return JSON.parse(JSON.stringify(pages.value));
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  function regenerateIds(node: LayoutNode): void {
    node.id = nanoid(8);
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        regenerateIds(child);
      }
    }
  }

  function loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('pagespec-pages-v2');
      if (stored) {
        const data = JSON.parse(stored);
        pages.value = data.pages || [];
        activePageId.value = data.activePageId || null;
      }
      // 清理旧版本数据
      localStorage.removeItem('pagespec-pages');
    } catch (e) {
      console.error('Failed to load pages from storage:', e);
    }
  }

  function saveToStorage(): void {
    try {
      localStorage.setItem('pagespec-pages-v2', JSON.stringify({
        pages: pages.value,
        activePageId: activePageId.value,
      }));
    } catch (e) {
      console.error('Failed to save pages to storage:', e);
    }
  }

  return {
    // State
    pages,
    activePageId,
    // Getters
    activePage,
    pageCount,
    // Actions
    createPage,
    deletePage,
    setActivePage,
    updatePage,
    duplicatePage,
    findNode,
    addNode,
    updateNode,
    deleteNode,
    removeNode,
    insertAfterNode,
    moveNode,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    importPages,
    exportPages,
    loadFromStorage,
    saveToStorage,
  };
});
