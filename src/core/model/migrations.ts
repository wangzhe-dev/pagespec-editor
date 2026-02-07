import type { Spec } from './types';

export function needsMigration(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return true;
  const maybe = raw as { version?: number };
  return maybe.version !== 1;
}

export function migrateSpec(raw: unknown): Spec {
  if (!raw || typeof raw !== 'object') {
    throw new Error('invalid spec payload');
  }

  const maybe = raw as Partial<Spec>;
  if (maybe.version === 1 && maybe.rootId && maybe.nodes && maybe.meta) {
    return maybe as Spec;
  }

  throw new Error('unsupported spec version');
}
