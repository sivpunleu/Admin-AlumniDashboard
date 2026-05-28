<!-- Sidebar.vue -->
<template>
  <aside class="sidebar" :class="{ closed: !isOpen }">

    <!-- Header -->
    <div class="sidebar-header d-flex align-items-center p-3 border-bottom">
      <router-link to="/dashboard" class="sidebar-logo-link" aria-label="Alumni System dashboard">
        <img src="../../assets/Imgage/Logo.jpg" alt="Alumni System" class="sidebar-logo-img">
      </router-link>
    </div>

    <!-- Menu -->
    <div class="p-3 flex-grow-1 overflow-auto">

      <ul class="nav nav-pills flex-column gap-1">

        <li class="nav-item">
          <router-link to="/dashboard" class="nav-link" exact-active-class="active" @click="emit('close')">
            <i class="bi bi-grid-fill me-3"></i>
            ផ្ទាំងគ្រប់គ្រង
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/manager-alumni" class="nav-link" exact-active-class="active" @click="emit('close')">
            <i class="bi bi-people-fill me-3"></i>
            គ្រប់គ្រងអតីតនិស្សិត
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/generations" class="nav-link" exact-active-class="active" @click="emit('close')">
            <i class="bi bi-mortarboard-fill me-3"></i>
            ជំនាន់និស្សិត
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/department" class="nav-link" exact-active-class="active" @click="emit('close')">
            <i class="bi bi-diagram-3-fill me-3"></i>
            ដេប៉ាតឺម៉ង់
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/category" class="nav-link" exact-active-class="active" @click="emit('close')">
            <i class="bi bi-journal-text me-3"></i>
            ប្រភេទ
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/event" class="nav-link" active-class="active" @click="emit('close')">
            <i class="bi bi-calendar-event-fill me-3"></i>
            ព្រឹត្តិការណ៍
          </router-link>
        </li>

        <li class="nav-item">
          <router-link to="/settings" class="nav-link" exact-active-class="active" @click="emit('close')">
            <i class="bi bi-gear-fill me-3"></i>
            ការកំណត់
          </router-link>
        </li>

        <!-- Logout -->
        <li class="nav-item mt-4 pt-3 border-top">
          <button type="button" class="nav-link text-danger w-100 btn-logout" @click="handleLogout">
            <i class="bi bi-box-arrow-right me-3"></i>
            ចាកចេញពីប្រព័ន្ធ
          </button>
        </li>

      </ul>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer border-top p-3 d-flex align-items-center">

      <div class="avatar me-2">
        <i class="bi bi-person-fill text-muted"></i>
      </div>

      <div class="overflow-hidden">
        <p class="mb-0 fw-bold small text-truncate">
          {{ displayRole }}
        </p>

        <p class="mb-0 extra-small text-muted text-truncate">
          {{ currentUser.email || '' }}
        </p>
      </div>

    </div>

  </aside>
</template>

<script setup>
import { computed } from "vue";
// import BaseButton from "@/components/UI/Base/BaseButton.vue";
import { useAuthStore } from "@/stores/useAuth";


defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(["close"]);

const authStore = useAuthStore();

const currentUser = computed(() => authStore.user || {});

const currentRoleName = computed(() => {
  const role =
    currentUser.value?.role ??
    currentUser.value?.userRole ??
    null;

  if (typeof role === "string") return role;

  return role?.name ?? "";
});

const displayRole = computed(() => {
  const normalizedRole = String(
    currentRoleName.value || ""
  ).toLowerCase();

  return normalizedRole === "admin"
    ? "អ្នកគ្រប់គ្រង"
    : currentRoleName.value || "User";
});

const handleLogout = () => {
  authStore.logout();
};
</script>

<style scoped>
.sidebar {
  font-family: "Kantumruy Pro";

  position: fixed;
  top: 0;
  left: 0;

  width: 260px;
  height: 100vh;

  background: #ffffff;

  display: flex;
  flex-direction: column;

  z-index: 1050;

  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;

  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
}

/* Close */
.sidebar.closed {
  transform: translateX(-100%);
}

/* Header */
.sidebar-header {
  min-height: 112px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-logo-link {
  width: 100%;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  transition: background-color 0.2s ease;
}


.sidebar-logo-img {
  width: min(120px, 80%);
  height: 80px;
  object-fit: contain;
}

/* Menu */
.nav-link {
  position: relative;
  display: flex;
  align-items: center;

  padding: 12px 16px;

  border-radius: 12px;

  color: #64748b;

  font-size: 16px;
  font-weight: 500;

  transition: all 0.2s ease;
}

.nav-link i {
  font-size: 20px;
}

.nav-link:hover {
  background: #f1f5f9;
  color: #216477;
}

.nav-link.active {
  background: #f0f7f9 !important;
  color: #216477 !important;
  font-weight: 600;
  box-shadow: inset 4px 0 0 #216477;
}

.nav-link.active i {
  color: #216477;
}

.nav-link.active::after {
  content: "";
  position: absolute;
  right: 14px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  /* background: #216477; */
}

.btn-logout {
  border: none;
  background: transparent;

  text-align: left;
}

.btn-logout:hover {
  background: #fff1f2 !important;
}

/* Footer */
.avatar {
  width: 35px;
  height: 35px;

  border-radius: 50%;

  background: #f1f5f9;

  display: flex;
  align-items: center;
  justify-content: center;
}

/* Scroll */
.sidebar::-webkit-scrollbar {
  width: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}

/* Utilities */
.extra-small {
  font-size: 10px;
}

.tracking-wider {
  letter-spacing: 0.05em;
}

/* Tablet */
@media (max-width: 991.98px) {
  .sidebar {
    width: 280px;
    max-width: 85%;
  }
}

/* Mobile */
@media (max-width: 575.98px) {
  .sidebar {
    width: 260px;
    max-width: 90%;
  }

  .nav-link {
    font-size: 15px;
    padding: 11px 14px;
  }

  .nav-link i {
    font-size: 18px;
  }
}
</style>
