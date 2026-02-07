/**
 * Profiles Store
 * 项目配置管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { nanoid } from 'nanoid';
import type { ProjectProfile } from '@/core/model/types';

// 默认项目配置
const DEFAULT_PROFILE: Omit<ProjectProfile, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '默认配置',
  description: '项目默认组件映射和约束配置',
  componentMapping: {
    Table: 'JrTable',
    Tree: 'JrTree',
    Form: 'JrForm',
    Tabs: 'JrTabs',
    Dialog: 'JrDialog',
    Drawer: 'JrDrawer',
    Card: 'JrCard',
    Chart: 'JrChart',
    Input: 'JrInput',
    Select: 'JrSelect',
    DatePicker: 'JrDatePicker',
    Button: 'JrButton',
  },
  forbiddenRules: {
    forbiddenComponents: [
      'el-table', 'el-form', 'el-dialog', 'el-drawer', 'el-tabs',
      'a-table', 'a-form', 'a-modal', 'a-drawer', 'a-tabs',
    ],
    forbiddenLibraries: ['element-plus', 'ant-design-vue', 'naive-ui'],
    forbiddenPatterns: ['style=".*"', ':style='],
  },
  directoryConvention: {
    pageDir: 'src/views',
    componentDir: 'src/components',
    serviceDir: 'src/services',
    mockDir: 'src/mocks',
    storeDir: 'src/stores',
    typeDir: 'src/types',
  },
  namingConvention: {
    pageFile: 'kebab',
    componentFile: 'pascal',
    serviceFile: 'kebab',
    functionName: 'camel',
    variableName: 'camel',
  },
  customConstraints: [],
};

export const useProfilesStore = defineStore('profiles', () => {
  // ============================================================================
  // State
  // ============================================================================
  
  const profiles = ref<ProjectProfile[]>([]);
  const activeProfileId = ref<string | null>(null);

  // ============================================================================
  // Getters
  // ============================================================================

  const activeProfile = computed(() => {
    if (!activeProfileId.value) return null;
    return profiles.value.find(p => p.id === activeProfileId.value) || null;
  });

  // ============================================================================
  // Actions
  // ============================================================================

  function createProfile(name: string = '新配置'): ProjectProfile {
    const now = Date.now();
    const profile: ProjectProfile = {
      ...JSON.parse(JSON.stringify(DEFAULT_PROFILE)),
      id: nanoid(8),
      name,
      createdAt: now,
      updatedAt: now,
    };
    
    profiles.value.push(profile);
    if (!activeProfileId.value) {
      activeProfileId.value = profile.id;
    }
    return profile;
  }

  function deleteProfile(profileId: string): void {
    const index = profiles.value.findIndex(p => p.id === profileId);
    if (index !== -1) {
      profiles.value.splice(index, 1);
      if (activeProfileId.value === profileId) {
        activeProfileId.value = profiles.value[0]?.id || null;
      }
    }
  }

  function setActiveProfile(profileId: string): void {
    activeProfileId.value = profileId;
  }

  function updateProfile(profileId: string, updates: Partial<ProjectProfile>): void {
    const profile = profiles.value.find(p => p.id === profileId);
    if (profile) {
      Object.assign(profile, updates, { updatedAt: Date.now() });
    }
  }

  function updateComponentMapping(
    profileId: string, 
    mappings: Partial<ProjectProfile['componentMapping']>,
  ): void {
    const profile = profiles.value.find(p => p.id === profileId);
    if (profile) {
      profile.componentMapping = { ...profile.componentMapping, ...mappings };
      profile.updatedAt = Date.now();
    }
  }

  function addCustomConstraint(profileId: string, constraint: string): void {
    const profile = profiles.value.find(p => p.id === profileId);
    if (profile && constraint.trim()) {
      profile.customConstraints.push(constraint.trim());
      profile.updatedAt = Date.now();
    }
  }

  function removeCustomConstraint(profileId: string, index: number): void {
    const profile = profiles.value.find(p => p.id === profileId);
    if (profile && index >= 0 && index < profile.customConstraints.length) {
      profile.customConstraints.splice(index, 1);
      profile.updatedAt = Date.now();
    }
  }

  function duplicateProfile(profileId: string): ProjectProfile | null {
    const source = profiles.value.find(p => p.id === profileId);
    if (!source) return null;

    const now = Date.now();
    const newProfile: ProjectProfile = {
      ...JSON.parse(JSON.stringify(source)),
      id: nanoid(8),
      name: `${source.name} (副本)`,
      createdAt: now,
      updatedAt: now,
    };

    profiles.value.push(newProfile);
    return newProfile;
  }

  // ============================================================================
  // Storage
  // ============================================================================

  function loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('pagespec-profiles');
      if (stored) {
        const data = JSON.parse(stored);
        profiles.value = data.profiles || [];
        activeProfileId.value = data.activeProfileId || null;
      }
      
      // 确保至少有一个默认配置
      if (profiles.value.length === 0) {
        createProfile('默认配置');
      }
    } catch (e) {
      console.error('Failed to load profiles from storage:', e);
      createProfile('默认配置');
    }
  }

  function saveToStorage(): void {
    try {
      localStorage.setItem('pagespec-profiles', JSON.stringify({
        profiles: profiles.value,
        activeProfileId: activeProfileId.value,
      }));
    } catch (e) {
      console.error('Failed to save profiles to storage:', e);
    }
  }

  return {
    // State
    profiles,
    activeProfileId,
    // Getters
    activeProfile,
    // Actions
    createProfile,
    deleteProfile,
    setActiveProfile,
    updateProfile,
    updateComponentMapping,
    addCustomConstraint,
    removeCustomConstraint,
    duplicateProfile,
    loadFromStorage,
    saveToStorage,
  };
});
