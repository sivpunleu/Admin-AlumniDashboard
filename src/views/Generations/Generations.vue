<script setup>
import { onMounted, computed, ref, reactive, watch } from "vue";
import Swal from "sweetalert2";
import * as genStore from "../../stores/generationStore";
import { useDepartmentStore } from "@/stores/departmentStore";
import BaseButton from "@/components/UI/Base/BaseButton.vue";
import BaseModal from "@/components/UI/Base/BaseModal.vue";
import BasePage from "@/components/UI/Base/BasePage.vue";
import BaseTable from "@/components/UI/Base/BaseTable.vue";
import api from "@/API/api";
import logger from "@/utils/logger";

const departmentStore = useDepartmentStore();

const isSuccessResponse = (data) =>
    data == null || (data.result !== false && data.success !== false);

// ទាញយកទិន្នន័យនៅពេល Component ត្រូវបានដាក់បញ្ចូល (Mount)
onMounted(async () => {
    await Promise.all([
        genStore.fetchGenerations(),
        departmentStore.fetchDepartments(),
    ]);
});


const filteredGens = computed(() => {
    if (!genStore.searchQuery.value) return genStore.generations.value;
    const query = genStore.searchQuery.value.toLowerCase();
    return genStore.generations.value.filter(g =>
        String(g?.id ?? "").includes(query) ||
        String(g?.name ?? "").toLowerCase().includes(query)
    );
});

const currentPage = ref(1);
const itemsPerPage = 10;

watch(() => genStore.searchQuery.value, () => {
    currentPage.value = 1;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredGens.value.length / itemsPerPage)));

const paginatedGens = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    return filteredGens.value.slice(start, start + itemsPerPage);
});

watch(totalPages, (pages) => {
    if (currentPage.value > pages) {
        currentPage.value = pages;
    }
});

// Modal state for create / update
const showModal = ref(false);
const modalMode = ref("create"); // 'create' | 'edit'
const selectedGenId = ref(null);
const form = reactive({
    name: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear(),
    departmentId: null,
    description: "",
});
const errors = reactive({
    name: "",
    startYear: "",
    endYear: "",
    departmentId: "",
});

const buildGenerationPayload = (includeDepartment = true) => {
    const payload = {
        name: form.name,
        description: form.description,
        startYear: parseInt(form.startYear),
        endYear: parseInt(form.endYear),
    };

    // include departmentId only when provided. Omit if empty to avoid sending null which may be rejected.
    if (includeDepartment && form.departmentId !== "" && form.departmentId != null) {
        payload.departmentId = Number(form.departmentId);
    }

    return payload;
};

const modalTitle = computed(() => (modalMode.value === "create" ? "បង្កើតជំនាន់ថ្មី" : "កែប្រែព័ត៌មានជំនាន់"));
const modalConfirmText = computed(() => (modalMode.value === "create" ? "បង្កើត" : "រក្សាទុក"));

const columns = [
    { key: "name", label: "ឈ្មោះជំនាន់" },
    { key: "years", label: "ឆ្នាំ" },
    { key: "department", label: "ដេប៉ាតឺម៉ង់" },
    { key: "description", label: "ការពិពណ៌នា" },
    { key: "actions", label: "សកម្មភាព" },
];

const openCreateModal = () => {
    modalMode.value = "create";
    selectedGenId.value = null;
    form.name = "";
    form.startYear = new Date().getFullYear();
    form.endYear = new Date().getFullYear();
    form.departmentId = "";
    form.description = "";
    clearErrors();
    showModal.value = true;
};

const openEditModal = (gen) => {
    modalMode.value = "edit";
    selectedGenId.value = gen.id;
    form.name = gen.name || "";
    form.startYear = gen.startYear || new Date().getFullYear();
    form.endYear = gen.endYear || new Date().getFullYear();
    form.departmentId = gen.departmentId ?? gen.department?.id ?? "";
    form.description = gen.description || "";
    clearErrors();
    showModal.value = true;
};

const clearErrors = () => {
    Object.keys(errors).forEach((key) => {
        errors[key] = "";
    });
};

