<script setup>
import { onMounted, watch, ref, reactive } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import BaseModal from '@/components/UI/Base/BaseModal.vue';
import BasePage from '@/components/UI/Base/BasePage.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';

const store = useCategoryStore();

const isModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const form = reactive({ name: '', description: '' });
const errors = reactive({ name: '', description: '' });
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

onMounted(() => store.fetchCategories());


watch(() => store.queryParams.search, () => {
    store.queryParams._page = 1;
    store.fetchCategories();
});

const handlePageChange = (page) => {
    store.queryParams._page = page;
    store.fetchCategories();
};

const columns = [
    { key: 'name', label: 'ឈ្មោះ' },
    { key: 'description', label: 'ការពិពណ៌នា' },
    { key: 'actions', label: 'សកម្មភាព' }
];
const skeletonRows = Array.from({ length: 6 }, (_, index) => index);

// តក្កវិជ្ជា Modal (Modal Logic)
const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    form.name = ''; form.description = '';
    errors.name = '';
    errors.description = '';
    isModalOpen.value = true;
};

const openEditModal = (cat) => {
    isEditing.value = true;
    currentId.value = cat.id;
    form.name = cat.name;
    form.description = cat.description;
    errors.name = '';
    errors.description = '';
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
};

const validateForm = () => {
    errors.name = '';
    errors.description = '';
    form.name = form.name.trim();
    form.description = String(form.description || '').trim();

    if (!form.name) {
        errors.name = 'សូមបញ្ចូលឈ្មោះប្រភេទ';
    } else if (form.name.length > NAME_MAX_LENGTH) {
        errors.name = `ឈ្មោះប្រភេទមិនអាចលើស ${NAME_MAX_LENGTH} តួអក្សរបានទេ`;
    }

    if (form.description.length > DESCRIPTION_MAX_LENGTH) {
        errors.description = `ការពិពណ៌នាមិនអាចលើស ${DESCRIPTION_MAX_LENGTH} តួអក្សរបានទេ`;
    }

    return !errors.name && !errors.description;
};

const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = isEditing.value
        ? await store.updateCategory(currentId.value, { ...form })
        : await store.createCategory({ ...form });
    if (success) closeModal();
};
</script>

