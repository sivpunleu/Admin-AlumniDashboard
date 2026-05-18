<script setup>
import { computed, onMounted, onUnmounted, watch } from "vue";
import BasePage from "../../components/UI/Base/BasePage.vue";
import BaseButton from "../../components/UI/Base/BaseButton.vue";
import BaseModal from "../../components/UI/Base/BaseModal.vue";
import BaseTable from "../../components/UI/Base/BaseTable.vue";
import * as store from "../../stores/managerAlumni";
import { useDepartmentStore } from "@/stores/departmentStore";
import * as generationStore from "@/stores/generationStore";

const getStatusClass = (status) => {
  if (status === 'APPROVE') return 'bg-success-subtle text-success border-success-subtle';
  if (status === 'PENDING') return 'bg-warning-subtle text-warning border-warning-subtle';
  if (status === 'REJECT' || status === 'DEACTIVATED') return 'bg-danger-subtle text-danger border-danger-subtle';
  return 'bg-light text-secondary border-light';
};

const getStatusLabel = (status) => {
  if (status === 'APPROVE') return 'យល់ព្រម';
  if (status === 'PENDING') return 'កំពុងរង់ចាំ';
  if (status === 'REJECT' || status === 'DEACTIVATED') return 'បានធ្វើឱ្យអសកម្ម';
  return status || 'Unknown';
};

const normalizeStatus = (user) => String(user?.status || user?.profile?.status || 'PENDING').toUpperCase();

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://ant-g2-ams.tt.linkpc.net/api/v1").replace(/\/+$/, "");
const getApiOrigin = () => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/.*$/i, '');
  }
};
const API_ORIGIN = getApiOrigin();

const getAlumniName = (user) => (
  user?.profile?.fullname ||
  user?.profile?.fullName ||
  user?.fullname ||
  user?.fullName ||
  user?.name ||
  user?.username ||
  user?.email ||
  'Unknown Alumni'
);

const getAlumniEmail = (user) => user?.email || user?.profile?.email || '';

const getAlumniAvatar = (user) => {
  const rawAvatar =
    user?.profile?.avatar ||
    user?.profile?.avatarUrl ||
    user?.profile?.avatar_url ||
    user?.profile?.image ||
    user?.profile?.photo ||
    user?.avatar ||
    user?.avatarUrl ||
    user?.avatar_url ||
    user?.image ||
    user?.photo;

  if (!rawAvatar) return '';
  if (/^(https?:|data:|blob:)/i.test(rawAvatar)) return rawAvatar;

  const cleanAvatar = String(rawAvatar).replace(/\\/g, '/').replace(/^\/+/, '');

  if (/^(api|storage|uploads|images)\//i.test(cleanAvatar)) {
    return `${API_ORIGIN}/${cleanAvatar}`;
  }

  return `${API_BASE_URL}/${cleanAvatar}`;
};

const getAlumniInitial = (user) => getAlumniName(user).trim().charAt(0).toUpperCase() || 'U';

const handleAvatarError = (event) => {
  event.target.style.display = 'none';
};

const handleAvatarLoad = (event) => {
  event.target.style.display = '';
};

const departmentStore = useDepartmentStore();
const showRegisterModal = store.showRegisterModal;
let searchDebounceTimer;

onMounted(() => {
  store.fetchUsers();
  departmentStore.fetchDepartments();
  generationStore.fetchGenerations();
});

watch([() => store.searchQuery.value, () => store.activeTab.value], ([, activeTab], [, previousActiveTab]) => {
  store.currentPage.value = 1;
  clearTimeout(searchDebounceTimer);

  if (activeTab !== previousActiveTab) {
    store.fetchUsers();
    return;
  }

  searchDebounceTimer = setTimeout(() => {
    store.fetchUsers();
  }, 350);
});

const handlePageChange = (page) => {
  clearTimeout(searchDebounceTimer);
  store.currentPage.value = page;
  store.fetchUsers();
};

onUnmounted(() => {
  clearTimeout(searchDebounceTimer);
});

const pageSummary = computed(() => {
  if (!store.totalItems.value) {
    return "0";
  }

  const perPage = store.getPerPage();
  const start = (store.currentPage.value - 1) * perPage + 1;
  const end = Math.min(store.currentPage.value * perPage, store.totalItems.value);

  return `${start}-${end}`;
});

const searchModel = computed({
  get: () => store.searchQuery.value,
  set: (value) => {
    store.searchQuery.value = value;
  },
});

const activeTabModel = computed({
  get: () => store.activeTab.value,
  set: (value) => {
    store.activeTab.value = value;
  },
});

