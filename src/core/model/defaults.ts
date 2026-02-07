export const DEFAULT_GRID_CONFIG = {
  columns: 12,
  rowHeight: 32,
  margin: 12,
  gap: 12,
} as const;

export const DEFAULT_SPLIT_CONFIG = {
  direction: 'horizontal',
  ratios: [50, 50],
} as const;

export const DEFAULT_TABS_CONFIG = {
  lazy: false,
  defaultTab: '',
} as const;
