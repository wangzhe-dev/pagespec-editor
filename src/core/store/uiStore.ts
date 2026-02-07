import { defineStore } from 'pinia';
import { ref } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export const useUIStore = defineStore('ui', () => {
  const theme = ref<'light' | 'dark'>('dark');
  const showWelcome = ref(true);
  const toasts = ref<ToastMessage[]>([]);

  function setTheme(next: 'light' | 'dark') {
    theme.value = next;
    const root = document.documentElement;
    root.classList.toggle('light', next === 'light');
    root.classList.toggle('dark', next === 'dark');
  }

  function hideWelcome(): void {
    showWelcome.value = false;
    localStorage.setItem('pagespec-welcome-shown', 'true');
  }

  function resetWelcome(): void {
    showWelcome.value = true;
    localStorage.removeItem('pagespec-welcome-shown');
  }

  function showToast(type: ToastType, message: string, duration: number = 3000): void {
    const id = Math.random().toString(36).slice(2, 10);
    toasts.value.push({ id, type, message, duration });

    if (duration > 0) {
      window.setTimeout(() => removeToast(id), duration);
    }
  }

  function removeToast(id: string): void {
    const idx = toasts.value.findIndex(toast => toast.id === id);
    if (idx >= 0) {
      toasts.value.splice(idx, 1);
    }
  }

  function loadFromStorage(): void {
    try {
      const storedTheme = localStorage.getItem('pagespec-theme') as 'light' | 'dark' | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
      }

      if (localStorage.getItem('pagespec-welcome-shown') === 'true') {
        showWelcome.value = false;
      }
    } catch {
      // ignore
    }
  }

  function saveToStorage(): void {
    try {
      localStorage.setItem('pagespec-theme', theme.value);
    } catch {
      // ignore
    }
  }

  return {
    theme,
    showWelcome,
    toasts,
    setTheme,
    hideWelcome,
    resetWelcome,
    showToast,
    removeToast,
    loadFromStorage,
    saveToStorage,
  };
});
