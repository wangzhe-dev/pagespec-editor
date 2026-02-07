import { createNodeId, remapNodeIds } from '../model/id';
import { migrateWorkspace, needsMigration } from '../model/migrations';
import type { LayoutNode, Workspace } from '../model/types';

function remapWorkspaceIds(workspace: Workspace): Workspace {
  const next = JSON.parse(JSON.stringify(workspace)) as Workspace;
  next.id = createNodeId();
  next.pages = next.pages.map(page => ({
    ...page,
    id: createNodeId(),
    root: remapNodeIds(page.root as unknown as LayoutNode) as any,
    recipes: [],
  }));
  return next;
}

export function exportJSON(workspace: Workspace): string {
  return JSON.stringify(workspace, null, 2);
}

export function importJSON(raw: string, remapIds: boolean = true): Workspace {
  const parsed = JSON.parse(raw);
  const migrated = needsMigration(parsed) ? migrateWorkspace(parsed) : (parsed as Workspace);
  return remapIds ? remapWorkspaceIds(migrated) : migrated;
}
