import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  createContainer,
  createDemoSpec,
  createEmptySpec,
  createGridContainer,
  createLeaf,
  deleteNodeCascade,
  downgradeGridToSingle,
  duplicateSpec,
  findHostByGridId,
  getGridContainer,
  getNode,
  getSlotHost,
  attachToSlot,
  replaceGridItemChild,
  replaceSingleChild,
  setSlotSingle,
  upgradeSlotToGrid,
  addGridItem,
  removeGridItem,
  updateGridGeom,
  cleanupOrphans,
  clearSlot,
} from '@/core/ops';
import { exportJSON, importJSON } from '@/core/persistence/importExport';
import { deleteSpec, listSpecs, loadSpec, markTemplate, saveSpec } from '@/core/persistence/storage';
import type {
  ContainerType,
  LeafMeta,
  LeafType,
  Node,
  NodeId,
  PaletteContainerType,
  PaletteLeafType,
  PromptMode,
  Spec,
  SpecSummary,
} from '@/core/model/types';
import { isContainer, isLeaf, isSlotHost } from '@/core/model/guards';

export type AddMode = 'replace' | 'append';

export interface BlockPick {
  kind: 'leaf' | 'container';
  type: PaletteLeafType | PaletteContainerType;
  componentRef?: string;
}

export interface SpecEditorSettings {
  includeGeometry: boolean;
  autoDowngrade: boolean;
  promptMode: PromptMode;
}

interface ParentRef {
  kind: 'slot-single' | 'grid-item';
  hostId?: string;
  gridId?: string;
  itemId?: string;
}

function isLeafType(type: string): type is LeafType {
  return ['table', 'chart', 'list', 'tree', 'kpi', 'form', 'custom'].includes(type);
}

function isContainerType(type: string): type is ContainerType {
  return ['page', 'gridItem', 'section', 'card', 'tabs', 'split', 'grid', 'dialog', 'drawer'].includes(type);
}

function ensureContainerGridInSpec(spec: Spec, containerId: string): void {
  const node = spec.nodes[containerId];
  if (!node || !isContainer(node) || node.type === 'grid') return;
  if (!isSlotHost(node)) return;

  if (node.slot?.kind === 'grid') return;

  if (node.slot?.kind === 'single') {
    const prevChildId = node.slot.childId;
    const innerGridId = createGridContainer(spec);
    addGridItem(spec, innerGridId, prevChildId, { x: 0, y: 0, w: 12, h: 6 });
    attachToSlot(spec, containerId, { kind: 'grid', gridId: innerGridId });
    return;
  }

  const innerGridId = createGridContainer(spec);
  attachToSlot(spec, containerId, { kind: 'grid', gridId: innerGridId });
}

function normalizeSlotsToGrid(spec: Spec): boolean {
  let changed = false;

  for (const node of Object.values(spec.nodes)) {
    if (!isContainer(node) || node.type === 'grid') continue;
    if (!isSlotHost(node)) continue;
    if (node.slot?.kind === 'grid') continue;

    ensureContainerGridInSpec(spec, node.id);
    changed = true;
  }

  return changed;
}

function sortedGridChildIds(node: Node): string[] {
  if (!isContainer(node) || node.type !== 'grid') return [];

  return (node.items || [])
    .slice()
    .sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      if (a.x !== b.x) return a.x - b.x;
      return a.itemId.localeCompare(b.itemId);
    })
    .map(item => item.childId);
}

function childrenOf(spec: Spec, nodeId: string): string[] {
  const node = spec.nodes[nodeId];
  if (!node || !isContainer(node)) return [];

  const children: string[] = [];

  if (isSlotHost(node) && node.slot) {
    if (node.slot.kind === 'single') {
      children.push(node.slot.childId);
    } else if (node.slot.kind === 'grid') {
      children.push(node.slot.gridId);
    }
  }

  children.push(...sortedGridChildIds(node));
  return children;
}

function findPath(spec: Spec, targetId: string): string[] {
  const path: string[] = [];
  const visited = new Set<string>();

  const dfs = (currentId: string): boolean => {
    if (visited.has(currentId)) return false;
    visited.add(currentId);

    path.push(currentId);
    if (currentId === targetId) return true;

    for (const childId of childrenOf(spec, currentId)) {
      if (dfs(childId)) return true;
    }

    path.pop();
    return false;
  };

  if (!dfs(spec.rootId)) {
    return [];
  }

  return path;
}