const tableColumns = [
  { key: "alumni", label: "សមាជិកអតីតនិស្សិត" },
  { key: "id", label: "លេខសម្គាល់" },
  { key: "role", label: "Role" },
  { key: "status", label: "ស្ថានភាព" },
  { key: "actions", label: "ការគ្រប់គ្រង" },
];
</script>

<template>
  <div class="manager-alumni-page bg-dashboard min-vh-100 font-khmer">
    <!-- Header Section -->
    <div class="manager-page-toolbar page-toolbar align-items-start mb-4 manager-animate manager-animate--toolbar">
      <div>
        <h2 class="fw-bold text-dark mb-1">គ្រប់គ្រងអតីតនិស្សិត</h2>
        <p class="text-muted small">ពិនិត្យ អនុម័ត និងគ្រប់គ្រងសំណើចុះឈ្មោះរបស់អតីតនិស្សិត។</p>
      </div>
      <div class="page-toolbar__actions">
        <button type="button" class="btn btn-white border shadow-sm btn-sm px-3" disabled aria-disabled="true"><i class="bi bi-filter-right"></i>
          តម្រងកម្រិតខ្ពស់</button>
        <button @click="store.requireAdmin(store.openRegisterModal)"
          class="btn btn-primary-custom btn-sm px-3 shadow-sm">
          <i class="bi bi-person-plus-fill me-1"></i> ចុះឈ្មោះអតីតនិស្សិត
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar (យោងតាម image_a84f9e.png) -->
    <div class="card border-0 shadow-sm rounded-4 mb-4 manager-animate manager-animate--filter">
      <div class="card-body p-2 page-toolbar manager-filter-toolbar">
        <div class="search-input-wrapper flex-grow-1">
          <i class="bi bi-search text-muted"></i>
          <input v-model="searchModel" type="text" class="form-control-custom"
            placeholder="ស្វែងរកតាមឈ្មោះ, អ៊ីមែល ..." />
        </div>
        <div class="filter-tabs-wrapper bg-light p-1 rounded-3 d-flex border">
          <button @click="activeTabModel = 'ALL'"
            :class="['tab-btn', activeTabModel === 'ALL' ? 'active' : '']">ទាំងអស់</button>
          <button @click="activeTabModel = 'PENDING'"
            :class="['tab-btn', activeTabModel === 'PENDING' ? 'active' : '']">កំពុងរង់ចាំ</button>
          <button @click="activeTabModel = 'APPROVE'"
            :class="['tab-btn', activeTabModel === 'APPROVE' ? 'active' : '']">យល់ព្រម</button>
          <button @click="activeTabModel = 'REJECT'"
            :class="['tab-btn', activeTabModel === 'REJECT' ? 'active' : '']">បានធ្វើឱ្យអសកម្ម</button>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div
        class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center manager-table-header">
        <h5 class="fw-bold m-0 text-dark">កំណត់ត្រាអតីតនិស្សិត <button class="btn-count">{{ store.totalItems.value }}
            កំណត់ត្រា</button></h5>
        <div class="text-muted small">
          បង្ហាញ {{ pageSummary }} នៃ {{ store.totalItems.value }}
        </div>
      </div>
      <div v-if="store.isLoading.value" class="app-state">
        <div>
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3 mb-0">កំពុងផ្ទុក...</p>
        </div>
      </div>

      <div v-else-if="store.users.value.length === 0" class="app-state">
        <div>
          <div class="app-state__icon"><i class="bi bi-people"></i></div>
          <p class="mb-0">មិនមានទិន្នន័យទេ</p>
        </div>
      </div>

      <BaseTable v-else :columns="tableColumns" :data="store.users.value">
        <template #cell-alumni="{ item }">
          <div class="d-flex align-items-center">
            <div class="avatar-sm me-3" :aria-label="getAlumniName(item)">
              <span>{{ getAlumniInitial(item) }}</span>
              <img v-if="getAlumniAvatar(item)" :src="getAlumniAvatar(item)" :alt="getAlumniName(item)"
                class="avatar-sm__image" @error="handleAvatarError" @load="handleAvatarLoad" />
            </div>
            <div>
              <div class="fw-bold small text-dark">{{ getAlumniName(item) }}</div>
              <div class="text-muted smaller">{{ getAlumniEmail(item) }}</div>
            </div>
          </div>
        </template>

        <template #cell-id="{ item }">
          <span class="text-muted small">#{{ item.id }}</span>
        </template>

        <template #cell-role="{ item }">
          <div class="text-muted smaller fs-6">{{ item.role?.name || item.role || 'Alumni' }}</div>
        </template>

        <template #cell-status="{ item }">
          <span :class="['badge-status border', getStatusClass(normalizeStatus(item))]">
            <i class="bi bi-circle-fill dot-icon"></i> {{ getStatusLabel(normalizeStatus(item)) }}
          </span>
        </template>

        <template #cell-actions="{ item }">
          <div class="d-flex justify-content-end gap-2">
            <BaseButton v-if="normalizeStatus(item) === 'PENDING'" @click="store.handleApproveUser(item.id)"
              variant="light" size="sm">
              <i class="bi bi-check-lg text-success me-1"></i> យល់ព្រម
            </BaseButton>
            <BaseButton @click="store.handleChangeStatus(item.id)" variant="light" size="sm" shape="sharp"
              title="Change User Status" aria-label="Change User Status">
              <i class="bi bi-pencil-square text-primary"></i>
            </BaseButton>
          </div>
        </template>
      </BaseTable>

      <div class="card-footer bg-white border-0 py-4 px-4" v-if="store.totalPages.value > 1">
        <BasePage :currentPage="store.currentPage.value" :totalPages="store.totalPages.value"
          @change-page="handlePageChange" />
      </div>

    </div>
  </div>

  <!-- Register Modal using BaseModal -->
  <BaseModal v-model="showRegisterModal" title="ចុះឈ្មោះអតីតនិស្សិត" hideDefaultFooter>
    <form class="app-form" novalidate @submit.prevent="store.handleRegisterAlumni">
      <div>
        <label class="form-label fw-bold small">ឈ្មោះពេញលេញ *</label>
        <input v-model="store.registerForm.value.fullname" type="text" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.fullname }" required
          @input="delete store.registerErrors.value.fullname" />
        <div v-if="store.registerErrors.value.fullname" class="invalid-feedback">
          {{ store.registerErrors.value.fullname }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">អ៊ីមែល *</label>
        <input v-model="store.registerForm.value.email" type="email" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.email }" required
          @input="delete store.registerErrors.value.email" />
        <div v-if="store.registerErrors.value.email" class="invalid-feedback">
          {{ store.registerErrors.value.email }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">លេខទូរស័ព្ទ</label>
        <input v-model="store.registerForm.value.phone" type="tel" class="form-control" />
      </div>

      <div>
        <label class="form-label fw-bold small">ពាក្យសម្ងាត់ </label>
        <input v-model="store.registerForm.value.password" type="password" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.password }" required
          @input="delete store.registerErrors.value.password" />
        <div v-if="store.registerErrors.value.password" class="invalid-feedback">
          {{ store.registerErrors.value.password }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">បញ្ជាក់ពាក្យសម្ងាត់ </label>
        <input v-model="store.registerForm.value.confirmPassword" type="password" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.confirmPassword }" required
          @input="delete store.registerErrors.value.confirmPassword" />
        <div v-if="store.registerErrors.value.confirmPassword" class="invalid-feedback">
          {{ store.registerErrors.value.confirmPassword }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">ដេប៉ាតឺម៉ង់ </label>
        <select v-model="store.registerForm.value.departmentId" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.departmentId }" required
          @change="delete store.registerErrors.value.departmentId">
          <option value="">ជ្រើសរើស</option>
          <option v-for="department in departmentStore.departments || []" :key="department.id" :value="department.id">
            {{ department.name }}
          </option>

        </select>
        <div v-if="store.registerErrors.value.departmentId" class="invalid-feedback">
          {{ store.registerErrors.value.departmentId }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">ជំនាន់ </label>
        <select v-model="store.registerForm.value.generationId" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.generationId }" required
          @change="delete store.registerErrors.value.generationId">
          <option value="">ជ្រើសរើស</option>
          <option v-for="generation in generationStore.generations.value" :key="generation.id" :value="generation.id">
            {{ generation.name }}
          </option>
        </select>
        <div v-if="store.registerErrors.value.generationId" class="invalid-feedback">
          {{ store.registerErrors.value.generationId }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">ស្ថានភាព *</label>
        <select v-model="store.registerForm.value.status" class="form-control" required>
          <option value="PENDING">កំពុងរង់ចាំ</option>
          <option value="APPROVE">យល់ព្រម</option>
          <option value="REJECT">បានធ្វើឱ្យអសកម្ម</option>
        </select>
      </div>

      <div>
        <label class="form-label fw-bold small">មុខរបរបច្ចុប្បន្ន</label>
        <input v-model="store.registerForm.value.currentJob" type="text" class="form-control" />
      </div>

      <div>
        <label class="form-label fw-bold small">ជីវប្រវត្តិ</label>
        <textarea v-model="store.registerForm.value.bio" class="form-control" rows="3"></textarea>
      </div>

      <div class="modal-actions">
        <BaseButton variant="secondary" @click="store.showRegisterModal.value = false" class="flex-grow-1">
          បិទ
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="store.isLoading.value" :loading="store.isLoading.value"
          class="flex-grow-1">
          ចុះឈ្មោះ
        </BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<style scoped>
.font-khmer {
  font-family: 'Kantumruy Pro', sans-serif;
}

.bg-dashboard {
  background-color: #f9fafb;
}

.manager-alumni-page {
  padding: 1rem;
}

.manager-animate {
  animation: manager-panel-enter 220ms ease-out both;
}

.manager-animate--toolbar {
  animation-delay: 20ms;
}

.manager-animate--filter {
  animation-delay: 70ms;
}

.card {
  transition: box-shadow 180ms ease, transform 180ms ease;
}

.manager-animate--filter:hover {
  box-shadow: 0 0.5rem 1.4rem rgba(15, 23, 42, 0.08) !important;
}

.manager-page-toolbar,
.manager-table-header {
  gap: 1rem;
  flex-wrap: wrap;
}

.manager-filter-toolbar {
  gap: 0.75rem;
}

.btn-white {
  background-color: white;
  border-radius: 10px;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease,
    box-shadow 180ms ease;
}

.btn-white:hover,
.btn-primary-custom:hover {
  transform: translateY(-1px);
}

.btn-white:active,
.btn-primary-custom:active {
  transform: translateY(0);
}

.form-control-custom {
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  padding: 8px;
  font-size: 14px;
}

.search-input-wrapper {
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding-left: 12px;
  min-width: 0;
  width: 100%;
  transition: background-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.search-input-wrapper:focus-within {
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.1);
  transform: translateY(-1px);
}

.filter-tabs-wrapper {
  max-width: 100%;
  flex-wrap: wrap;
  gap: 0.25rem;
  transition: box-shadow 180ms ease;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  transition: background-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #216477;
  transform: translateY(-1px);
}

.tab-btn.active {
  background: white;
  color: #216477;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.avatar-sm {
  width: 38px;
  height: 38px;
  background: #e0f2fe;
  color: #0369a1;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: bold;
  font-size: 14px;
  overflow: hidden;
  position: relative;
}

.avatar-sm__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot-icon {
  font-size: 6px;
}

.btn-count {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  font-size: 10px;
  border-radius: 6px;
  padding: 2px 8px;
  color: #64748b;
}

.smaller {
  font-size: 11px;
}

@media (max-width: 768px) {
  .manager-alumni-page {
    padding: 0;
  }

  .manager-table-header {
    align-items: flex-start !important;
    flex-direction: column;
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }

  .manager-filter-toolbar {
    align-items: stretch;
  }

  .filter-tabs-wrapper {
    width: 100%;
  }

  .tab-btn {
    flex: 1 1 calc(50% - 0.25rem);
    padding: 8px 10px;
    text-align: center;
  }
}

.form-label {
  color: #374151;
  margin-bottom: 8px;
  display: block;
}

.form-control {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.form-control:focus {
  border-color: #216477;
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 100, 119, 0.1);
  transform: translateY(-1px);
}

.form-control.is-invalid {
  animation: manager-invalid-shake 180ms ease;
}

.invalid-feedback {
  animation: manager-feedback-enter 160ms ease-out both;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.app-form > div {
  animation: manager-form-field-enter 180ms ease-out both;
}

.app-form > div:nth-child(2) {
  animation-delay: 20ms;
}

.app-form > div:nth-child(3) {
  animation-delay: 40ms;
}

.app-form > div:nth-child(4) {
  animation-delay: 60ms;
}

.app-form > div:nth-child(5) {
  animation-delay: 80ms;
}

.app-form > div:nth-child(6) {
  animation-delay: 100ms;
}

.app-form > div:nth-child(7) {
  animation-delay: 120ms;
}

.app-form > div:nth-child(8) {
  animation-delay: 140ms;
}

.app-form > div:nth-child(9) {
  animation-delay: 160ms;
}

.app-form > div:nth-child(10) {
  animation-delay: 180ms;
}

@keyframes manager-panel-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes manager-form-field-enter {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes manager-feedback-enter {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes manager-invalid-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  35% {
    transform: translateX(-3px);
  }

  70% {
    transform: translateX(3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .manager-animate,
  .form-control.is-invalid,
  .invalid-feedback,
  .app-form > div {
    animation: none !important;
  }

  .card,
  .btn-white,
  .btn-primary-custom,
  .search-input-wrapper,
  .filter-tabs-wrapper,
  .tab-btn,
  .form-control,
  .avatar-sm,
  .badge-status {
    transition: none !important;
  }

  .btn-white:hover,
  .btn-primary-custom:hover,
  .search-input-wrapper:focus-within,
  .tab-btn:hover,
  .form-control:focus {
    transform: none !important;
  }
}
</style>
