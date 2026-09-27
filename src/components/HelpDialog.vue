<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { computed } from 'vue'
  import { GETTING_STARTED_STEPS, SHORTCUT_GROUPS } from '@/constants/shortcuts'
  import { useAppStore } from '@/stores/appStore'

  const appStore = useAppStore()
  const { showHelp } = storeToRefs(appStore)

  const show = computed({
    get: () => showHelp.value,
    set: val => appStore.toggleHelp(val),
  })
</script>

<template>
  <v-dialog
    v-model="show"
    max-width="640"
  >
    <v-card class="help-dialog">
      <div class="help-dialog__head">
        <div class="help-dialog__headings">
          <v-icon
            class="help-dialog__head-icon"
            icon="mdi-keyboard-outline"
            size="18"
          />
          <v-card-title class="help-dialog__title">
            Keyboard shortcuts
          </v-card-title>
        </div>

        <v-btn
          aria-label="Close help"
          icon="mdi-close"
          size="small"
          variant="text"
          @click="show = false"
        />
      </div>

      <v-card-text class="help-dialog__body">
        <ol class="steps">
          <li
            v-for="step in GETTING_STARTED_STEPS"
            :key="step"
            class="steps__item"
          >
            {{ step }}
          </li>
        </ol>

        <v-divider class="my-6" />

        <div
          v-for="group in SHORTCUT_GROUPS"
          :key="group.title"
          class="shortcut-group"
        >
          <h3 class="shortcut-group__title">
            {{ group.title }}
          </h3>

          <div
            v-for="shortcut in group.shortcuts"
            :key="shortcut.description"
            class="shortcut"
          >
            <span class="shortcut__keys">
              <kbd
                v-for="key in shortcut.keys"
                :key="key"
                class="shortcut__key"
              >{{ key }}</kbd>
            </span>
            <span class="shortcut__description">
              {{ shortcut.description }}
            </span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.help-dialog {
  border: 1px solid var(--dr-hairline);
  background: rgb(var(--v-theme-surface, 20, 22, 25));
}

.help-dialog__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 8px;
}

.help-dialog__headings {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.help-dialog__head-icon {
  color: var(--dr-brand-core);
}

.help-dialog__title {
  padding: 0;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.help-dialog__body {
  padding: 8px 24px 24px;
}

/* Getting started -------------------------------------------------------- */

.steps {
  margin: 0;
  padding-left: 18px;
}

.steps__item {
  font-size: 13px;
  line-height: 1.65;
  color: rgba(255, 255, 255, 0.62);
}

.steps__item + .steps__item {
  margin-top: 4px;
}

.steps__item::marker {
  color: var(--dr-brand-core);
  font-weight: 600;
}

/* Shortcut list ---------------------------------------------------------- */

.shortcut-group + .shortcut-group {
  margin-top: 20px;
}

.shortcut-group__title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.09em;
  line-height: 1.2;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.shortcut {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 5px 0;
}

.shortcut__keys {
  display: flex;
  flex: none;
  align-items: center;
  gap: 4px;
  min-width: 124px;
}

.shortcut__key {
  display: inline-grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border: 1px solid var(--dr-hairline-strong);
  border-bottom-width: 2px;
  border-radius: var(--dr-radius-xs);
  background: rgba(255, 255, 255, 0.05);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  color: rgba(255, 255, 255, 0.9);
}

.shortcut__description {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.66);
}

@media (max-width: 599px) {
  .shortcut {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .shortcut__keys {
    min-width: 0;
  }
}
</style>
