<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
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
  if (status === 'REJECT' || status === 'DEACTIVATED') return 'បានផ្អាកដំណើរការ';
  return status || 'Unknown';
};

const normalizeBooleanFlag = (value) => {
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'verified'].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

const isAccountVerified = (user) => normalizeBooleanFlag(
  user?.isVerifyEmail ??
  user?.isVerified ??
  user?.emailVerified ??
  user?.verified ??
  user?.profile?.isVerifyEmail ??
  user?.profile?.isVerified,
);

const getVerifyClass = (user) => (
  isAccountVerified(user)
    ? 'bg-success-subtle text-success border-success-subtle'
    : 'bg-warning-subtle text-warning border-warning-subtle'
);

const getVerifyLabel = (user) => (
  isAccountVerified(user) ? 'បានផ្ទៀងផ្ទាត់' : 'មិនទាន់ផ្ទៀងផ្ទាត់'
);

const normalizeStatus = (user) => {
  const status = String(
    user?.status ||
    user?.profile?.status ||
    user?.accountStatus ||
    user?.state ||
    ''
  ).trim().toUpperCase();

  if (['APPROVED', 'ACTIVE', 'VERIFIED'].includes(status)) return 'APPROVE';
  if (['REJECTED', 'DEACTIVATE', 'INACTIVE', 'DISABLED'].includes(status)) {
    return 'DEACTIVATED';
  }

  return status || (user?.isVerifyEmail ? 'APPROVE' : 'PENDING');
};

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
const showAccountTypeModal = store.showAccountTypeModal;
const showRegisterModal = store.showRegisterModal;
const showAdminRegisterModal = store.showAdminRegisterModal;
const PRIMARY_COLOR = store.PRIMARY_COLOR;
let searchDebounceTimer;
const skeletonRows = Array.from({ length: 6 }, (_, index) => index);
const isInitialPageLoading = ref(true);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const showAdminPassword = ref(false);
const showAdminConfirmPassword = ref(false);
const INITIAL_PLACEHOLDER_MIN_MS = 350;

const stats = computed(() => {
  const result = {
    total: Number(store.allUsersTotal?.value || 0),
    approved: Number(store.allUsersApproved?.value || 0),
    pending: Number(store.allUsersPending?.value || 0),
    deactivated: Number(store.allUsersDeactivated?.value || 0),
  };

  return result;
});

const showStatsSkeleton = computed(
  () =>
    isInitialPageLoading.value ||
    store.isLoading.value &&
    store.users.value.length === 0 &&
    store.totalItems.value === 0 &&
    stats.value.total === 0,
);

const showTableSkeleton = computed(
  () =>
    isInitialPageLoading.value ||
    (store.isLoading.value && store.users.value.length === 0),
);

const showRefreshPlaceholder = computed(
  () =>
    !isInitialPageLoading.value &&
    store.isLoading.value &&
    store.users.value.length > 0,
);

