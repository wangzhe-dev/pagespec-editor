/**
 * Schema Migrations
 * 数据结构版本迁移系统
 */

import type { Workspace } from './types';
import { SCHEMA_VERSION } from './types';

// 迁移函数类型
type MigrationFn = (data: any) => any;

// 迁移注册表
const migrations: Record<number, MigrationFn> = {
  // 从版本 0 迁移到版本 1
  1: (data: any) => {
    // 初始版本，添加默认字段
    return {
      ...data,
      schemaVersion: 1,
      pages: (data.pages || []).map((page: any) => ({
        ...page,
        recipes: page.recipes || [],
        dialogs: page.dialogs || [],
        drawers: page.drawers || [],
      })),
      profiles: (data.profiles || []).map((profile: any) => ({
        ...profile,
        customConstraints: profile.customConstraints || [],
      })),
    };
  },
  
  // 未来版本迁移示例
  // 2: (data: any) => {
  //   return {
  //     ...data,
  //     schemaVersion: 2,
  //     // 添加新字段或转换结构
  //   };
  // },
};

/**
 * 执行数据迁移
 */
export function migrateWorkspace(data: any): Workspace {
  let currentVersion = data.schemaVersion || 0;
  let migratedData = { ...data };

  // 逐版本迁移
  while (currentVersion < SCHEMA_VERSION) {
    const nextVersion = currentVersion + 1;
    const migrationFn = migrations[nextVersion];
    
    if (migrationFn) {
      console.log(`[Migration] Upgrading from v${currentVersion} to v${nextVersion}`);
      migratedData = migrationFn(migratedData);
    } else {
      console.warn(`[Migration] No migration found for v${nextVersion}`);
      migratedData.schemaVersion = nextVersion;
    }
    
    currentVersion = nextVersion;
  }

  return migratedData as Workspace;
}

/**
 * 检查是否需要迁移
 */
export function needsMigration(data: any): boolean {
  const version = data.schemaVersion || 0;
  return version < SCHEMA_VERSION;
}

/**
 * 获取当前 Schema 版本
 */
export function getCurrentVersion(): number {
  return SCHEMA_VERSION;
}
