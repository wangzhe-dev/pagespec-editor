<script setup lang="ts">
import AppHeader from './AppHeader.vue';
import DesignerPage from '@/ui/pages/DesignerPage.vue';
// import LibraryPage from '@/ui/pages/LibraryPage.vue';
</script>

<template>
  <section class="app-shell">
    <div class="ambient ambient-left" aria-hidden="true" />
    <div class="ambient ambient-right" aria-hidden="true" />
    <div class="ambient-grid" aria-hidden="true" />

    <div class="app-surface">
      <AppHeader />
      <DesignerPage />
    </div>
  </section>
</template>

<style scoped>
.app-shell {
  position: relative;
  isolation: isolate;
  height: 100%;
  padding: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 12% 16%, rgba(var(--accent-primary-rgb), 0.12) 0%, transparent 42%),
    radial-gradient(circle at 88% 10%, rgba(var(--accent-primary-rgb), 0.08) 0%, transparent 36%),
    linear-gradient(160deg, var(--bg-base) 0%, color-mix(in srgb, var(--bg-elevated) 92%, black 8%) 100%);
}

.ambient {
  position: absolute;
  z-index: 0;
  width: 440px;
  height: 440px;
  pointer-events: none;
  filter: blur(70px);
  opacity: 0.42;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(var(--accent-primary-rgb), 0.5) 0%, transparent 68%);
}

.ambient-left {
  top: -240px;
  left: -120px;
}

.ambient-right {
  right: -140px;
  bottom: -280px;
}

.ambient-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.15;
  background-image:
    linear-gradient(to right, var(--border-subtle) 1px, transparent 1px),
    linear-gradient(to bottom, var(--border-subtle) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(circle at center, black 25%, transparent 82%);
}

.app-surface {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--border-subtle) 85%, white 15%);
  background: color-mix(in srgb, var(--bg-base) 92%, white 8%);
  box-shadow:
    0 24px 56px rgba(16, 24, 40, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

@media (max-width: 900px) {
  .app-shell {
    padding: 8px;
  }

  .app-surface {
    border-radius: 14px;
  }
}
</style>