function findParentRef(spec: Spec, childId: string): ParentRef | null {
  for (const node of Object.values(spec.nodes)) {
    if (!isContainer(node)) continue;

    if (isSlotHost(node) && node.slot?.kind === 'single' && node.slot.childId === childId) {
      return { kind: 'slot-single', hostId: node.id };
    }

    if (node.type === 'grid') {
      const item = (node.items || []).find(entry => entry.childId === childId);
      if (item) {
        return {
          kind: 'grid-item',
          gridId: node.id,
          itemId: item.itemId,
        };
      }
    }
  }

  return null;
}

export const useSpecStore = defineStore('spec', () => {
  const currentSpec = ref<Spec | null>(null);
  const selectedId = ref<NodeId | null>(null);
  const clipboard = ref<Node | null>(null);
  const recentPicks = ref<string[]>([]);
  const specs = ref<SpecSummary[]>([]);
  const settings = ref<SpecEditorSettings>({
    includeGeometry: false,
    autoDowngrade: true,
    promptMode: 'long',
  });

  const hasSpecs = computed(() => specs.value.length > 0);

  const selectedNode = computed(() => {
    if (!currentSpec.value || !selectedId.value) return null;
    return currentSpec.value.nodes[selectedId.value] || null;
  });

  const selectedPath = computed(() => {
    if (!currentSpec.value || !selectedId.value) return [];
    return findPath(currentSpec.value, selectedId.value);
  });

  const selectedSlotHostId = computed(() => {
    if (!currentSpec.value || !selectedId.value) return null;

    const selected = currentSpec.value.nodes[selectedId.value];
    if (selected && isContainer(selected) && isSlotHost(selected)) {
      return selected.id;
    }

    const path = selectedPath.value;
    for (let i = path.length - 2; i >= 0; i -= 1) {
      const node = currentSpec.value.nodes[path[i]];
      if (node && isContainer(node) && isSlotHost(node)) {
        return node.id;
      }
    }

    return null;
  });

  function persistCurrent(): void {
    if (!currentSpec.value) return;
    saveSpec(currentSpec.value);
    specs.value = listSpecs();
  }

  function initialize(): void {
    specs.value = listSpecs();
    if (specs.value.length > 0) {
      const latest = loadSpec(specs.value[0].id);
      if (latest) {
        if (normalizeSlotsToGrid(latest)) {
          saveSpec(latest);
          specs.value = listSpecs();
        }
        currentSpec.value = latest;
        selectedId.value = latest.rootId;
      }
    }
  }

  function createNewSpec(name: string = '新页面'): void {
    const spec = createEmptySpec(name);
    currentSpec.value = spec;
    selectedId.value = spec.rootId;
    persistCurrent();
  }

  function createDemo(name: string = '示例页面'): void {
    const spec = createDemoSpec(name);
    currentSpec.value = spec;
    selectedId.value = spec.rootId;
    persistCurrent();
  }

  function select(nodeId: string | null): void {
    selectedId.value = nodeId;
  }

  function addRecentPick(type: string): void {
    recentPicks.value = [type, ...recentPicks.value.filter(item => item !== type)].slice(0, 12);
  }

  function createNodeByPick(spec: Spec, pick: BlockPick): string {
    addRecentPick(pick.type);

    if (pick.kind === 'leaf') {
      const type = pick.type as LeafType;
      return createLeaf(spec, type, pick.componentRef ? { componentRef: pick.componentRef } : undefined);
    }

    const type = pick.type as ContainerType;
    const id = createContainer(spec, type);
    ensureContainerGridInSpec(spec, id);
    return id;
  }

  function addToSlot(hostId: string, pick: BlockPick, mode: AddMode = 'append'): string | null {
    if (!currentSpec.value) return null;
    const spec = currentSpec.value;

    const host = getSlotHost(spec, hostId);
    const forceGridHost = host.type === 'card' || host.type === 'gridItem';
    if (forceGridHost) {
      ensureContainerGridInSpec(spec, hostId);
    }
    const newChildId = createNodeByPick(spec, pick);

    if (!host.slot || host.slot.kind === 'empty') {
      setSlotSingle(spec, hostId, newChildId);
      selectedId.value = newChildId;
      persistCurrent();
      return newChildId;
    }

    if (host.slot.kind === 'single') {
      if (mode === 'replace') {
        const oldId = host.slot.childId;
        replaceSingleChild(spec, hostId, newChildId);
        deleteNodeCascade(spec, oldId);
      } else {
        upgradeSlotToGrid(spec, hostId, newChildId);
      }
      selectedId.value = newChildId;
      persistCurrent();
      return newChildId;
    }

    if (host.slot.kind === 'grid') {
      const grid = getGridContainer(spec, host.slot.gridId);
      if (mode === 'replace' && (grid.items || []).length > 0) {
        const first = grid.items![0];
        replaceGridItemChild(spec, grid.id, first.itemId, newChildId);
        deleteNodeCascade(spec, first.childId);
      } else {
        addGridItem(spec, grid.id, newChildId);
      }
      selectedId.value = newChildId;
      persistCurrent();
      return newChildId;
    }

    return null;
  }

  function replaceSelected(newType: string, componentRef?: string): string | null {
    if (!currentSpec.value || !selectedId.value) return null;
    const spec = currentSpec.value;

    const oldId = selectedId.value;
    const parentRef = findParentRef(spec, oldId);
    if (!parentRef) return null;

    let nextId: string;
    if (isLeafType(newType)) {
      nextId = createLeaf(spec, newType, componentRef ? { componentRef } : undefined);
    } else if (isContainerType(newType) && newType !== 'grid') {
      nextId = createContainer(spec, newType);
      ensureContainerGridInSpec(spec, nextId);
    } else {
      throw new Error(`unsupported replace type: ${newType}`);
    }

    if (parentRef.kind === 'slot-single' && parentRef.hostId) {
      replaceSingleChild(spec, parentRef.hostId, nextId);
    }

    if (parentRef.kind === 'grid-item' && parentRef.gridId && parentRef.itemId) {
      replaceGridItemChild(spec, parentRef.gridId, parentRef.itemId, nextId);
    }

    deleteNodeCascade(spec, oldId);
    selectedId.value = nextId;
    persistCurrent();
    return nextId;
  }

  function removeSelected(): boolean {
    if (!currentSpec.value || !selectedId.value) return false;
    if (selectedId.value === currentSpec.value.rootId) return false;

    const removed = deleteNodeCascade(currentSpec.value, selectedId.value);
    selectedId.value = currentSpec.value.rootId;
    if (removed) {
      persistCurrent();
    }
    return removed;
  }

  function updateLeafMeta(nodeId: string, patch: Partial<LeafMeta>): void {
    if (!currentSpec.value) return;
    const node = getNode(currentSpec.value, nodeId);
    if (!isLeaf(node)) return;

    node.leafMeta = {
      ...node.leafMeta,
      ...(patch as any),
      fields: {
        ...(node.leafMeta.fields || {}),
        ...((patch as any).fields || {}),
      },
      recipes: Array.isArray((patch as any).recipes)
        ? [...((patch as any).recipes || [])]
        : node.leafMeta.recipes,
    };

    currentSpec.value.meta.updatedAt = Date.now();
    persistCurrent();
  }

  function updateLeafFields(nodeId: string, key: string, csv: string): void {
    if (!currentSpec.value) return;
    const node = getNode(currentSpec.value, nodeId);
    if (!isLeaf(node)) return;

    const values = csv
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);

    node.leafMeta.fields = {
      ...(node.leafMeta.fields || {}),
      [key]: values,
    };

    currentSpec.value.meta.updatedAt = Date.now();
    persistCurrent();
  }

  function updateContainerProps(nodeId: string, patch: Record<string, unknown>): void {
    if (!currentSpec.value) return;
    const node = getNode(currentSpec.value, nodeId);
    if (!isContainer(node)) return;

    node.props = {
      ...node.props,
      ...patch,
    };

    currentSpec.value.meta.updatedAt = Date.now();
    persistCurrent();
  }

  function clearHostSlot(hostId: string): void {
    if (!currentSpec.value) return;
    clearSlot(currentSpec.value, hostId);
    cleanupOrphans(currentSpec.value);
    persistCurrent();
  }

  function removeGridItemById(gridId: string, itemId: string): boolean {
    if (!currentSpec.value) return false;
    const spec = currentSpec.value;
    const removed = removeGridItem(spec, gridId, itemId);

    if (!removed) return false;

    if (settings.value.autoDowngrade) {
      const host = findHostByGridId(spec, gridId);
      if (host && host.type !== 'card' && host.type !== 'gridItem') {
        downgradeGridToSingle(spec, host.id);
      }
    }

    cleanupOrphans(spec);
    persistCurrent();
    return true;
  }

  function updateGridItemGeometry(
    gridId: string,
    itemId: string,
    patch: Partial<{ x: number; y: number; w: number; h: number }>,
  ): boolean {
    if (!currentSpec.value) return false;
    const changed = updateGridGeom(currentSpec.value, gridId, itemId, patch);
    if (changed) {
      persistCurrent();
    }
    return changed;
  }

  function duplicateCurrent(): void {
    if (!currentSpec.value) return;
    currentSpec.value = duplicateSpec(currentSpec.value);
    selectedId.value = currentSpec.value.rootId;
    persistCurrent();
  }

  function copySelected(): void {
    if (!currentSpec.value || !selectedId.value) return;
    clipboard.value = JSON.parse(JSON.stringify(currentSpec.value.nodes[selectedId.value] || null)) as Node | null;
  }

  function saveDraft(): void {
    persistCurrent();
  }

  function loadDraft(id: string): void {
    const spec = loadSpec(id);
    if (!spec) return;
    const changed = normalizeSlotsToGrid(spec);
    currentSpec.value = spec;
    selectedId.value = spec.rootId;
    if (changed) {
      saveSpec(spec);
    }
    specs.value = listSpecs();
  }

  function deleteDraft(id: string): void {
    deleteSpec(id);
    specs.value = listSpecs();
    if (currentSpec.value?.meta.id === id) {
      currentSpec.value = null;
      selectedId.value = null;
      if (specs.value.length > 0) {
        loadDraft(specs.value[0].id);
      }
    }
  }

  function setTemplate(id: string, value: boolean): void {
    markTemplate(id, value);
    specs.value = listSpecs();
  }

  function exportCurrent(): string {
    if (!currentSpec.value) {
      throw new Error('no current spec');
    }
    return exportJSON(currentSpec.value);
  }

  function importFromJSON(raw: string): void {
    const spec = importJSON(raw);
    normalizeSlotsToGrid(spec);
    currentSpec.value = spec;
    selectedId.value = spec.rootId;
    persistCurrent();
  }

  function setPromptMode(mode: PromptMode): void {
    settings.value.promptMode = mode;
  }

  function setIncludeGeometry(value: boolean): void {
    settings.value.includeGeometry = value;
  }

  function setAutoDowngrade(value: boolean): void {
    settings.value.autoDowngrade = value;
  }

  /** Ensure a slot-host container has an internal grid in its slot. */
  function ensureContainerGrid(containerId: string): void {
    if (!currentSpec.value) return;
    const spec = currentSpec.value;
    ensureContainerGridInSpec(spec, containerId);
    persistCurrent();
  }

  function applyLayoutPreset(
    hostId: string,
    items: Array<{ x: number; y: number; w: number; h: number }>,
  ): void {
    if (!currentSpec.value) return;
    const spec = currentSpec.value;

    // Clear existing slot content
    clearSlot(spec, hostId);
    cleanupOrphans(spec);

    // Create grid container and populate with preset items
    const gridId = createGridContainer(spec);
    for (const item of items) {
      const gridItemId = createContainer(spec, 'gridItem');
      // Each container child gets its own internal grid
      const innerGridId = createGridContainer(spec);
      attachToSlot(spec, gridItemId, { kind: 'grid', gridId: innerGridId });
      addGridItem(spec, gridId, gridItemId, item);
    }

    // Attach grid to host slot
    attachToSlot(spec, hostId, { kind: 'grid', gridId });

    selectedId.value = hostId;
    persistCurrent();
  }

  return {
    currentSpec,
    selectedId,
    selectedNode,
    selectedPath,
    selectedSlotHostId,
    clipboard,
    recentPicks,
    specs,
    hasSpecs,
    settings,
    initialize,
    createNewSpec,
    createDemo,
    select,
    addToSlot,
    replaceSelected,
    removeSelected,
    updateLeafMeta,
    updateLeafFields,
    updateContainerProps,
    clearHostSlot,
    removeGridItemById,
    updateGridItemGeometry,
    duplicateCurrent,
    copySelected,
    saveDraft,
    loadDraft,
    deleteDraft,
    setTemplate,
    exportCurrent,
    importFromJSON,
    setPromptMode,
    setIncludeGeometry,
    setAutoDowngrade,
    ensureContainerGrid,
    applyLayoutPreset,
  };
});