onMounted(async () => {
  isInitialPageLoading.value = true;
  const minPlaceholderDelay = new Promise((resolve) => {
    window.setTimeout(resolve, INITIAL_PLACEHOLDER_MIN_MS);
  });

  try {
    await Promise.all([
      departmentStore.fetchDepartments(),
      generationStore.fetchGenerations(),
      store.fetchUsers(),
      minPlaceholderDelay,
    ]);
  } finally {
    isInitialPageLoading.value = false;
  }
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

const normalizeId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const getGenerationDepartmentId = (generation) => normalizeId(
  generation?.departmentId ??
  generation?.department_id ??
  generation?.department?.id,
);

// Filter departments based on selected generation
const filteredDepartments = computed(() => {
  const generationId = store.registerForm.value.generationId;
  if (!generationId) {
    return [];
  }

  const generation = (generationStore.generations.value || []).find(
    gen => normalizeId(gen.id) === normalizeId(generationId)
  );

  const departmentId = getGenerationDepartmentId(generation);
  if (!departmentId) {
    return departmentStore.departments || [];
  }

  const matchedDepartments = (departmentStore.departments || []).filter(
    dept => normalizeId(dept.id) === departmentId
  );

  if (matchedDepartments.length) {
    return matchedDepartments;
  }

  return generation?.department ? [generation.department] : [];
});

// Reset department when generation changes
watch(() => store.registerForm.value.generationId, () => {
  store.registerForm.value.departmentId = "";
  delete store.registerErrors.value.departmentId;
});

watch(showRegisterModal, (isOpen) => {
  if (!isOpen) {
    store.resetRegisterForm();
    store.clearRegisterErrors();
    showPassword.value = false;
    showConfirmPassword.value = false;
  }
});

watch(showAdminRegisterModal, (isOpen) => {
  if (!isOpen) {
    store.resetAdminRegisterForm();
    store.clearAdminRegisterErrors();
    showAdminPassword.value = false;
    showAdminConfirmPassword.value = false;
  }
});

const tableColumns = [
  { key: "alumni", label: "សមាជិកអតីតនិស្សិត" },
  { key: "id", label: "លេខសម្គាល់" },
  { key: "role", label: "Role" },
  { key: "verify", label: "ផ្ទៀងផ្ទាត់អ៊ីមែល" },
  { key: "status", label: "ស្ថានភាព" },
  { key: "actions", label: "ការគ្រប់គ្រង" },
];
</script>

<template>
  <div class="manager-alumni-page bg-dashboard min-vh-100 font-khmer">
    <!-- Header Section -->
    <div class="manager-page-toolbar page-toolbar align-items-start mb-4">
      <div>
        <h2 class="fw-bold text-dark mb-1">គ្រប់គ្រងអតីតនិស្សិត</h2>
        <p class="text-muted small">ពិនិត្យ អនុម័ត និងគ្រប់គ្រងសំណើចុះឈ្មោះរបស់អតីតនិស្សិត។</p>
      </div>
      <div class="page-toolbar__actions">
        <!-- <button @click="store.requireAdmin(store.openRegisterModal)"
          class="btn btn-primary-custom btn-sm px-3 shadow-sm">
          <i class="bi bi-person-plus-fill me-1"></i> ចុះឈ្មោះអតីតនិស្សិត
        </button> -->
        <button @click="store.requireAdmin(store.openModal)"
          class="btn btn-primary-custom btn-sm px-3 shadow-sm">
          <i class="bi bi-person-plus-fill me-1"></i> បង្កើតគណនីថ្មី
        </button>
      </div>
    </div>
    <div class="row g-3 mb-4">
      <!-- អតីតនិស្សិតសរុប -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4"
          :style="{ borderColor: PRIMARY_COLOR + ' !important' }">
          <div class="d-flex align-items-center">
            <div class="icon-box me-3"><i class="bi bi-people fs-4"></i></div>
            <div>
              <p class="text-muted small mb-0">អតីតនិស្សិតសរុប</p>
              <span v-if="showStatsSkeleton" class="placeholder-glow d-block" aria-hidden="true">
                <span class="placeholder skeleton-placeholder skeleton-stat-value"></span>
              </span>
              <h3 v-else class="fw-bold mb-0">{{ stats.total }}</h3>
            </div>
          </div>
        </div>
      </div>
      <!-- បានអនុម័ត -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-success">
          <div class="d-flex align-items-center">
            <div class="icon-box text-success me-3" style="background: #e6f4ea;"><i class="bi bi-person-check fs-4"></i>
            </div>
            <div>
              <p class="text-muted small mb-0">បានអនុម័ត</p>
              <span v-if="showStatsSkeleton" class="placeholder-glow d-block" aria-hidden="true">
                <span class="placeholder skeleton-placeholder skeleton-stat-value"></span>
              </span>
              <h3 v-else class="fw-bold mb-0">{{ stats.approved }}</h3>
            </div>
          </div>
        </div>
      </div>
      <!-- កំពុងរង់ចាំពិនិត្យ -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-warning">
          <div class="d-flex align-items-center">
            <div class="icon-box text-warning me-3" style="background: #fff4e5;"><i
                class="bi bi-clock-history fs-4"></i></div>
            <div>
              <p class="text-muted small mb-0">កំពុងរង់ចាំពិនិត្យ</p>
              <span v-if="showStatsSkeleton" class="placeholder-glow d-block" aria-hidden="true">
                <span class="placeholder skeleton-placeholder skeleton-stat-value"></span>
              </span>
              <h3 v-else class="fw-bold mb-0">{{ stats.pending }}</h3>
            </div>
          </div>
        </div>
      </div>
      <!-- បានផ្អាកដំណើរការ -->
      <div class="col-md-3">
        <div class="card border-0 shadow-sm rounded-4 p-3 h-100 border-start border-4 border-danger">
          <div class="d-flex align-items-center">
            <div class="icon-box text-danger me-3" style="background: #fdf2f2;"><i
                class="bi bi-exclamation-octagon fs-4"></i></div>
            <div>
              <p class="text-muted small mb-0">បានផ្អាកដំណើរការ</p>
              <span v-if="showStatsSkeleton" class="placeholder-glow d-block" aria-hidden="true">
                <span class="placeholder skeleton-placeholder skeleton-stat-value"></span>
              </span>
              <h3 v-else class="fw-bold mb-0">{{ stats.deactivated }}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="card manager-filter-card border-0 shadow-sm rounded-4 mb-4">
      <div class="card-body page-toolbar manager-filter-toolbar">
        <label class="search-input-wrapper flex-grow-1" aria-label="Search alumni">
          <span class="search-input-icon"><i class="bi bi-search"></i></span>
          <input v-model="searchModel" type="text" class="form-control-custom"
            placeholder="ស្វែងរកតាមឈ្មោះ, អ៊ីមែល ..." />
        </label>
        <div class="filter-tabs-wrapper" role="tablist" aria-label="Filter alumni status">
          <button type="button" role="tab" :aria-selected="activeTabModel === 'ALL'" @click="activeTabModel = 'ALL'"
            :class="['tab-btn', activeTabModel === 'ALL' ? 'active' : '']">
            <i class="bi bi-grid"></i><span>ទាំងអស់</span>
          </button>
          <button type="button" role="tab" :aria-selected="activeTabModel === 'PENDING'"
            @click="activeTabModel = 'PENDING'"
            :class="['tab-btn', activeTabModel === 'PENDING' ? 'active' : '']">
            <i class="bi bi-hourglass-split"></i><span>កំពុងរង់ចាំ</span>
          </button>
          <button type="button" role="tab" :aria-selected="activeTabModel === 'APPROVE'"
            @click="activeTabModel = 'APPROVE'"
            :class="['tab-btn', activeTabModel === 'APPROVE' ? 'active' : '']">
            <i class="bi bi-check2-circle"></i><span>យល់ព្រម</span>
          </button>
          <button type="button" role="tab" :aria-selected="activeTabModel === 'REJECT'"
            @click="activeTabModel = 'REJECT'"
            :class="['tab-btn', activeTabModel === 'REJECT' ? 'active' : '']">
            <i class="bi bi-slash-circle"></i><span>បានផ្អាកដំណើរការ</span>
          </button>
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
      <div v-if="showRefreshPlaceholder" class="manager-refresh-placeholder" aria-live="polite"
        aria-label="កំពុងធ្វើបច្ចុប្បន្នភាពទិន្នន័យអតីតនិស្សិត">
        <span class="placeholder-glow d-block" aria-hidden="true">
          <span class="placeholder skeleton-placeholder skeleton-refresh-line"></span>
        </span>
      </div>
      <div v-if="showTableSkeleton" class="manager-table-skeleton placeholder-glow" aria-busy="true" aria-live="polite"
        aria-label="កំពុងផ្ទុកទិន្នន័យអតីតនិស្សិត">
        <span class="visually-hidden">កំពុងផ្ទុក...</span>
        <div v-for="row in skeletonRows" :key="row" class="skeleton-table-row">
          <div class="skeleton-person-cell">
            <span class="placeholder skeleton-placeholder skeleton-avatar" aria-hidden="true"></span>
            <span class="skeleton-person-lines">
              <span class="placeholder skeleton-placeholder skeleton-line skeleton-line--name" aria-hidden="true"></span>
              <span class="placeholder skeleton-placeholder skeleton-line skeleton-line--email" aria-hidden="true"></span>
            </span>
          </div>
          <span class="placeholder skeleton-placeholder skeleton-line skeleton-line--id" aria-hidden="true"></span>
          <span class="placeholder skeleton-placeholder skeleton-pill" aria-hidden="true"></span>
          <span class="placeholder skeleton-placeholder skeleton-pill skeleton-pill--status" aria-hidden="true"></span>
          <div class="skeleton-actions-cell">
            <span class="placeholder skeleton-placeholder skeleton-action" aria-hidden="true"></span>
            <span class="placeholder skeleton-placeholder skeleton-action skeleton-action--icon" aria-hidden="true"></span>
          </div>
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
        <!-- Account email verification -->
        <template #cell-verify="{ item }">
          <span :class="['badge-status border', getVerifyClass(item)]">
            <i class="bi bi-circle-fill dot-icon"></i> {{ getVerifyLabel(item) }}
          </span>
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

      <div class="card-footer bg-white border-top d-flex flex-column flex-md-row align-items-center justify-content-between py-3 px-4" v-if="store.totalPages.value > 1">
        <span class="text-muted small me-2">ទំព័រ {{ store.currentPage.value }} នៃ {{ store.totalPages.value }}</span>
        <BasePage :currentPage="store.currentPage.value" :totalPages="store.totalPages.value"
          @change-page="handlePageChange" />
      </div>

    </div>
  </div>
  <!-- register modal have admin and alumni -->
  <BaseModal v-model="showAccountTypeModal" title="បង្កើតគណនីថ្មី" size="md" hideDefaultFooter>
    <div class="account-type-actions">
      <button type="button" class="account-type-btn" @click="store.openRegisterModal">
        <span class="account-type-btn__icon text-primary">
          <i class="bi bi-mortarboard-fill"></i>
        </span>
        <span>
          <span class="account-type-btn__title">Alumni Register</span>
          <span class="account-type-btn__text">បង្កើតគណនីអតីតនិស្សិត</span>
        </span>
      </button>
      <button type="button" class="account-type-btn" @click="store.openAdminRegisterModal">
        <span class="account-type-btn__icon text-success">
          <i class="bi bi-shield-lock-fill"></i>
        </span>
        <span>
          <span class="account-type-btn__title">Admin Register</span>
          <span class="account-type-btn__text">បង្កើតគណនីអ្នកគ្រប់គ្រង</span>
        </span>
      </button>
    </div>
  </BaseModal>


  <!--alumni Register Modal using BaseModal -->
  <BaseModal v-model="showRegisterModal" title="ចុះឈ្មោះអតីតនិស្សិត" size="lg" hideDefaultFooter>
    <form class="app-form register-modal-form" novalidate autocomplete="off" @submit.prevent="store.handleRegisterAlumni">
      <div>
        <label class="form-label fw-bold small">ឈ្មោះពេញលេញ *</label>
        <input v-model="store.registerForm.value.fullname" type="text" class="form-control"
          autocomplete="off"
          :class="{ 'is-invalid': store.registerErrors.value.fullname }" placeholder="បញ្ចូលឈ្មោះពេញលេញ" required
          @input="delete store.registerErrors.value.fullname" />
        <div v-if="store.registerErrors.value.fullname" class="invalid-feedback">
          {{ store.registerErrors.value.fullname }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">អ៊ីមែល *</label>
        <input v-model="store.registerForm.value.email" type="email" class="form-control"
          autocomplete="off"
          :class="{ 'is-invalid': store.registerErrors.value.email }" placeholder="បញ្ចូលអ៊ីមែល" required
          @input="delete store.registerErrors.value.email" />
        <div v-if="store.registerErrors.value.email" class="invalid-feedback">
          {{ store.registerErrors.value.email }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">លេខទូរស័ព្ទ</label>
        <input v-model="store.registerForm.value.phone" type="tel" class="form-control"
          autocomplete="off"
          placeholder="បញ្ចូលលេខទូរស័ព្ទ" />
      </div>

      <div>
        <label class="form-label fw-bold small">ពាក្យសម្ងាត់ </label>
        <div class="password-field">
          <input v-model="store.registerForm.value.password" :type="showPassword ? 'text' : 'password'"
            class="form-control password-field__input" autocomplete="new-password"
            :class="{ 'is-invalid': store.registerErrors.value.password }" placeholder="បញ្ចូលពាក្យសម្ងាត់" required
            @input="delete store.registerErrors.value.password" />
          <button type="button" class="password-field__toggle" :title="showPassword ? 'Hide password' : 'Show password'"
            :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
            <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <div v-if="store.registerErrors.value.password" class="invalid-feedback">
          {{ store.registerErrors.value.password }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">បញ្ជាក់ពាក្យសម្ងាត់ </label>
        <div class="password-field">
          <input v-model="store.registerForm.value.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
            class="form-control password-field__input" autocomplete="new-password"
            :class="{ 'is-invalid': store.registerErrors.value.confirmPassword }"
            placeholder="បញ្ចូលពាក្យសម្ងាត់ម្តងទៀត" required
            @input="delete store.registerErrors.value.confirmPassword" />
          <button type="button" class="password-field__toggle"
            :title="showConfirmPassword ? 'Hide password' : 'Show password'"
            :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
            @click="showConfirmPassword = !showConfirmPassword">
            <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <div v-if="store.registerErrors.value.confirmPassword" class="invalid-feedback">
          {{ store.registerErrors.value.confirmPassword }}
        </div>
      </div>
      <div>
        <label class="form-label fw-bold small">ជំនាន់ </label>
        <select v-model="store.registerForm.value.generationId" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.generationId }" required
          @change="delete store.registerErrors.value.generationId">
          <option value="" disabled>ជ្រើសរើសជំនាន់</option>
          <option v-for="generation in generationStore.generations.value" :key="generation.id" :value="generation.id">
            {{ generation.name }}
          </option>
        </select>
        <div v-if="store.registerErrors.value.generationId" class="invalid-feedback">
          {{ store.registerErrors.value.generationId }}
        </div>
      </div>
      <div>
        <label class="form-label fw-bold small">ដេប៉ាតឺម៉ង់ </label>
        <select v-model="store.registerForm.value.departmentId" class="form-control"
          :class="{ 'is-invalid': store.registerErrors.value.departmentId }" required
          @change="delete store.registerErrors.value.departmentId">
          <option value="" disabled>ជ្រើសរើសដេប៉ាតឺម៉ង់</option>
          <option v-for="department in filteredDepartments" :key="department.id" :value="department.id">
            {{ department.name }}
          </option>

        </select>
        <div v-if="store.registerErrors.value.departmentId" class="invalid-feedback">
          {{ store.registerErrors.value.departmentId }}
        </div>
      </div>



      <div>
        <label class="form-label fw-bold small">ស្ថានភាព *</label>
        <select v-model="store.registerForm.value.status" class="form-control" required>
          <option value="PENDING">កំពុងរង់ចាំ</option>
          <option value="APPROVE">យល់ព្រម</option>
          <option value="REJECT">បានផ្អាកដំណើរការ</option>
        </select>
      </div>

      <div class="form-field--full">
        <label class="form-label fw-bold small">មុខរបរបច្ចុប្បន្ន</label>
        <input v-model="store.registerForm.value.currentJob" type="text" class="form-control"
          placeholder="បញ្ចូលមុខរបរបច្ចុប្បន្ន" />
      </div>

      <div class="form-field--full">
        <label class="form-label fw-bold small">ជីវប្រវត្តិ</label>
        <textarea v-model="store.registerForm.value.bio" class="form-control" rows="3"
          placeholder="បញ្ចូលជីវប្រវត្តិខ្លីៗ"></textarea>
      </div>

      <div class="modal-actions">
        <BaseButton variant="secondary" @click="store.closeRegisterModal" class="flex-grow-1">
          បិទ
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="store.isLoading.value" :loading="store.isLoading.value"
          class="flex-grow-1">
          ចុះឈ្មោះ
        </BaseButton>
      </div>
    </form>
  </BaseModal>
  <!-- admin register modal uaing BaseModal -->
  <BaseModal v-model="showAdminRegisterModal" title="ចុះឈ្មោះអ្នកគ្រប់គ្រង" size="lg" hideDefaultFooter>
    <form class="app-form register-modal-form" novalidate autocomplete="off" @submit.prevent="store.handleRegisterAdmin">
      <div>
        <label class="form-label fw-bold small">ឈ្មោះពេញលេញ *</label>
        <input v-model="store.adminRegisterForm.value.fullname" type="text" class="form-control"
          autocomplete="off" :class="{ 'is-invalid': store.adminRegisterErrors.value.fullname }"
          placeholder="បញ្ចូលឈ្មោះពេញលេញ" required
          @input="delete store.adminRegisterErrors.value.fullname" />
        <div v-if="store.adminRegisterErrors.value.fullname" class="invalid-feedback">
          {{ store.adminRegisterErrors.value.fullname }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">អ៊ីមែល *</label>
        <input v-model="store.adminRegisterForm.value.email" type="email" class="form-control"
          autocomplete="off" :class="{ 'is-invalid': store.adminRegisterErrors.value.email }"
          placeholder="បញ្ចូលអ៊ីមែល" required
          @input="delete store.adminRegisterErrors.value.email" />
        <div v-if="store.adminRegisterErrors.value.email" class="invalid-feedback">
          {{ store.adminRegisterErrors.value.email }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">លេខទូរស័ព្ទ</label>
        <input v-model="store.adminRegisterForm.value.phone" type="tel" class="form-control"
          autocomplete="off" placeholder="បញ្ចូលលេខទូរស័ព្ទ" />
      </div>

      <div>
        <label class="form-label fw-bold small">ពាក្យសម្ងាត់ *</label>
        <div class="password-field">
          <input v-model="store.adminRegisterForm.value.password" :type="showAdminPassword ? 'text' : 'password'"
            class="form-control password-field__input" autocomplete="new-password"
            :class="{ 'is-invalid': store.adminRegisterErrors.value.password }"
            placeholder="បញ្ចូលពាក្យសម្ងាត់" required
            @input="delete store.adminRegisterErrors.value.password" />
          <button type="button" class="password-field__toggle"
            :title="showAdminPassword ? 'Hide password' : 'Show password'"
            :aria-label="showAdminPassword ? 'Hide password' : 'Show password'"
            @click="showAdminPassword = !showAdminPassword">
            <i :class="showAdminPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <div v-if="store.adminRegisterErrors.value.password" class="invalid-feedback">
          {{ store.adminRegisterErrors.value.password }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">បញ្ជាក់ពាក្យសម្ងាត់ *</label>
        <div class="password-field">
          <input v-model="store.adminRegisterForm.value.confirmPassword"
            :type="showAdminConfirmPassword ? 'text' : 'password'" class="form-control password-field__input"
            autocomplete="new-password" :class="{ 'is-invalid': store.adminRegisterErrors.value.confirmPassword }"
            placeholder="បញ្ចូលពាក្យសម្ងាត់ម្តងទៀត" required
            @input="delete store.adminRegisterErrors.value.confirmPassword" />
          <button type="button" class="password-field__toggle"
            :title="showAdminConfirmPassword ? 'Hide password' : 'Show password'"
            :aria-label="showAdminConfirmPassword ? 'Hide password' : 'Show password'"
            @click="showAdminConfirmPassword = !showAdminConfirmPassword">
            <i :class="showAdminConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
        </div>
        <div v-if="store.adminRegisterErrors.value.confirmPassword" class="invalid-feedback">
          {{ store.adminRegisterErrors.value.confirmPassword }}
        </div>
      </div>

      <div>
        <label class="form-label fw-bold small">ស្ថានភាព *</label>
        <select v-model="store.adminRegisterForm.value.status" class="form-control"
          :class="{ 'is-invalid': store.adminRegisterErrors.value.status }" required
          @change="delete store.adminRegisterErrors.value.status">
          <option value="PENDING">កំពុងរង់ចាំ</option>
          <option value="APPROVE">យល់ព្រម</option>
          <option value="REJECT">បានផ្អាកដំណើរការ</option>
        </select>
        <div v-if="store.adminRegisterErrors.value.status" class="invalid-feedback">
          {{ store.adminRegisterErrors.value.status }}
        </div>
      </div>

      <div class="form-field--full">
        <label class="form-label fw-bold small">មុខរបរបច្ចុប្បន្ន</label>
        <input v-model="store.adminRegisterForm.value.currentJob" type="text" class="form-control"
          placeholder="បញ្ចូលមុខរបរបច្ចុប្បន្ន" />
      </div>

      <div class="form-field--full">
        <label class="form-label fw-bold small">ជីវប្រវត្តិ</label>
        <textarea v-model="store.adminRegisterForm.value.bio" class="form-control" rows="3"
          placeholder="បញ្ចូលជីវប្រវត្តិខ្លីៗ"></textarea>
      </div>

      <div class="modal-actions">
        <BaseButton variant="secondary" @click="store.closeAdminRegisterModal" class="flex-grow-1">
          បិទ
        </BaseButton>
        <BaseButton type="submit" variant="primary" :disabled="store.isLoading.value" :loading="store.isLoading.value"
          class="flex-grow-1">
          បង្កើត Admin
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

.manager-page-toolbar,
.manager-table-header {
  gap: 1rem;
  flex-wrap: wrap;
}

.manager-filter-toolbar {
  gap: 1rem;
  align-items: center;
  padding: 0.75rem;
}

.manager-filter-card {
  border: 1px solid rgba(226, 232, 240, 0.9) !important;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
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
  padding: 0;
  font-size: 14px;
  color: #0f172a;
}

.form-control-custom::placeholder {
  color: #94a3b8;
}

.search-input-wrapper {
  min-height: 52px;
  margin: 0;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  min-width: 0;
  /* width: 100%; */
  box-shadow: inset 0 1px 0 rgba(15, 23, 42, 0.02);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.search-input-wrapper:hover,
.search-input-wrapper:focus-within {
  border-color: rgba(33, 100, 119, 0.35);
  background: #fbfdff;
  box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.08);
}

.search-input-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #f0f7f9;
  color: #216477;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.filter-tabs-wrapper {
  padding: 0.35rem;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f1f5f9;
  display: flex;
  max-width: 100%;
  flex-wrap: wrap;
  gap: 0.35rem;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
}

.tab-btn {
  border: none;
  background: transparent;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  transition: color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #216477;
  background: rgba(255, 255, 255, 0.65);
}

.tab-btn.active {
  background: #ffffff;
  color: #216477;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.tab-btn i {
  font-size: 14px;
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

.skeleton-placeholder {
  position: relative;
  display: block;
  overflow: hidden;
  background: #e5e7eb;
  border-radius: 999px;
}

.skeleton-placeholder::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.65), transparent);
  animation: skeleton-shimmer 1.35s ease-in-out infinite;
}

.skeleton-stat-value {
  width: 58px;
  height: 32px;
  margin-top: 0.2rem;
}

.manager-refresh-placeholder {
  padding: 0 1.5rem 0.75rem;
}

.skeleton-refresh-line {
  width: 100%;
  height: 3px;
  border-radius: 999px;
}

.manager-table-skeleton {
  display: grid;
  min-width: 720px;
}

.skeleton-table-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.9fr) minmax(72px, 0.65fr) minmax(110px, 0.8fr) minmax(140px, 1fr) minmax(150px, 0.9fr);
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #edf2f7;
}

.skeleton-table-row:first-child {
  border-top: 0;
}

.skeleton-person-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.skeleton-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 50%;
}

.skeleton-person-lines {
  display: grid;
  gap: 0.45rem;
  width: 100%;
  min-width: 0;
}

.skeleton-line {
  height: 12px;
}

.skeleton-line--name {
  width: min(190px, 72%);
}

.skeleton-line--email {
  width: min(240px, 88%);
  height: 10px;
}

.skeleton-line--id {
  width: 56px;
}

.skeleton-pill {
  width: 88px;
  height: 24px;
}

.skeleton-pill--status {
  width: 120px;
}

.skeleton-actions-cell {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.skeleton-action {
  width: 88px;
  height: 32px;
  border-radius: 8px;
}

.skeleton-action--icon {
  width: 34px;
}

@keyframes skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.smaller {
  font-size: 11px;
}

.account-type-actions {
  display: grid;
  gap: 0.75rem;
}

.account-type-btn {
  width: 100%;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  text-align: left;
  color: #0f172a;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.account-type-btn:hover {
  border-color: rgba(33, 100, 119, 0.35);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.account-type-btn:focus-visible {
  outline: 2px solid rgba(33, 100, 119, 0.35);
  outline-offset: 2px;
}

.account-type-btn__icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #f8fafc;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-size: 18px;
}

.account-type-btn__title,
.account-type-btn__text {
  display: block;
}

.account-type-btn__title {
  font-weight: 800;
  font-size: 14px;
}

.account-type-btn__text {
  color: #64748b;
  font-size: 12px;
  margin-top: 0.15rem;
}

.register-modal-form {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
}

.register-modal-form .form-field--full,
.register-modal-form .modal-actions {
  grid-column: 1 / -1;
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
    flex-direction: column;
    padding: 0.75rem;
  }

  .search-input-wrapper {
    min-height: 48px;
  }

  .filter-tabs-wrapper {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .manager-refresh-placeholder {
    padding: 0 1rem 0.75rem;
  }

  .manager-table-skeleton {
    min-width: 0;
  }

  .skeleton-table-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
  }

  .skeleton-actions-cell {
    justify-content: flex-start;
  }

  .tab-btn {
    width: 100%;
    min-height: 44px;
    padding: 6px 10px;
    text-align: center;
    line-height: 1.25;
    white-space: normal;
  }

  .register-modal-form {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-placeholder::after {
    animation: none;
  }
}

.password-field {
  position: relative;
}

.password-field__input {
  padding-right: 42px;
}

.password-field__toggle {
  position: absolute;
  top: 50%;
  right: 8px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
}

.password-field__toggle:hover {
  color: #216477;
  background: #f3f4f6;
}

.password-field__toggle:focus-visible {
  outline: 2px solid rgba(33, 100, 119, 0.35);
  outline-offset: 2px;
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

.form-control::placeholder {
  color: #9ca3af;
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
