<!-- AdminLayout.vue -->
<template>
  <div class="admin-layout">

    <!-- Navbar -->
    <Navbar :sidebar-open="sidebarOpen" @toggleSidebar="toggleSidebar" />

    <!-- Sidebar -->
    <Sidebar :is-open="sidebarOpen" @close="closeSidebar" />

    <!-- Overlay Mobile -->
    <transition name="fade">
      <div v-if="sidebarOpen && isMobile" class="sidebar-overlay" @click="closeSidebar"></div>
    </transition>

    <!-- Content -->
    <main class="content" :class="{ full: !sidebarOpen || isMobile }">
      <router-view />
    </main>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

import Navbar from "@/components/comment/Navbar.vue";
import Sidebar from "@/components/comment/Sidebar.vue";

const sidebarOpen = ref(true);
const isMobile = ref(false);

const checkScreen = () => {
  isMobile.value = window.innerWidth < 992;

  // Auto close sidebar on mobile
  if (isMobile.value) {
    sidebarOpen.value = false;
  } else {
    sidebarOpen.value = true;
  }
};

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const closeSidebar = () => {
  sidebarOpen.value = false;
};

onMounted(() => {
  checkScreen();

  window.addEventListener("resize", checkScreen);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", checkScreen);
});
</script>

<style scoped>
/* =========================
   LAYOUT
========================= */

.admin-layout {
  --sidebar-width: 260px;
  --navbar-height: 72px;

  min-height: 100vh;

  background: #f8fafc;
}

/* =========================
   CONTENT
========================= */

.content {
  min-height: 100vh;

  padding-top: calc(var(--navbar-height) + 1rem);
  padding-right: 1.5rem;
  padding-bottom: 1.5rem;
  padding-left: calc(var(--sidebar-width) + 1.5rem);

  transition: all 0.3s ease;
}

/* Full Width */
.content.full {
  padding-left: 1.5rem;
}

/* =========================
   TABLET
========================= */

@media (max-width: 991.98px) {

  .content,
  .content.full {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/* =========================
   MOBILE
========================= */

@media (max-width: 575.98px) {

  .content,
  .content.full {
    padding-top: calc(var(--navbar-height) + 0.75rem);

    padding-left: 0.75rem;
    padding-right: 0.75rem;
    padding-bottom: 0.75rem;
  }
}

/* =========================
   OVERLAY
========================= */

.sidebar-overlay {
  position: fixed;
  inset: 0;

  background: rgba(0, 0, 0, 0.35);

  z-index: 1040;

  backdrop-filter: blur(2px);
}

/* =========================
   ANIMATION
========================= */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>