import { nanoid } from 'nanoid';

export function createNodeId(): string {
  return `n_${nanoid(8)}`;
}

export function createGridItemId(): string {
  return `gi_${nanoid(8)}`;
}

export function createSpecId(): string {
  return `spec_${nanoid(8)}`;
}

export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
