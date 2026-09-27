<script setup lang="ts">
  /**
   * PanelSection
   *
   * A titled block inside the editing panel. The icon, the title treatment and
   * the spacing above the body live here so Crop, Rotate, Color and Export all
   * read as the same kind of section instead of four hand-tuned headers.
   */
  defineProps<{
    icon: string
    title: string
  }>()
</script>

<template>
  <section class="panel-section">
    <header class="panel-section__head">
      <v-icon
        class="panel-section__icon"
        :icon="icon"
        size="15"
      />
      <h3 class="panel-section__title">
        {{ title }}
      </h3>
      <div class="panel-section__actions">
        <slot name="actions" />
      </div>
    </header>

    <div class="panel-section__body">
      <slot />
    </div>
  </section>
</template>

<style lang="scss" scoped>
.panel-section {
  padding: 16px 0 20px;
}

.panel-section + :deep(.panel-section) {
  border-top: 1px solid var(--dr-hairline);
}

.panel-section__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  min-height: 28px;
}

.panel-section__icon {
  color: var(--dr-brand-core);
  opacity: 0.9;
}

.panel-section__title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.09em;
  line-height: 1.2;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.62);
}

.panel-section__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
</style>
