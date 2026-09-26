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
    location="bottom"
    :model-value="appStore.notification !== null"
    timeout="4000"
    @update:model-value="appStore.dismissNotification()"
  >
    {{ appStore.notification }}
  </v-snackbar>
</template>

<style lang="scss" scoped>
.editor-area {
  position: fixed;
  top: var(--v-layout-top);
  left: var(--v-layout-left);
  right: var(--v-layout-right);
  bottom: var(--v-layout-bottom);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: black;
  color: white;
  z-index: 1;
}
</style>
