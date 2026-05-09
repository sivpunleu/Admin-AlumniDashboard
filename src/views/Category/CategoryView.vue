<script setup>
import { onMounted, watch, ref, reactive } from 'vue';
import { useCategoryStore } from '@/stores/categoryStore';
import BaseModal from '@/components/UI/Base/BaseModal.vue';
import BasePage from '@/components/UI/Base/BasePage.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';

const store = useCategoryStore();

// --- Modal State ---
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const form = reactive({ name: '', description: '' });
const errors = reactive({ name: '' });

onMounted(() => store.fetchCategories());

// Watch លើការស្វែងរក
watch(() => store.queryParams.search, () => {
    store.queryParams._page = 1;
    store.fetchCategories();
});

const handlePageChange = (page) => {
    store.queryParams._page = page;
    store.fetchCategories();
};

const columns = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'actions', label: 'Actions' }
];

// Modal Logic
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
    <div class="category-page p-4 min-vh-100">
        <!-- Header Section -->
        <div class="header-card page-toolbar mb-4 p-4 rounded-4 shadow-sm border-0 bg-white">
            <div>
                <h2 class="fw-bold text-dark mb-1">Categories</h2>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item small"><a href="#"
                                class="text-decoration-none text-muted">Dashboard</a></li>
                        <li class="breadcrumb-item active small fw-bold text-primary">Categories</li>
                    </ol>
                </nav>
            </div>
            <button @click="openAddModal" class="btn btn-primary-custom px-4 py-2 rounded-pill shadow-sm">
                <i class="bi bi-plus-lg me-2"></i>New Category
            </button>
        </div>

        <!-- Search Bar -->
        <div class="row mb-4">
            <div class="col-md-5 col-lg-4">
                <div class="search-box-custom app-search-box rounded-pill px-3 d-flex align-items-center shadow-sm">
                    <i class="bi bi-search text-muted"></i>
                    <input v-model="store.queryParams.search" type="text" class="form-control border-0 shadow-none py-2"
                        placeholder="ស្វែងរក...">
                </div>
            </div>
        </div>

        <!-- Grid Section -->
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
                        <button @click="openEditModal(item)" class="btn btn-icon me-1" title="Edit"
                            aria-label="Edit category"><i
                                class="bi bi-pencil-square text-info"></i></button>
                        <button @click="store.deleteCategory(item.id)" class="btn btn-icon" title="Delete"
                            aria-label="Delete category"><i
                                class="bi bi-trash text-danger"></i></button>
                    </div>
                </template>
            </BaseTable>

            <div v-if="store.categories.length === 0" class="app-state">
                <div>
                    <div class="app-state__icon"><i class="bi bi-folder2-open"></i></div>
                    <p class="mb-0">មិនមានទិន្នន័យទេ</p>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div class="page-toolbar mt-5">
            <p class="small text-muted mb-0">Total: {{ store.totalItems }} categories</p>
            <BasePage :currentPage="store.queryParams._page" :totalPages="store.totalPages"
                @change-page="handlePageChange" />
        </div>

        <!-- BaseModal usage -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'Edit Category' : 'New Category'" hide-default-footer>
            <form class="app-form" novalidate @submit.prevent="handleSubmit">
                <div>
                    <label class="form-label small fw-bold text-muted text-uppercase">Name *</label>
                    <input v-model="form.name" type="text" class="form-control py-2 rounded-3 border-2"
                        :class="{ 'is-invalid': errors.name }" placeholder="Enter category name..." required
                        @input="errors.name = ''" @blur="validateForm">
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>
                <div>
                    <label class="form-label small fw-bold text-muted text-uppercase">Description</label>
                    <textarea v-model="form.description" class="form-control rounded-3 border-2" rows="4"
                        placeholder="Enter details..."></textarea>
                </div>
            </form>

            <template #footer>
                <div class="modal-actions">
                    <button type="button" class="btn btn-light rounded-pill px-4 fw-medium"
                        @click="isModalOpen = false">Cancel</button>
                    <button type="button" class="btn btn-primary-custom rounded-pill px-4 fw-medium"
                        @click="handleSubmit" :disabled="store.isLoading">
                        <span v-if="store.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                        {{ isEditing ? 'Save Changes' : 'Create Category' }}
                    </button>
                </div>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
.category-page {
    background-color: #f8fafc;
}

.search-box-custom:focus-within {
    border-color: #216477 !important;
}

.category-card:hover {
    transform: translateY(-5px);
    transition: 0.3s;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.icon-gradient {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #216477, #2f8aa0);
    box-shadow: 0 5px 10px rgba(33, 100, 119, 0.2);
}

.pagination-custom .page-link {
    color: #216477;
    font-weight: bold;
}

.page-item.active .page-link {
    background-color: #216477;
    border-color: #216477;
    color: white;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>
