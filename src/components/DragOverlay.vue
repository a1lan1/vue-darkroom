<script setup lang="ts">
  defineProps<{
    show: boolean
  }>()
</script>

<template>
  <div
    v-if="show"
    class="position-absolute inset-0 bg-opacity-10 pointer-events-none z-10 d-flex align-center justify-center"
  >
    <div class="text-center bg-grey-darken-4 pa-8 rounded-lg">
      <v-icon class="mb-4" color="primary" size="64">mdi-cloud-upload</v-icon>
      <h2 class="text-h4 text-primary font-weight-bold mb-2">Drop Images Here</h2>
      <p class="text-body-1 text-grey">Release to import your photos</p>
      <v-progress-circular
        class="mt-4"
        color="primary"
        indeterminate
        size="32"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.bg-opacity-10 {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.pointer-events-none {
  pointer-events: none;
}

.z-10 {
  z-index: 10;
}
</style>
