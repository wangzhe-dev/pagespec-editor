import type { Spec, SpecSummary } from '../model/types';

const STORAGE_KEY = 'pagespec-spec-db-v1';

interface SpecDatabase {
  version: 1;
  specs: Record<string, Spec>;
}

const fallbackDb: SpecDatabase = {
  version: 1,
  specs: {},
};

function readDb(): SpecDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...fallbackDb };
    }
    const parsed = JSON.parse(raw) as Partial<SpecDatabase>;
    if (parsed.version !== 1 || !parsed.specs) {
      return { ...fallbackDb };
    }
    return {
      version: 1,
      specs: parsed.specs,
    };
  } catch {
    return { ...fallbackDb };
  }
}

function writeDb(db: SpecDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

const debouncedTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function saveSpec(spec: Spec): void {
  const key = spec.meta.id;
  const existed = debouncedTimers.get(key);
  if (existed) {
    clearTimeout(existed);
  }

  const timer = setTimeout(() => {
    const db = readDb();
    db.specs[spec.meta.id] = JSON.parse(JSON.stringify(spec)) as Spec;
    writeDb(db);
    debouncedTimers.delete(key);
  }, 500);

  debouncedTimers.set(key, timer);
}

export function loadSpec(id: string): Spec | null {
  const db = readDb();
  const spec = db.specs[id];
  return spec ? (JSON.parse(JSON.stringify(spec)) as Spec) : null;
}

export function listSpecs(): SpecSummary[] {
  const db = readDb();
  return Object.values(db.specs)
    .map(spec => ({
      id: spec.meta.id,
      name: spec.meta.name,
      tags: spec.meta.tags,
      updatedAt: spec.meta.updatedAt,
      isTemplate: spec.meta.isTemplate,
    }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function deleteSpec(id: string): void {
  const db = readDb();
  delete db.specs[id];
  writeDb(db);
}

export function markTemplate(id: string, value: boolean): void {
  const db = readDb();
  const spec = db.specs[id];
  if (!spec) return;
  spec.meta.isTemplate = value;
  spec.meta.updatedAt = Date.now();
  writeDb(db);
}
