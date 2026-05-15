<script setup>
import { onMounted, watch, ref, reactive } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import BaseModal from '@/components/UI/Base/BaseModal.vue';
import BasePage from '@/components/UI/Base/BasePage.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';

const store = useCategoryStore();

// --- ស្ថានភាព Modal ---
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const form = reactive({ name: '', description: '' });
const errors = reactive({ name: '' });

onMounted(() => store.fetchCategories());

// តាមដាន (Watch) លើការស្វែងរក
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

// តក្កវិជ្ជា Modal (Modal Logic)
const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    form.name = ''; form.description = '';
    errors.name = '';
    isModalOpen.value = true;
};

const openEditModal = (cat) => {
    isEditing.value = true;
    currentId.value = cat.id;
    form.name = cat.name;
    form.description = cat.description;
    errors.name = '';
    isModalOpen.value = true;
};

const validateForm = () => {
    errors.name = '';
    form.name = form.name.trim();

    if (!form.name) {
        errors.name = 'សូមបញ្ចូលឈ្មោះប្រភេទ';
    }

    return !errors.name;
};

const handleSubmit = async () => {
    if (!validateForm()) return;

    const success = isEditing.value
        ? await store.updateCategory(currentId.value, { ...form })
        : await store.createCategory({ ...form });
    if (success) isModalOpen.value = false;
};
</script>

<template>
    <div class="category-page min-vh-100">
        <!-- ផ្នែកក្បាល (Header Section) -->
        <div class="category-header header-card page-toolbar mb-4 p-4 rounded-4 shadow-sm border-0 bg-white">
            <div>
                <h2 class="fw-bold text-dark mb-1">ប្រភេទ</h2>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item small"><a href="#"
                                class="text-decoration-none text-muted">ផ្ទាំងគ្រប់គ្រង</a></li>
                        <li class="breadcrumb-item active small fw-bold text-primary">ប្រភេទ</li>
                    </ol>
                </nav>
            </div>
            <BaseButton @click="openAddModal" variant="primary">
                <i class="bi bi-plus-lg me-2"></i>ប្រភេទថ្មី
            </BaseButton>
        </div>

        <!-- របារស្វែងរក (Search Bar) -->
        <div class="row mb-4">
            <div class="col-md-5 col-lg-4">
                <div class="search-box-custom app-search-box rounded-pill px-3 d-flex align-items-center shadow-sm">
                    <i class="bi bi-search text-muted"></i>
                    <input v-model="store.queryParams.search" type="text" class="form-control border-0 shadow-none py-2"
                        placeholder="ស្វែងរក...">
                </div>
            </div>
        </div>

        <!-- ផ្នែកបង្ហាញទិន្នន័យ (Grid Section) -->
        <div v-if="store.isLoading" class="app-state">
            <div>
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3 mb-0 fw-medium">កំពុងទាញយកទិន្នន័យ...</p>
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
                            aria-label="Edit category">
                            <i class="bi bi-pencil-square text-info"></i>
                        </BaseButton>
                        <BaseButton @click="store.deleteCategory(item.id)" variant="danger" size="sm" shape="sharp"
                            title="លុប" aria-label="Delete category">
                            <i class="bi bi-trash text-light"></i>
                        </BaseButton>
                    </div>
                </template>
            </BaseTable>
        </div>

        <!-- ការបែងចែកទំព័រ (Pagination) -->
        <div class="category-pagination page-toolbar mt-5">
            <p class="small text-muted mb-0">សរុប: {{ store.totalItems }} ប្រភេទ</p>
            <BasePage :currentPage="store.queryParams._page" :totalPages="store.totalPages"
                @change-page="handlePageChange" />
        </div>

        <!-- ការប្រើប្រាស់ BaseModal -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'កែប្រែប្រភេទ' : 'ប្រភេទថ្មី'" hide-default-footer>
            <form class="app-form" novalidate @submit.prevent="handleSubmit">
                <div>
                    <label class="form-label small fw-bold text-muted text-uppercase">ឈ្មោះ *</label>
                    <input v-model="form.name" type="text" class="form-control py-2 rounded-3 border-2"
                        :class="{ 'is-invalid': errors.name }" placeholder="បញ្ចូលឈ្មោះប្រភេទ..." required
                        @input="errors.name = ''" @blur="validateForm">
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>
                <div>
                    <label class="form-label small fw-bold text-muted text-uppercase">ការពិពណ៌នា</label>
                    <textarea v-model="form.description" class="form-control rounded-3 border-2" rows="4"
                        placeholder="បញ្ចូលព័ត៌មានលម្អិត..."></textarea>
                </div>
            </form>

            <template #footer>
                <div class="modal-actions">
                    <button type="button" class="btn btn-light rounded-pill px-4 fw-medium"
                        @click="isModalOpen = false">បោះបង់</button>
                    <button type="button" class="btn btn-primary-custom rounded-pill px-4 fw-medium"
                        @click="handleSubmit" :disabled="store.isLoading">
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

.line-clamp-3 {
    display: -webkit-box;
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
}
</style>
