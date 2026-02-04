/**
 * UI State Store
 * 界面状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PromptStyle } from '@/domain/compiler';

export type PanelType = 'pages' | 'tree' | 'properties' | 'preview' | 'profile';

export const useUIStore = defineStore('ui', () => {
  // ============================================================================
  // State
  // ============================================================================

  // 选中的节点
  const selectedNodeId = ref<string | null>(null);

  // 面板可见性
  const panelVisibility = ref<Record<PanelType, boolean>>({
    pages: true,
    tree: true,
    properties: true,
    preview: true,
    profile: false,
  });

  // 面板尺寸
  const panelSizes = ref({
    leftWidth: 280,
    rightWidth: 320,
    bottomHeight: 240,
  });

  // Prompt 编译配置
  const promptStyle = ref<PromptStyle>({
    length: 'medium',
    language: 'zh',
    strictness: 'strict',
    includeDeliverables: true,
    includeManifest: false,
    skeletonMode: false,
    diffMode: false,
  });

  // 属性面板模式
  const propertyMode = ref<'basic' | 'advanced'>('basic');

  // 主题
  const theme = ref<'light' | 'dark'>('dark');

  // 是否展示欢迎页
  const showWelcome = ref(true);

  // Toast 消息
  const toasts = ref<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  }>>([]);

  // ============================================================================
  // Getters
  // ============================================================================

  const isPanelVisible = computed(() => (panel: PanelType) => panelVisibility.value[panel]);

  // ============================================================================
  // Actions
  // ============================================================================

  function selectNode(nodeId: string | null): void {
    selectedNodeId.value = nodeId;
  }

  function togglePanel(panel: PanelType): void {
    panelVisibility.value[panel] = !panelVisibility.value[panel];
  }

  function setPanelVisibility(panel: PanelType, visible: boolean): void {
    panelVisibility.value[panel] = visible;
  }

  function setPanelSize(panel: 'left' | 'right' | 'bottom', size: number): void {
    if (panel === 'left') panelSizes.value.leftWidth = size;
    if (panel === 'right') panelSizes.value.rightWidth = size;
    if (panel === 'bottom') panelSizes.value.bottomHeight = size;
  }

  function setPromptStyle(style: Partial<PromptStyle>): void {
    Object.assign(promptStyle.value, style);
  }

  function setPropertyMode(mode: 'basic' | 'advanced'): void {
    propertyMode.value = mode;
  }

  function setTheme(newTheme: 'light' | 'dark'): void {
    theme.value = newTheme;
    const root = document.documentElement;
    root.classList.toggle('light', newTheme === 'light');
    root.classList.toggle('dark', newTheme === 'dark');
  }

  function hideWelcome(): void {
    showWelcome.value = false;
    localStorage.setItem('pagespec-welcome-shown', 'true');
  }

  function showToast(
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    duration: number = 3000,
  ): void {
    const id = Math.random().toString(36).substr(2, 9);
    toasts.value.push({ id, type, message, duration });
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(id: string): void {
    const index = toasts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  }

  // ============================================================================
  // Storage
  // ============================================================================

  function loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('pagespec-ui');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.panelSizes) panelSizes.value = data.panelSizes;
        if (data.panelVisibility) panelVisibility.value = data.panelVisibility;
        if (data.promptStyle) promptStyle.value = data.promptStyle;
        if (data.theme) setTheme(data.theme);
      }

      // 检查是否需要显示欢迎页
      if (localStorage.getItem('pagespec-welcome-shown') === 'true') {
        showWelcome.value = false;
      }
    } catch (e) {
      console.error('Failed to load UI state from storage:', e);
    }
  }

  function saveToStorage(): void {
    try {
      localStorage.setItem('pagespec-ui', JSON.stringify({
        panelSizes: panelSizes.value,
        panelVisibility: panelVisibility.value,
        promptStyle: promptStyle.value,
        theme: theme.value,
      }));
    } catch (e) {
      console.error('Failed to save UI state to storage:', e);
    }
  }

  return {
    // State
    selectedNodeId,
    panelVisibility,
    panelSizes,
    promptStyle,
    propertyMode,
    theme,
    showWelcome,
    toasts,
    // Getters
    isPanelVisible,
    // Actions
    selectNode,
    togglePanel,
    setPanelVisibility,
    setPanelSize,
    setPromptStyle,
    setPropertyMode,
    setTheme,
    hideWelcome,
    showToast,
    removeToast,
    loadFromStorage,
    saveToStorage,
  };
});