const validateForm = () => {
    clearErrors();
    form.name = form.name.trim();

    const startYear = Number(form.startYear);
    const endYear = Number(form.endYear);
    const currentYear = new Date().getFullYear();

    if (!form.name) {
        errors.name = "សូមបញ្ចូលឈ្មោះជំនាន់";
    }

    if (!startYear) {
        errors.startYear = "សូមបញ្ចូលឆ្នាំចាប់ផ្តើម";
    } else if (startYear < 1900 || startYear > currentYear + 10) {
        errors.startYear = "ឆ្នាំចាប់ផ្តើមមិនត្រឹមត្រូវ";
    }

    if (!endYear) {
        errors.endYear = "សូមបញ្ចូលឆ្នាំបញ្ចប់";
    } else if (endYear < startYear) {
        errors.endYear = "ឆ្នាំបញ្ចប់ត្រូវធំជាង ឬស្មើឆ្នាំចាប់ផ្តើម";
    }

    if (modalMode.value === "create" && !form.departmentId) {
        errors.departmentId = "សូមជ្រើសរើសដេប៉ាតឺម៉ង់";
    } else if (form.departmentId && Number(form.departmentId) <= 0) {
        errors.departmentId = "លេខសម្គាល់ដេប៉ាតឺម៉ង់មិនត្រឹមត្រូវ";
    }

    return !Object.values(errors).some(Boolean);
};

const submitForm = async () => {
    await genStore.requireAdmin(async () => {
        if (!validateForm()) return;

        try {
            genStore.isLoading.value = true;
            if (modalMode.value === "create") {
                const payload = buildGenerationPayload();
                const res = await api.post("/generations", payload);
                if (isSuccessResponse(res.data)) {
                    await genStore.fetchGenerations();
                    Swal.fire("Success", "បង្កើតជំនាន់ថ្មីបានជោគជ័យ", "success");
                    showModal.value = false;
                }
            } else if (modalMode.value === "edit") {
                const payload = buildGenerationPayload(false);
                logger.info('Updating generation (view) payload', payload);
                try {
                    const result = await genStore.updateGeneration(selectedGenId.value, payload);
                    if (result !== false) showModal.value = false;
                } catch (err) {
                    // error already handled in store; keep modal open for correction
                }
            }
        } catch (err) {
            logger.error('Generation submit failed', err.response?.data || err);
            const detail = err.response?.data?.message || err.response?.data || err.message || "Request failed";
            Swal.fire("Error", String(detail), "error");
        } finally {
            genStore.isLoading.value = false;
        }
    });
};

const createGeneration = () => {
    openCreateModal();
};

const handlePageChange = (page) => {
    currentPage.value = page;
};
</script>

