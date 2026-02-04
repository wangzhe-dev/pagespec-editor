<script setup lang="ts">
import { useUIStore } from '@/app/store';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next';

const uiStore = useUIStore();

function getIcon(type: string) {
  switch (type) {
    case 'success': return CheckCircle;
    case 'error': return XCircle;
    case 'warning': return AlertTriangle;
    default: return Info;
  }
}
</script>

<template>
  <div class="toast-container">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in uiStore.toasts" 
        :key="toast.id"
        class="toast"
        :class="toast.type"
      >
        <component :is="getIcon(toast.type)" :size="18" class="toast-icon" />
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" @click="uiStore.removeToast(toast.id)">
          <X :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  min-width: 280px;
  max-width: 400px;
}

.toast.success {
  border-left: 3px solid var(--success);
}

.toast.success .toast-icon {
  color: var(--success);
}

.toast.error {
  border-left: 3px solid var(--danger);
}

.toast.error .toast-icon {
  color: var(--danger);
}

.toast.warning {
  border-left: 3px solid var(--warning);
}

.toast.warning .toast-icon {
  color: var(--warning);
}

.toast.info {
  border-left: 3px solid var(--accent-primary);
}

.toast.info .toast-icon {
  color: var(--accent-primary);
}

.toast-message {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  cursor: pointer;
}

.toast-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
