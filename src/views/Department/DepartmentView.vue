<script setup>
import { onMounted, watch, ref, reactive } from 'vue';
import { useDepartmentStore } from '@/stores/departmentStore';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';
import BaseModal from '@/components/UI/Base/BaseModal.vue';
import BasePage from '@/components/UI/Base/BasePage.vue';

const store = useDepartmentStore();

// --- STATE សម្រាប់គ្រប់គ្រង Modal ---
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);

const form = reactive({
    name: '',
    description: ''
});
const errors = reactive({ name: '' });

const tableColumns = [
    { key: 'id', label: 'ល.រ' },
    { key: 'name', label: 'ឈ្មោះដេប៉ាតឺម៉ង់' },
    { key: 'description', label: 'ការពិពណ៌នា' },
    { key: 'actions', label: 'សកម្មភាព' }
];
const skeletonRows = Array.from({ length: 6 }, (_, index) => index);

onMounted(() => {
    store.fetchDepartments();
});

watch(() => store.queryParams.search, () => {
    store.queryParams._page = 1;
    store.fetchDepartments();
});

const handlePageChange = (page) => {
    store.queryParams._page = page;
    store.fetchDepartments();
};

const handleDeleteDepartment = async (dept) => {
    await store.deleteDepartment(dept.id);
};

const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    form.name = '';
    form.description = '';
    errors.name = '';
    isModalOpen.value = true;
};

const openEditModal = (dept) => {
    isEditing.value = true;
    currentId.value = dept.id;
    form.name = dept.name;
    form.description = dept.description;
    errors.name = '';
    isModalOpen.value = true;
};

const validateForm = () => {
    errors.name = '';
    form.name = form.name.trim();

    if (!form.name) {
        errors.name = 'សូមបញ្ចូលឈ្មោះដេប៉ាតឺម៉ង់';
    }

    return !errors.name;
};

const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = isEditing.value
        ? await store.updateDepartment(currentId.value, { ...form })
        : await store.createDepartment({ ...form });

    if (success) {
        isModalOpen.value = false;
    }
};
</script>

<template>
    <div class="department-page">
        <!-- --- របារទីតាំង / ចំណងជើងទំព័រ --- -->
        <div class="department-toolbar page-toolbar mb-4">
            <div>
                <h3 class="fw-bold text-dark mb-1">ដេប៉ាតឺម៉ង់សិក្សា</h3>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item"><a href="#" class="text-decoration-none">ផ្ទាំងគ្រប់គ្រង</a></li>
                        <li class="breadcrumb-item active">ដេប៉ាតឺម៉ង់</li>
                    </ol>
                </nav>
            </div>
            <BaseButton @click="openAddModal" variant="primary">
                <i class="bi bi-plus-circle me-2"></i>បង្កើតថ្មី
            </BaseButton>
        </div>

        <!-- --- កាតមាតិកាចម្បង --- -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="card-header bg-white border-bottom py-3 px-4">
                <div class="department-card-header row align-items-center g-3">
                    <div class="col-md-4">
                        <h5 class="mb-0 fw-bold text-secondary">បញ្ជីដេប៉ាតឺម៉ង់</h5>
                    </div>
                    <div class="col-md-8">
                        <div class="search-box department-search">
                            <div class="input-group search-group rounded-pill overflow-hidden border">
                                <span class="input-group-text bg-white border-0"><i
                                        class="bi bi-search text-muted"></i></span>
                                <input v-model="store.queryParams.search" type="text"
                                    class="form-control border-0 shadow-none ps-0" placeholder="ស្វែងរកដេប៉ាតឺម៉ង់...">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-body p-0">
                <div v-if="store.isLoading" class="department-skeleton" aria-busy="true" aria-live="polite"
                    aria-label="កំពុងផ្ទុកទិន្នន័យដេប៉ាតឺម៉ង់">
                    <div class="department-skeleton__header">
                        <span v-for="column in tableColumns" :key="column.key"
                            class="skeleton-placeholder skeleton-heading"></span>
                    </div>
                    <div v-for="row in skeletonRows" :key="row" class="department-skeleton__row">
                        <span class="skeleton-placeholder skeleton-id"></span>
                        <span class="skeleton-placeholder skeleton-line skeleton-line--name"></span>
                        <span class="skeleton-description-lines">
                            <span class="skeleton-placeholder skeleton-line skeleton-line--description"></span>
                            <span class="skeleton-placeholder skeleton-line skeleton-line--description-short"></span>
                        </span>
                        <span class="skeleton-actions">
                            <span class="skeleton-placeholder skeleton-action"></span>
                            <span class="skeleton-placeholder skeleton-action"></span>
                        </span>
                    </div>
                </div>

                <div v-else-if="store.departments.length === 0" class="app-state">
                    <div>
                        <div class="app-state__icon"><i class="bi bi-building"></i></div>
                        <p class="mb-0">រកមិនឃើញដេប៉ាតឺម៉ង់ទេ.</p>
                    </div>
                </div>

                <BaseTable v-else :columns="tableColumns" :data="store.departments">
                    <template #cell-id="{ item }">
                        <span class="badge bg-light text-dark border">#{{ item.id }}</span>
                    </template>

                    <template #cell-name="{ item }">
                        <div class="fw-bold text-dark">{{ item.name }}</div>
                    </template>

                    <template #cell-description="{ item }">
                        <div class="text-truncate text-muted" style="max-width: 300px;">
                            {{ item.description || '— គ្មានការពិពណ៌នា —' }}
                        </div>
                    </template>

                    <template #cell-actions="{ item }">
                        <div class="action-btns text-end pe-4">
                            <BaseButton @click="openEditModal(item)" variant="light" size="sm" shape="sharp"
                                title="កែប្រែ" aria-label="Edit department">
                                <i class="bi bi-pencil-square fs-6 text-info"></i>
                            </BaseButton>
                            <BaseButton @click="handleDeleteDepartment(item)" variant="danger" size="sm" shape="sharp"
                                title="លុប" aria-label="Delete department">
                                <i class="bi bi-trash3 fs-6 text-light"></i>
                            </BaseButton>
                        </div>
                    </template>
                </BaseTable>
            </div>

            <!-- ផ្នែកខាងក្រោម / ការបែងចែកទំព័រ -->
            <div class="card-footer bg-white border-top d-flex flex-column flex-md-row align-items-center justify-content-between py-3 px-4">
                <div class="text-muted small fw-medium  mb-2">
                    បង្ហាញដេប៉ាតឺម៉ង់សរុប
                    <span v-if="store.isLoading" class="skeleton-placeholder skeleton-total"></span>
                    <span v-else class="text-dark fw-bold">{{ store.totalItems }}</span>
                </div>
                <BasePage :currentPage="store.queryParams._page" :totalPages="store.totalPages"
                    @change-page="handlePageChange" />
            </div>
        </div>

        <!-- ប្រើប្រាស់ BaseModal សម្រាប់ទម្រង់បញ្ចូលទិន្នន័យ -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'កែប្រែដេប៉ាតឺម៉ង់' : 'បង្កើតដេប៉ាតឺម៉ង់ថ្មី'" size="md">
            <template #default>
                <form id="department-form" class="app-form" novalidate @submit.prevent="handleSubmit">
                    <div class="app-form">
                        <div>
                            <label class="form-label small fw-bold text-muted">ឈ្មោះដេប៉ាតឺម៉ង់</label>
                            <input v-model="form.name" type="text" class="form-control custom-input py-2"
                                :class="{ 'is-invalid': errors.name }" placeholder="បញ្ចូលឈ្មោះដេប៉ាតឺម៉ង់..." required
                                @input="errors.name = ''" @blur="validateForm">
                            <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                        </div>
                        <div>
                            <label class="form-label small fw-bold text-muted">ការពិពណ៌នា </label>
                            <textarea v-model="form.description" class="form-control custom-input" rows="4"
                                placeholder="បន្ថែមព័ត៌មានលម្អិតអំពីដេប៉ាតឺម៉ង់នេះ..."></textarea>
                        </div>
                    </div>
                </form>
            </template>

            <template #footer>
                <div class="modal-actions">
                    <BaseButton variant="light" @click="isModalOpen = false">បោះបង់</BaseButton>
                    <BaseButton type="submit" form="department-form" variant="primary" :disabled="store.isLoading"
                        :loading="store.isLoading">
                        {{ isEditing ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'បង្កើតដេប៉ាតឺម៉ង់' }}
                    </BaseButton>
                </div>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
