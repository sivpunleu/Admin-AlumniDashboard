<template>
  <div>
    <div v-if="!authStore.isAdmin">
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-md-6 text-center card border-0 shadow-sm rounded-4 p-5">
            <h1 class="display-4 fw-bold mb-4">សូមទោស!</h1>
            <p class="lead mb-4">អ្នកមិនមានសិទ្ធិចូលប្រើផ្នែកនេះទេ។ សូមទំនាក់ទំនងអ្នកគ្រប់គ្រងរបស់អ្នក។</p>
            <button class="btn btn-primary-custom rounded-pill px-4 fw-medium">ត្រលប់ទៅLogin</button>
          </div>
        </div>
      </div>
    </div>
    <div class="admin-layout" v-else>
      <Navbar :sidebar-open="sidebarOpen" @toggleSidebar="toggleSidebar" />
      <div class="d-flex">
        <Sidebar :is-open="sidebarOpen" />
        <main class="content" :class="{ expanded: !sidebarOpen }">
          <router-view />

        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/useAuth";
const authStore = useAuthStore();
import Navbar from "@/components/comment/Navbar.vue";
import Sidebar from "@/components/comment/Sidebar.vue";

const sidebarOpen = ref(true);

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};
//remove token from local storage when logout
//

</script>

<style scoped>
.admin-layout {
  --sidebar-width: 260px;
  --navbar-height: 72px;
  min-height: 100vh;
}

.content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: calc(var(--navbar-height) + 1rem) 1.5rem 1.5rem;
  transition: margin-left 0.3s ease, padding-left 0.3s ease;
}

.content.expanded {
  margin-left: 0;
}

@media (max-width: 991.98px) {
  .content {
    margin-left: 0;
    padding-top: calc(var(--navbar-height) + 1rem);
  }
}
</style>
