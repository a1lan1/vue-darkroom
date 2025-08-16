<script setup lang="ts">
//
</script>

<template>
  <v-app theme="dark" class="no-footer">
    <router-view />
  </v-app>
</template>

<style>
/* Убираем футер Vuetify */
.no-footer .v-footer {
  display: none !important;
}

/* Убираем отступы у v-main */
.no-footer .v-main {
  padding: 0 !important;
}

/* Убираем дефолтные отступы */
.no-footer .v-container {
  padding: 0 !important;
}
</style>