.department-page {
    background-color: #f8fafc;
    min-height: 100vh;
    padding: 1rem;
}

.department-toolbar {
    gap: 1rem;
    flex-wrap: wrap;
}

.department-card-header {
    row-gap: 0.75rem;
}

.department-search {
    width: 100%;
    max-width: 320px;
    margin-left: auto;
}

/* ប្រអប់ស្វែងរក */
.search-group {
    width: 100%;
    transition: all 0.3s ease;
}

.search-group:focus-within {
    border-color: #216477 !important;
    box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.1);
}

.department-skeleton {
    overflow-x: auto;
}

.department-skeleton__header,
.department-skeleton__row {
    display: grid;
    grid-template-columns: minmax(80px, 0.45fr) minmax(190px, 1fr) minmax(260px, 1.4fr) minmax(120px, 0.55fr);
    align-items: center;
    gap: 1rem;
    min-width: 720px;
}

.department-skeleton__header {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #edf2f7;
}

.department-skeleton__row {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #edf2f7;
}

.department-skeleton__row:last-child {
    border-bottom: 0;
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

.skeleton-heading {
    width: 72px;
    height: 12px;
}

.skeleton-id {
    width: 52px;
    height: 24px;
}

.skeleton-line {
    height: 13px;
}

.skeleton-line--name {
    width: min(190px, 78%);
}

.skeleton-description-lines {
    display: grid;
    gap: 0.45rem;
    width: 100%;
}

.skeleton-line--description {
    width: min(300px, 92%);
}

.skeleton-line--description-short {
    width: min(210px, 68%);
    height: 11px;
}

.skeleton-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
}

.skeleton-action {
    width: 34px;
    height: 34px;
    border-radius: 8px;
}

.skeleton-total {
    display: inline-block;
    width: 34px;
    height: 13px;
    margin-left: 0.35rem;
    vertical-align: -2px;
}

@keyframes skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}

.custom-input {
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    transition: all 0.2s;
}

.custom-input:focus {
    border-color: #216477;
    box-shadow: none;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 768px) {
    .department-page {
        padding: 0;
    }

    .department-search {
        max-width: none;
        margin-left: 0;
    }

    .department-skeleton {
        overflow-x: hidden;
    }

    .department-skeleton__header {
        display: none;
    }

    .department-skeleton__row {
        grid-template-columns: 1fr;
        min-width: 0;
        gap: 0.75rem;
        padding: 1rem;
    }

    .skeleton-actions {
        justify-content: flex-start;
    }
}

@media (prefers-reduced-motion: reduce) {
    .skeleton-placeholder::after {
        animation: none;
    }
}
</style>
