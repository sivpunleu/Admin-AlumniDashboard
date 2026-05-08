<script setup>
import { onMounted, watch, ref, reactive } from 'vue';
import { useDepartmentStore } from '@/stores/departmentStore';
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

const tableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Department Name' },
    { key: 'description', label: 'Description' },
    { key: 'actions', label: 'Actions' }
];

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

const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    form.name = '';
    form.description = '';
    isModalOpen.value = true;
};

const openEditModal = (dept) => {
    isEditing.value = true;
    currentId.value = dept.id;
    form.name = dept.name;
    form.description = dept.description;
    isModalOpen.value = true;
};

const handleSubmit = async () => {
    if (isEditing.value) {
        await store.updateDepartment(currentId.value, { ...form });
    } else {
        await store.createDepartment({ ...form });
    }
    isModalOpen.value = false;
};
</script>

<template>
    <div class="main-content p-4">
        <!-- --- Breadcrumb / Page Header --- -->
        <div class="mb-4 d-flex justify-content-between align-items-center">
            <div>
                <h3 class="fw-bold text-dark mb-1">Academic Departments</h3>
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item"><a href="#" class="text-decoration-none">Dashboard</a></li>
                        <li class="breadcrumb-item active">Departments</li>
                    </ol>
                </nav>
            </div>
            <button class="btn btn-primary-custom shadow-sm px-4 py-2" @click="openAddModal">
                <i class="bi bi-plus-circle me-2"></i>New Department
            </button>
        </div>

        <!-- --- Main Content Card --- -->
        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="card-header bg-white border-bottom py-3 px-4">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <h5 class="mb-0 fw-bold text-secondary">Department List</h5>
                    </div>
                    <div class="col-md-8">
                        <div class="search-box float-md-end">
                            <div class="input-group search-group rounded-pill overflow-hidden border">
                                <span class="input-group-text bg-white border-0"><i
                                        class="bi bi-search text-muted"></i></span>
                                <input v-model="store.queryParams.search" type="text"
                                    class="form-control border-0 shadow-none ps-0" placeholder="Search departments...">
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card-body p-0">
                <div v-if="store.isLoading" class="text-center py-5">
                    <div class="spinner-grow spinner-grow-sm text-primary me-2"></div>
                    <span class="text-muted fw-medium">Loading data...</span>
                </div>

                <div v-else-if="store.departments.length === 0" class="text-center py-5">
                    <img src="https://cdn-icons-png.flaticon.com/512/7486/7486744.png" width="60"
                        class="mb-3 opacity-50">
                    <p class="text-muted">No departments found.</p>
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
                            {{ item.description || '— No description provided —' }}
                        </div>
                    </template>

                    <template #cell-actions="{ item }">
                        <div class="action-btns text-end pe-4">
                            <button class="btn btn-icon text-info me-1" @click="openEditModal(item)" title="Edit">
                                <i class="bi bi-pencil-square fs-5"></i>
                            </button>
                            <button class="btn btn-icon text-danger" @click="store.deleteDepartment(item.id)"
                                title="Delete">
                                <i class="bi bi-trash3 fs-5"></i>
                            </button>
                        </div>
                    </template>
                </BaseTable>
            </div>

            <!-- Footer / Pagination -->
            <div class="card-footer bg-white border-top py-3 px-4">
                <div class="text-muted small fw-medium text-center">
                    Showing total <span class="text-dark fw-bold">{{ store.totalItems }}</span> departments
                </div>
                <BasePage :currentPage="store.queryParams._page" :totalPages="store.totalPages"
                    @change-page="handlePageChange" />
            </div>
        </div>

        <!-- Use BaseModal component for forms -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'Edit Department' : 'Create New Department'" size="md">
            <template #default>
                <form @submit.prevent="handleSubmit">
                    <div class="p-0">
                        <div class="mb-4 p-4">
                            <label class="form-label small fw-bold text-muted">DEPARTMENT NAME</label>
                            <input v-model="form.name" type="text" class="form-control custom-input py-2"
                                placeholder="Enter department name..." required>
                        </div>
                        <div class="mb-2 p-4 pt-0">
                            <label class="form-label small fw-bold text-muted">DESCRIPTION (OPTIONAL)</label>
                            <textarea v-model="form.description" class="form-control custom-input" rows="4"
                                placeholder="Add more details about this department..."></textarea>
                        </div>
                    </div>
                </form>
            </template>

            <template #footer>
                <button type="button" class="btn btn-light rounded-pill px-4 fw-medium"
                    @click="isModalOpen = false">Cancel</button>
                <button type="button" class="btn btn-primary-custom rounded-pill px-4 fw-medium" @click="handleSubmit"
                    :disabled="store.isLoading">
                    <span v-if="store.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                    {{ isEditing ? 'Save Changes' : 'Create Department' }}
                </button>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
/* Color Palette & Global */
:root {
    --primary-color: #216477;
    --primary-hover: #1a4f5d;
}

.main-content {
    background-color: #f8fafc;
    min-height: 100vh;
}

/* Custom Table Styles */
.custom-table tr td {
    padding: 1rem 0.75rem;
    vertical-align: middle;
}

:deep(.table thead th:last-child),
:deep(.table tbody td:last-child) {
    text-align: end;
}

:deep(.table thead th:first-child),
:deep(.table tbody td:first-child) {
    padding-left: 1.5rem;
}

:deep(.table thead th:last-child),
:deep(.table tbody td:last-child) {
    padding-right: 1.5rem;
}

.bg-faint-primary {
    background-color: #f1f5f9;
}

.btn-icon {
    width: 38px;
    height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    transition: all 0.2s;
    background: transparent;
    border: none;
}

.btn-icon:hover {
    background: #f1f5f9;
    transform: scale(1.1);
}

/* Buttons */
.btn-primary-custom {
    background-color: #216477;
    border: none;
    color: white;
    border-radius: 10px;
    transition: all 0.3s ease;
}

.btn-primary-custom:hover {
    background-color: #1a4f5d;
    transform: translateY(-1px);
}

/* Search Box */
.search-group {
    max-width: 320px;
    transition: all 0.3s ease;
}

.search-group:focus-within {
    border-color: #216477 !important;
    box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.1);
}

/* Pagination Customization */
.pagination-custom .page-link {
    border: none;
    color: #475569;
    font-weight: 600;
    margin: 0 4px;
    border-radius: 8px !important;
    padding: 8px 14px;
}

.pagination-custom .page-item.active .page-link {
    background-color: #216477;
    color: white;
}

/* Modal UI */
.custom-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
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
</style>