<template>
    <div class="category-page min-vh-100">
        <div class="category-header header-card page-toolbar mb-4 p-4 rounded-4 shadow-sm border-0 bg-white">
            <div>
                <h2 class="fw-bold text-dark mb-1">ប្រភេទ</h2>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item small">
                            <router-link to="/dashboard" class="text-decoration-none text-muted">ផ្ទាំងគ្រប់គ្រង</router-link>
                        </li>
                        <li class="breadcrumb-item active small fw-bold text-primary">ប្រភេទ</li>
                    </ol>
                </nav>
            </div>
            <BaseButton @click="openAddModal" variant="primary">
                <i class="bi bi-plus-lg me-2"></i>ប្រភេទថ្មី
            </BaseButton>
        </div>


        <div class="row mb-4">
            <div class="col-md-5 col-lg-4">
                <div class="search-box-custom app-search-box rounded-pill px-3 d-flex align-items-center shadow-sm">
                    <i class="bi bi-search text-muted"></i>
                    <input v-model="store.queryParams.search" type="text" class="form-control border-0 shadow-none py-2"
                        placeholder="ស្វែងរក...">
                </div>
            </div>
        </div>


        <div v-if="store.isLoading" class="category-skeleton-card bg-white rounded-4 shadow-sm border"
            aria-busy="true" aria-live="polite" aria-label="កំពុងផ្ទុកទិន្នន័យប្រភេទ">
            <div class="category-skeleton-header">
                <span v-for="column in columns" :key="column.key" class="skeleton-placeholder skeleton-heading"></span>
            </div>
            <div class="category-table-skeleton">
                <div v-for="row in skeletonRows" :key="row" class="category-skeleton-row">
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
        </div>

        <div v-else>
            <BaseTable :columns="columns" :data="store.categories">
                <template #cell-description="{ item }">
                    <p class="text-muted small mb-0 line-clamp-3">{{ item.description || 'មិនមានការពិពណ៌នាទេ។' }}</p>
                </template>
                <template #cell-actions="{ item }">
                    <div class="btn-group">
                        <BaseButton @click="openEditModal(item)" variant="light" size="sm" shape="sharp" title="កែប្រែ"
                            aria-label="កែប្រែប្រភេទ">
                            <i class="bi bi-pencil-square text-info"></i>
                        </BaseButton>
                        <BaseButton @click="store.deleteCategory(item.id)" variant="danger" size="sm" shape="sharp"
                            title="លុប" aria-label="លុបប្រភេទ">
                            <i class="bi bi-trash text-light"></i>
                        </BaseButton>
                    </div>
                </template>
            </BaseTable>
        </div>


        <div class="category-pagination page-toolbar p-4 d-flex flex-column flex-md-row align-items-center justify-content-between bg-white border-0 rounded-4 shadow-sm">
            <p class="small text-muted mb-0">
                សរុប:
                <span v-if="store.isLoading" class="skeleton-placeholder skeleton-total"></span>
                <span v-else>{{ store.totalItems }}</span>
                ប្រភេទ
            </p>
            <BasePage :currentPage="store.queryParams._page" :totalPages="store.totalPages"
                @change-page="handlePageChange" />
        </div>

        <!-- ការប្រើប្រាស់ BaseModal -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'កែប្រែប្រភេទ' : 'ប្រភេទថ្មី'" hide-default-footer>
            <form id="category-form" class="app-form" novalidate @submit.prevent="handleSubmit">
                <div>
                    <label class="form-label small fw-bold text-muted text-uppercase">ឈ្មោះ *</label>
                    <input v-model="form.name" type="text" class="form-control py-2 rounded-3 border-2"
                        :class="{ 'is-invalid': errors.name }" placeholder="បញ្ចូលឈ្មោះប្រភេទ..." required
                        :maxlength="NAME_MAX_LENGTH"
                        @input="errors.name = ''" @blur="validateForm">
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>
                <div>
                    <label class="form-label small fw-bold text-muted text-uppercase">ការពិពណ៌នា</label>
                    <textarea v-model="form.description" class="form-control rounded-3 border-2" rows="4"
                        :class="{ 'is-invalid': errors.description }"
                        :maxlength="DESCRIPTION_MAX_LENGTH"
                        placeholder="បញ្ចូលព័ត៌មានលម្អិត..."
                        @input="errors.description = ''" @blur="validateForm"></textarea>
                    <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}</div>
                </div>
            </form>

            <template #footer>
                <div class="modal-actions">
                    <button type="button" class="btn btn-light rounded-pill px-4 fw-medium"
                        @click="closeModal">បោះបង់</button>
                    <button type="submit" form="category-form"
                        class="btn btn-primary-custom rounded-pill px-4 fw-medium" :disabled="store.isLoading">
                        <span v-if="store.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                        {{ isEditing ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'បង្កើតប្រភេទ' }}
                    </button>
                </div>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
.category-page {
    background-color: #f8fafc;
    padding: 1rem;
}

.category-header,
.category-pagination {
    gap: 1rem;
    flex-wrap: wrap;
}

.search-box-custom:focus-within {
    border-color: #216477 !important;
}

.category-skeleton-card {
    overflow-x: auto;
}

.category-skeleton-header,
.category-skeleton-row {
    display: grid;
    grid-template-columns: minmax(190px, 1fr) minmax(260px, 1.4fr) minmax(120px, 0.55fr);
    align-items: center;
    gap: 1rem;
    min-width: 640px;
}

.category-skeleton-header {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #edf2f7;
}

.category-skeleton-row {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #edf2f7;
}

.category-skeleton-row:last-child {
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

.skeleton-line {
    height: 13px;
}

.skeleton-line--name {
    width: min(180px, 78%);
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
    width: min(200px, 68%);
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
    margin: 0 0.25rem;
    vertical-align: -2px;
}

@keyframes skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}

.line-clamp-3 {
    display: -webkit-box;
    line-clamp: 3;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@media (max-width: 768px) {
    .category-page {
        padding: 0;
    }

    .category-header,
    .category-pagination {
        align-items: stretch;
    }

    .category-header .btn,
    .category-pagination :deep(.pagination-wrap) {
        width: 100%;
    }

    .category-skeleton-card {
        overflow-x: hidden;
    }

    .category-skeleton-header {
        display: none;
    }

    .category-skeleton-row {
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
