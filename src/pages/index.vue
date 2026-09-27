<script setup lang="ts">
  import { onUnmounted } from 'vue'
  import DragOverlay from '@/components/DragOverlay.vue'
  import FileImporter from '@/components/FileImporter.vue'
  import HelpDialog from '@/components/HelpDialog.vue'
  import PhotoEditor from '@/components/PhotoEditor.vue'
  import { useDragDrop } from '@/composables/useDragDrop'
  import { useEditorHotkeys } from '@/composables/useEditorHotkeys'
  import { useAppStore } from '@/stores/appStore'
  import { usePhotoStore } from '@/stores/photoStore'

  const photoStore = usePhotoStore()
  const appStore = useAppStore()

  useEditorHotkeys()

  const { isDragOver, dragEvents } = useDragDrop(files => {
    void photoStore.addPhotosFromFiles(files)
  })

  onUnmounted(() => {
    photoStore.destroyCropper()
  })
</script>

<template>
  <FileImporter />

  <div
    v-bind="dragEvents"
    class="editor-area"
  >
    <DragOverlay :show="isDragOver" />
    <PhotoEditor />
  </div>

  <HelpDialog />

  <v-snackbar
    class="notification"
    location="top right"
    :model-value="appStore.notification !== null"
    timeout="4000"
    @update:model-value="appStore.dismissNotification()"
  >
    {{ appStore.notification }}
  </v-snackbar>
</template>

<style lang="scss" scoped>
/*
 * The viewport is pinned to the layout region and positioned with the CSS
 * variables Vuetify writes for the app bar, drawer and footer. The alternative
 * — a plain block inside `v-main` — would need the same offsets guessed again
 * every time a layout element is added.
 */
.editor-area {
  position: fixed;
  top: var(--v-layout-top);
  right: var(--v-layout-right);
  bottom: var(--v-layout-bottom);
  left: var(--v-layout-left);
  z-index: 1;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(245, 165, 36, 0.05), transparent 60%),
    rgb(var(--v-theme-background, 12, 13, 15));
  color: rgb(var(--v-theme-on-background, 255, 255, 255));
}

/*
 * `v-snackbar` positions itself with flexbox `align-items` / `justify-content`
 * inside a fixed root that covers the whole viewport, so `top` and `bottom`
 * offsets never apply to it — padding is the only thing that insets the toast
 * from the edges. The earlier `bottom` rule was silently doing nothing, and the
 * toast landed underneath the filmstrip, which read as "in the middle".
 *
 * Top right because Export All sits in the app bar: the confirmation appears
 * next to the button that produced it, and the bottom of the window is already
 * occupied by the filmstrip.
 */
.notification {
  padding-top: calc(var(--v-layout-top) + 12px);
  padding-right: 16px;
}
</style>
