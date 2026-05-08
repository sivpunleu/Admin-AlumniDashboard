<template>
  <aside class="sidebar bg-white border-right" :class="{ closed: !isOpen }">

    <!-- ផ្នែកខាងលើនៃ Sidebar (Logo) -->
    <div class="sidebar-header d-flex align-items-center p-4 border-bottom ">
      <div class="logo-box me-2 d-flex align-items-center justify-content-center"
        style="width: 35px; height: 35px; background: #216477; border-radius: 8px;">
        <i class="bi bi-mortarboard-fill text-white fs-5"></i>
      </div>
      <h5 class="mb-0 fw-bold" style="color: #216477;">អ្នកគ្រប់គ្រង</h5>
    </div>

    <div class="p-3">
      <h6 class="text-uppercase text-muted extra-small fw-bold mb-3 tracking-wider ps-2">មឺនុយមេ</h6>
      <ul class="nav nav-pills flex-column gap-1">

        <!-- ផ្ទាំងគ្រប់គ្រង -->
        <li class="nav-item">
          <router-link to="/dashboard" class="nav-link d-flex align-items-center py-2 px-3" exact-active-class="active">
            <i class="bi bi-grid-fill me-3"></i>ផ្ទាំងគ្រប់គ្រង
          </router-link>
        </li>

        <!-- គ្រប់គ្រងអតីតនិស្សិត -->
        <li class="nav-item">
          <router-link to="/manager-alumni" class="nav-link d-flex align-items-center py-2 px-3"
            exact-active-class="active">
            <i class="bi bi-people-fill me-3"></i>គ្រប់គ្រងអតីតនិស្សិត
          </router-link>
        </li>

        <!-- ជំនាន់និស្សិត -->
        <li class="nav-item">
          <router-link to="/generations" class="nav-link d-flex align-items-center py-2 px-3"
            exact-active-class="active">
            <i class="bi bi-mortarboard-fill me-3"></i>ជំនាន់និស្សិត
          </router-link>
        </li>

        <!-- ដេប៉ាតឺម៉ង់ -->
        <li class="nav-item">
          <router-link to="/department" class="nav-link d-flex align-items-center py-2 px-3"
            exact-active-class="active">
            <i class="bi bi-diagram-3-fill me-3"></i>ដេប៉ាតឺម៉ង់
          </router-link>
        </li>

        <!-- ប្រភេទ -->
        <li class="nav-item">
          <router-link to="/category" class="nav-link d-flex align-items-center py-2 px-3" exact-active-class="active">
            <i class="bi bi-journal-text me-3"></i>ប្រភេទ
          </router-link>
        </li>
        <!-- ព្រឹត្តិការណ៏ -->
        <li class="nav-item">
          <router-link to="/event" class="nav-link d-flex align-items-center py-2 px-3" exact-active-class="active">
            <i class="bi bi-calendar-event-fill me-3"></i>ព្រឹត្តិការណ៏
          </router-link>
        </li>

        <!-- ប៊ូតុងចាកចេញ -->
        <li class="nav-item mt-4 pt-3 border-top">
          <button type="button" class="nav-link text-danger w-100 d-flex align-items-center py-2 px-3 btn-logout"
            @click="handleLogout">
            <i class="bi bi-box-arrow-right me-3"></i>ចាកចេញពីប្រព័ន្ធ
          </button>
        </li>
      </ul>
    </div>

    <!-- ព័ត៌មានអ្នកប្រើប្រាស់នៅខាងក្រោម Sidebar -->
    <div class="sidebar-footer mt-auto p-3 border-top d-flex align-items-center">
      <div class="avatar me-2"
        style="width: 35px; height: 35px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <i class="bi bi-person-fill text-muted fs-5"></i>
      </div>
      <div class="overflow-hidden">
        <p class="mb-0 fw-bold small text-dark text-truncate">
          {{ authStore.user.role.name === 'admin' ? 'អ្នកគ្រប់គ្រង' : authStore.user.role.name }}
        </p>
        <p class="mb-0 extra-small text-muted text-truncate">{{ authStore.user.email }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useAuthStore } from "@/stores/useAuth";

defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
});

const authStore = useAuthStore();

const handleLogout = () => {
  authStore.logout();
};
</script>

<style scoped>
/* កំណត់ Font ខ្មែរសម្រាប់ Sidebar ទាំងមូល */
.sidebar {
  font-family: 'Kantumruy Pro';
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background-color: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  z-index: 1030;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.02);
}

.sidebar.closed {
  left: -260px;
  transform: translateX(-260px);
}

.extra-small {
  font-size: 10px;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

.nav-link {
  color: #64748b;
  font-weight: 500;
  font-size: 18px;
  border-radius: 12px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  cursor: pointer;
}

.nav-link i {
  font-size: 20px;
  opacity: 0.8;
}

/* ពេលដាក់ Mouse លើ */
.nav-link:hover {
  background-color: #f1f5f9;
  color: #216477;
}

/* ពេល Menu កំពុងសកម្ម (Active) */
.nav-link.active {
  background-color: #f0f7f9 !important;
  color: #216477 !important;
  font-weight: 600;
}

.nav-link.active i {
  color: #216477;
  opacity: 1;
}

/* ស្ទីលពិសេសសម្រាប់ប៊ូតុងចាកចេញ */
.btn-logout {
  background: none;
  border: none;
  text-align: left;
}

.btn-logout:hover {
  background-color: #fff1f2 !important;
  color: #dc3545 !important;
}

/* កែសម្រួល Scrollbar ឱ្យតូចស្អាត */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
</style>