<template>
    <div class="generations-page">
        <!-- ផ្នែកក្បាល (Header Section) -->
        <div class="generations-header page-toolbar align-items-start mb-4">
            <div>
                <h2 class="fw-bold text-dark">ជំនាន់និស្សិត</h2>
                <p class="text-muted small">ស្វែងរក និងគ្រប់គ្រងក្រុមនិស្សិតដែលបានបញ្ចប់ការសិក្សា និងក្រុមអតីតនិស្សិត។
                </p>
            </div>
            <BaseButton @click="createGeneration" variant="primary">
                <i class="bi bi-plus-lg me-2"></i> បង្កើតជំនាន់ថ្មី
            </BaseButton>
        </div>

        <div class="row mb-4">
            <div class="col-md-4">
                <div class="search-box app-search-box p-2 rounded-3 shadow-sm d-flex align-items-center">
                    <i class="bi bi-search ms-2 text-muted"></i>
                    <input v-model="genStore.searchQuery.value" type="text"
                        class="form-control border-0 shadow-none small" placeholder="ស្វែងរកតាមឈ្មោះ ឬលេខសម្គាល់...">
                </div>
            </div>
        </div>


        <div v-if="genStore.isLoading.value" class="app-state">
            <div>
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3 mb-0">កំពុងទាញទិន្នន័យ...</p>
            </div>
        </div>

        <!-- បញ្ជីជំនាន់ក្នុងតារាង (Generation Table) -->
        <div v-else class="bg-white rounded-4 shadow-sm border overflow-hidden">
            <BaseTable :columns="columns" :data="paginatedGens">
                <template #cell-years="{ item }">
                    <span class="badge bg-light text-muted border fw-normal px-2 py-1 small">
                        <i class="bi bi-calendar3 me-1"></i> ឆ្នាំ {{ item.startYear }} - {{ item.endYear }}
                    </span>
                </template>
                <!-- department -->
                <template #cell-department="{ item }">
                    <span class="badge bg-light text-muted border fw-normal px-2 py-1 small">
                        {{ item.department?.name || 'មិនមានការពិពណ៌នាឡើយ។' }}
                    </span>
                </template>

                <template #cell-description="{ item }">
                    <p class="text-muted small mb-0 text-description">
                        {{ item.description || 'មិនមានការពិពណ៌នាឡើយ។' }}
                    </p>
                </template>

                <template #cell-actions="{ item }">
                    <div class="d-flex align-items-center gap-2">
                        <BaseButton @click="openEditModal(item)" variant="light" size="sm" shape="sharp" title="កែប្រែ"
                            aria-label="កែប្រែជំនាន់">
                            <i class="bi bi-pencil-square text-info"></i>
                        </BaseButton>
                        <BaseButton @click="genStore.handleDelete(item.id)" variant="danger" size="sm" shape="sharp"
                            title="លុប" aria-label="លុបជំនាន់">
                            <i class="bi bi-trash text-light"></i>
                        </BaseButton>
                    </div>
                </template>
                <template #empty>
                    <div class="app-state">
                        <div>
                            <div class="app-state__icon"><i class="bi bi-mortarboard"></i></div>
                            <p class="mb-0">រកមិនឃើញទិន្នន័យជំនាន់ដែលអ្នកស្វែងរកទេ។</p>
                        </div>
                    </div>
                </template>
            </BaseTable>

            <div v-if="filteredGens.length > 0" class="generations-pagination page-toolbar p-3 border-top bg-white">
                <p class="small text-muted mb-0">Total: {{ filteredGens.length }} ជំនាន់</p>
                <BasePage :currentPage="currentPage" :totalPages="totalPages" @change-page="handlePageChange" />
            </div>
        </div>

        <!-- Base Modal for Create / Edit -->
        <BaseModal v-model="showModal" :title="modalTitle" size="md" :closeOnBackdrop="true">
            <template #header="{ titleId }">
                <h5 :id="titleId" class="mb-0">{{ modalTitle }}</h5>
            </template>

            <div class="app-form">
                <div>
                    <label class="small fw-bold">ឈ្មោះជំនាន់</label>
                    <input v-model="form.name" class="form-control" :class="{ 'is-invalid': errors.name }"
                        placeholder="e.g. ANT" @input="errors.name = ''" @blur="validateForm">
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>

                <div class="row g-2">
                    <div class="col-6">
                        <label class="small fw-bold">ឆ្នាំចាប់ផ្តើម</label>
                        <input v-model="form.startYear" type="number" class="form-control"
                            :class="{ 'is-invalid': errors.startYear }" @input="errors.startYear = ''"
                            @blur="validateForm">
                        <div v-if="errors.startYear" class="invalid-feedback">{{ errors.startYear }}</div>
                    </div>
                    <div class="col-6">
                        <label class="small fw-bold">ឆ្នាំបញ្ចប់</label>
                        <input v-model="form.endYear" type="number" class="form-control"
                            :class="{ 'is-invalid': errors.endYear }" @input="errors.endYear = ''" @blur="validateForm">
                        <div v-if="errors.endYear" class="invalid-feedback">{{ errors.endYear }}</div>
                    </div>
                </div>

                <div v-if="modalMode === 'create'">
                    <label class="small fw-bold">ដេប៉ាតឺម៉ង់</label>
                    <select v-model="form.departmentId" class="form-control"
                        :class="{ 'is-invalid': errors.departmentId }" @change="errors.departmentId = ''"
                        @blur="validateForm">
                        <option value="">ជ្រើសរើសដេប៉ាតឺម៉ង់</option>
                        <option v-for="department in departmentStore.departments || []" :key="department.id"
                            :value="department.id">
                            {{ department.name }}
                        </option>
                    </select>
                    <div v-if="errors.departmentId" class="invalid-feedback">{{ errors.departmentId }}</div>
                </div>

                <div>
                    <label class="small fw-bold">ការពិពណ៌នា</label>
                    <textarea v-model="form.description" class="form-control" rows="3"></textarea>
                </div>
            </div>

            <template #footer>
                <div class="modal-actions">
                    <BaseButton variant="light" @click="showModal = false">បោះបង់</BaseButton>
                    <BaseButton variant="primary" @click="submitForm" :disabled="genStore.isLoading.value"
                        :loading="genStore.isLoading.value">
                        {{ modalConfirmText }}
                    </BaseButton>
                </div>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
.generations-page {
    min-height: 100vh;
    padding: 1rem;
    background: #f8fafc;
}

.generations-header,
.generations-pagination {
    gap: 1rem;
    flex-wrap: wrap;
}

.search-box input::placeholder {
    color: #adb5bd;
}

.text-description {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 3em;
}

.btn-new,
.btn-view {
    transition: 0.3s;
}

.btn-new:hover,
.btn-view:hover {
    filter: brightness(1.2);
    transform: scale(1.02);
}

.dropdown-item:active {
    background-color: #f8f9fa;
    color: inherit;
}

@media (max-width: 768px) {
    .generations-page {
        padding: 0;
    }

    .generations-header,
    .generations-pagination {
        align-items: stretch !important;
    }

    .generations-header .btn,
    .generations-pagination :deep(.pagination-wrap) {
        width: 100%;
    }
}
</style>
