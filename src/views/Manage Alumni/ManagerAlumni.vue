<script setup>
import { computed, onMounted, watch } from "vue";
import BasePage from "../../components/UI/Base/BasePage.vue";
import BaseButton from "../../components/UI/Base/BaseButton.vue";
import BaseModal from "../../components/UI/Base/BaseModal.vue";
import BaseTable from "../../components/UI/Base/BaseTable.vue";
import * as store from "../../stores/managerAlumni";

const getStatusClass = (status) => {
  if (status === 'APPROVE') return 'bg-success-subtle text-success border-success-subtle';
  if (status === 'PENDING') return 'bg-warning-subtle text-warning border-warning-subtle';
  return 'bg-light text-secondary border-light';
};

const getStatusLabel = (status) => {
  if (status === 'APPROVE') return 'យល់ព្រម';
  if (status === 'PENDING') return 'កំពុងរង់ចាំ';
  return 'បានធ្វើឱ្យអសកម្ម';
};

const normalizeStatus = (user) => String(user?.status || user?.profile?.status || 'PENDING').toUpperCase();

onMounted(() => store.fetchUsers());
watch([() => store.searchQuery.value, () => store.activeTab.value], () => {
  store.currentPage.value = 1;
  store.fetchUsers();
});

const handlePageChange = (page) => {
  store.currentPage.value = page;
  store.fetchUsers();
};

const pageSummary = computed(() => {
  if (!store.totalItems.value) {
    return "0";
  }

  const perPage = store.itemsPerPage.value || 10;
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
  <div class="p-4 bg-dashboard min-vh-100 font-khmer">
    <!-- Header Section -->
    <div class="page-toolbar align-items-start mb-4">
      <div>
        <h2 class="fw-bold text-dark mb-1">គ្រប់គ្រងអតីតនិស្សិត</h2>
        <p class="text-muted small">ពិនិត្យ អនុម័ត និងគ្រប់គ្រងសំណើចុះឈ្មោះរបស់អតីតនិស្សិត។</p>
      </div>
      <div class="page-toolbar__actions">
        <button class="btn btn-white border shadow-sm btn-sm px-3"><i class="bi bi-filter-right"></i>
          តម្រងកម្រិតខ្ពស់</button>
        <button @click="store.requireAdmin(store.openRegisterModal)"
          class="btn btn-primary-custom btn-sm px-3 shadow-sm">
          <i class="bi bi-person-plus-fill me-1"></i> ចុះឈ្មោះអតីតនិស្សិត
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar (យោងតាម image_a84f9e.png) -->
    <div class="card border-0 shadow-sm rounded-4 mb-4">
      <div class="card-body p-2 page-toolbar">
        <div class="search-input-wrapper flex-grow-1">
          <i class="bi bi-search text-muted"></i>
          <input v-model="searchModel" type="text" class="form-control-custom"
            placeholder="ស្វែងរកតាមឈ្មោះ, អ៊ីមែល ឬអត្តលេខ..." />
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
      <div class="card-header bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
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
            <div class="avatar-sm me-3">{{ (item.fullname || 'U')[0] }}</div>
            <div>
              <div class="fw-bold small text-dark">{{ item.fullname || item.name }}</div>
              <div class="text-muted smaller">{{ item.email }}</div>
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
            <BaseButton v-if="normalizeStatus(item) === 'PENDING'" @click="store.handleChangeStatus(item.id)"
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
  <BaseModal v-model="store.showRegisterModal.value" title="ចុះឈ្មោះអតីតនិស្សិត" hideDefaultFooter>
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
        <label class="form-label fw-bold small">ពាក្យសម្ងាត់ *</label>
        <input v-model="store.registerForm.value.password" type="password" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.password }" required
          @input="delete store.registerErrors.value.password" />
        <div v-if="store.registerErrors.value.password" class="invalid-feedback">
          {{ store.registerErrors.value.password }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">អះអាងពាក្យសម្ងាត់ *</label>
        <input v-model="store.registerForm.value.confirmPassword" type="password" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.confirmPassword }" required
          @input="delete store.registerErrors.value.confirmPassword" />
        <div v-if="store.registerErrors.value.confirmPassword" class="invalid-feedback">
          {{ store.registerErrors.value.confirmPassword }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">ដេបាតមេន *</label>
        <select v-model="store.registerForm.value.departmentId" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.departmentId }" required
          @change="delete store.registerErrors.value.departmentId">
          <option value="">-- ជ្រើសរើស --</option>
          <option value="1">Computer Science</option>
          <option value="2">Business</option>
          <option value="3">Engineering</option>
        </select>
        <div v-if="store.registerErrors.value.departmentId" class="invalid-feedback">
          {{ store.registerErrors.value.departmentId }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">ជំនាន់ *</label>
        <select v-model="store.registerForm.value.generationId" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.generationId }" required
          @change="delete store.registerErrors.value.generationId">
          <option value="">-- ជ្រើសរើស --</option>
          <option value="1">2020</option>
          <option value="2">2021</option>
          <option value="3">2022</option>
          <option value="4">2023</option>
          <option value="5">2024</option>
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
        <label class="form-label fw-bold small">ជីវប្របត្តិ</label>
        <textarea v-model="store.registerForm.value.bio" class="form-control" rows="3"></textarea>
      </div>

      <div class="modal-actions">
        <BaseButton variant="secondary" @click="store.showRegisterModal.value = false" class="flex-grow-1">
          បិទ
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="store.isLoading.value" :loading="store.isLoading.value"
          class="flex-grow-1">
          ឆ។ចៈណ្រនា
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

.btn-white {
  background-color: white;
  border-radius: 10px;
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
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #64748b;
  transition: 0.2s;
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

.btn-action {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.p-btn {
  border: none;
  background: #f3f4f6;
  color: #374151;
  padding: 5px 15px;
  border-radius: 8px;
  font-size: 13px;
  margin: 0 2px;
}

.p-btn.active {
  background: #216477;
  color: white;
  font-weight: bold;
}

.smaller {
  font-size: 11px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-content {
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  color: #1f2937;
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
}

.form-control:focus {
  border-color: #216477;
  outline: none;
  box-shadow: 0 0 0 3px rgba(33, 100, 119, 0.1);
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
</style>
