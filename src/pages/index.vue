<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { onUnmounted, ref, watch } from 'vue'
  import DragOverlay from '@/components/DragOverlay.vue'
  import FileImporter from '@/components/FileImporter.vue'
  import HelpDialog from '@/components/HelpDialog.vue'
  import PhotoEditor from '@/components/PhotoEditor.vue'
  import { useDragDrop } from '@/composables/useDragDrop'
  import { useEditorHotkeys } from '@/composables/useEditorHotkeys'
  import { useAppStore } from '@/stores/AppStore'
  import { usePhotoStore } from '@/stores/PhotoStore'

  const photoStore = usePhotoStore()
  const { addPhotoFromFile, destroyCropper } = photoStore

  const appStore = useAppStore()
  const { importTrigger } = storeToRefs(appStore)

  const fileImporter = ref<InstanceType<typeof FileImporter>>()

  useEditorHotkeys()

  const { isDragOver, dragEvents } = useDragDrop(files => {
    for (const file of files) {
      addPhotoFromFile(file)
    }
  })

  watch(importTrigger, () => {
    fileImporter.value?.triggerImport()
  })

  onUnmounted(destroyCropper)
</script>

<template>
  <FileImporter ref="fileImporter" />

  <div
    class="editor-area"
    v-bind="dragEvents"
  >
    <DragOverlay :show="isDragOver" />
    <PhotoEditor />
  </div>

  <HelpDialog />
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
  z-index: 1; /* Ensure it's above v-main background but below overlays */
}
</style>
