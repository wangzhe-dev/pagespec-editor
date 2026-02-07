<script setup lang="ts">
import { useSpecStore, useUIStore } from '@/core/store';
import { FileText, Zap, Code, Settings } from 'lucide-vue-next';

const specStore = useSpecStore();
const uiStore = useUIStore();

function getStarted() {
  specStore.createDemo('示例页面');
  uiStore.hideWelcome();
}
</script>

<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <div class="welcome-header">
        <div class="logo-large">
          <FileText :size="48" />
        </div>
        <h1>PageSpec Editor</h1>
        <p class="tagline">页面规格编辑器 + 话术编译器</p>
      </div>
      
      <div class="features">
        <div class="feature">
          <div class="feature-icon">
            <Zap :size="24" />
          </div>
          <h3>极速模式</h3>
          <p>用布局树快速表达页面结构，无需画 Figma</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <Code :size="24" />
          </div>
          <h3>DSL + 约束</h3>
          <p>将页面结构编译成 Agent 友好的短 DSL 和强约束话术</p>
        </div>
        
        <div class="feature">
          <div class="feature-icon">
            <Settings :size="24" />
          </div>
          <h3>项目适配</h3>
          <p>配置组件映射和禁止规则，确保生成代码符合项目规范</p>
        </div>
      </div>
      
      <button class="get-started-btn" @click="getStarted">
        开始使用
      </button>
      
      <p class="hint">
        所有数据存储在本地浏览器中，支持导出/导入
      </p>
    </div>
    
    <div class="welcome-bg">
      <div class="bg-grid"></div>
      <div class="bg-glow"></div>
    </div>
  </div>
</template>

<style scoped>
.welcome-screen {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--bg-base);
  overflow: hidden;
}

.welcome-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 600px;
  padding: 48px;
}

.welcome-header {
  margin-bottom: 48px;
}

.logo-large {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%);
  border-radius: 20px;
  color: white;
  margin-bottom: 24px;
}

h1 {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.tagline {
  font-size: 18px;
  color: var(--text-secondary);
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 48px;
}

.feature {
  padding: 24px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  text-align: left;
}

.feature-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--accent-subtle);
  border-radius: 12px;
  color: var(--accent-primary);
  margin-bottom: 16px;
}

.feature h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.feature p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.get-started-btn {
  padding: 14px 32px;
  background: var(--accent-primary);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.get-started-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(var(--accent-primary-rgb), 0.3);
}

.hint {
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-muted);
}

.welcome-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(var(--border-subtle) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.5;
}

.bg-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, var(--accent-subtle) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  opacity: 0.5;
}
</style>
