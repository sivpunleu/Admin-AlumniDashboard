<script setup>
import { onMounted, computed, ref, reactive, watch } from "vue";
import Swal from "sweetalert2";
import * as genStore from "../../stores/generationStore";
import { useDepartmentStore } from "@/stores/departmentStore";
import BaseButton from "@/components/UI/Base/BaseButton.vue";
import BaseModal from "@/components/UI/Base/BaseModal.vue";
import BasePage from "@/components/UI/Base/BasePage.vue";
import BaseTable from "@/components/UI/Base/BaseTable.vue";
import logger from "@/utils/logger";

const departmentStore = useDepartmentStore();
const NAME_MAX_LENGTH = genStore.GENERATION_NAME_MAX_LENGTH;
const DESCRIPTION_MAX_LENGTH = genStore.GENERATION_DESCRIPTION_MAX_LENGTH;


onMounted(async () => {
    await Promise.all([
        genStore.fetchGenerations(),
        departmentStore.fetchDepartments(),
    ]);
});

const KHMER_DIGITS = {
    "០": "0",
    "១": "1",
    "២": "2",
    "៣": "3",
    "៤": "4",
    "៥": "5",
    "៦": "6",
    "៧": "7",
    "៨": "8",
    "៩": "9",
};

const normalizeSearchValue = (value) =>
    String(value ?? "")
        .replace(/[០-៩]/g, (digit) => KHMER_DIGITS[digit] || digit)
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

const getGenerationIdValues = (generation) => [
    generation?.id,
    generation?._id,
    generation?.generationId,
    generation?.generationID,
    generation?.generation_id,
    generation?.code,
].filter((value) => value !== undefined && value !== null && value !== "");

const getGenerationPrimaryId = (generation) => getGenerationIdValues(generation)[0] ?? "";

const getGenerationSearchText = (generation) => {
    const idValues = getGenerationIdValues(generation);

    return [
        ...idValues,
        ...idValues.map((id) => `#${id}`),
        generation?.name,
    ]
        .map(normalizeSearchValue)
        .filter(Boolean)
        .join(" ");
};

const filteredGens = computed(() => {
    const query = normalizeSearchValue(genStore.searchQuery.value);
    if (!query) return genStore.generations.value;

    return genStore.generations.value.filter((generation) =>
        getGenerationSearchText(generation).includes(query)
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
    id: "",
    name: "",
    startYear: new Date().getFullYear(),
    endYear: new Date().getFullYear() + 1,
    departmentId: null,
    description: "",
});
const errors = reactive({
    id: "",
    name: "",
    description: "",
    startYear: "",
    endYear: "",
    departmentId: "",
});

const buildGenerationPayload = (includeDepartment = true) => {
    const payload = {
        name: form.name,
        description: form.description,
        startYear: Number(form.startYear),
        endYear: Number(form.endYear),
    };

    // include departmentId only when provided. Omit if empty to avoid sending null which may be rejected.
    if (includeDepartment && form.departmentId !== "" && form.departmentId != null) {
        payload.departmentId = Number(form.departmentId);
    }

    return payload;
};

const modalTitle = computed(() => (modalMode.value === "create" ? "បង្កើតជំនាន់ថ្មី" : "កែប្រែព័ត៌មានជំនាន់"));
const modalConfirmText = computed(() => (modalMode.value === "create" ? "បង្កើត" : "រក្សាទុក"));
const maxGenerationYear = computed(() => new Date().getFullYear() + 10);
const minEndYear = computed(() => {
    const startYear = Number(form.startYear);
    return Number.isInteger(startYear) && startYear >= 1900 ? startYear + 1 : 1901;
});
const selectedDepartmentName = computed(() => {
    if (form.departmentId === "" || form.departmentId == null) return "";

    const department = (departmentStore.departments || []).find(
        (item) => String(item.id) === String(form.departmentId),
    );

    return department?.name || "";
});

const columns = [
    { key: "id", label: "លេខសម្គាល់" },
    { key: "name", label: "ឈ្មោះជំនាន់" },
    { key: "years", label: "ឆ្នាំ" },
    { key: "department", label: "ដេប៉ាតឺម៉ង់" },
    { key: "description", label: "ការពិពណ៌នា" },
    { key: "actions", label: "សកម្មភាព" },
];
const skeletonRows = Array.from({ length: 6 }, (_, index) => index);

const openCreateModal = () => {
    modalMode.value = "create";
    selectedGenId.value = null;
    form.id = "";
    form.name = "";
    form.startYear = new Date().getFullYear();
    form.endYear = new Date().getFullYear() + 1;
    form.departmentId = "";
    form.description = "";
    clearErrors();
    showModal.value = true;
};

const openEditModal = (gen) => {
    const generationId = getGenerationPrimaryId(gen);
    modalMode.value = "edit";
    selectedGenId.value = generationId;
    form.id = generationId;
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

const getNameError = (required = false) => {
    const name = String(form.name || "").trim();

    if (!name && required) {
        return "សូមបញ្ចូលឈ្មោះជំនាន់";
    }

    if (name.length > NAME_MAX_LENGTH) {
        return `ឈ្មោះជំនាន់មិនអាចលើស ${NAME_MAX_LENGTH} តួអក្សរបានទេ`;
    }

    return "";
};

const getDescriptionError = () => {
    const description = String(form.description || "").trim();

    if (description.length > DESCRIPTION_MAX_LENGTH) {
        return `ការពិពណ៌នាមិនអាចលើស ${DESCRIPTION_MAX_LENGTH} តួអក្សរបានទេ`;
    }

    return "";
};

const validateNameField = (required = false) => {
    errors.name = getNameError(required);
};

const validateDescriptionField = () => {
    errors.description = getDescriptionError();
};

const validateForm = () => {
    clearErrors();
    form.name = String(form.name || "").trim();
    form.description = String(form.description || "").trim();

    const startYear = Number(form.startYear);
    const endYear = Number(form.endYear);
    const departmentId = Number(form.departmentId);
    const currentYear = new Date().getFullYear();

    if (modalMode.value === "edit" && !String(selectedGenId.value || "").trim()) {
        errors.id = "លេខសម្គាល់ជំនាន់មិនត្រឹមត្រូវ";
    }

    validateNameField(true);
    validateDescriptionField();

    if (!startYear) {
        errors.startYear = "សូមបញ្ចូលឆ្នាំចាប់ផ្តើម";
    } else if (!Number.isInteger(startYear) || startYear < 1900 || startYear > currentYear + 10) {
        errors.startYear = "ឆ្នាំចាប់ផ្តើមមិនត្រឹមត្រូវ";
    }

    if (!endYear) {
        errors.endYear = "សូមបញ្ចូលឆ្នាំបញ្ចប់";
    } else if (!Number.isInteger(endYear) || endYear < 1900 || endYear > currentYear + 10) {
        errors.endYear = "ឆ្នាំបញ្ចប់មិនត្រឹមត្រូវ";
    } else if (Number.isInteger(startYear) && endYear <= startYear) {
        errors.endYear = "ឆ្នាំបញ្ចប់ត្រូវធំជាងឆ្នាំចាប់ផ្តើម";
    }

    if (modalMode.value === "create" && !form.departmentId) {
        errors.departmentId = "សូមជ្រើសរើសដេប៉ាតឺម៉ង់";
    } else if (form.departmentId && (!Number.isInteger(departmentId) || departmentId <= 0)) {
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
                try {
                    const result = await genStore.createGeneration(payload);
                    if (result !== false) showModal.value = false;
                } catch (err) {
                    // error already handled in store; keep modal open for correction
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
            const detail = genStore.getApiErrorMessage(err, "មិនអាចរក្សាទុកជំនាន់បានទេ");
            Swal.fire("កំហុស", String(detail), "error");
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
        <!-- (Header Section) -->
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
                        class="form-control border-0 shadow-none small" aria-label="ស្វែងរកជំនាន់"
                        placeholder="ស្វែងរកតាមឈ្មោះ ឬលេខសម្គាល់...">
                </div>
            </div>
        </div>


        <div v-if="genStore.isLoading.value" class="generation-skeleton-card bg-white rounded-4 shadow-sm border"
            aria-busy="true" aria-live="polite" aria-label="កំពុងផ្ទុកទិន្នន័យជំនាន់">
            <div class="generation-skeleton-header">
                <span v-for="column in columns" :key="column.key" class="skeleton-placeholder skeleton-heading"></span>
            </div>
            <div class="generation-table-skeleton">
                <div v-for="row in skeletonRows" :key="row" class="generation-skeleton-row">
                    <span class="skeleton-placeholder skeleton-pill skeleton-pill--id"></span>
                    <span class="skeleton-placeholder skeleton-line skeleton-line--name"></span>
                    <span class="skeleton-placeholder skeleton-pill skeleton-pill--year"></span>
                    <span class="skeleton-placeholder skeleton-pill skeleton-pill--department"></span>
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

        <!--(Generation Table) -->
        <div v-else class="bg-white rounded-4 shadow-sm border overflow-hidden">
            <BaseTable :columns="columns" :data="paginatedGens">
                <template #cell-id="{ item }">
                    <span class="badge bg-light text-muted border fw-normal px-2 py-1 small">
                        #{{ getGenerationPrimaryId(item) || '-' }}
                    </span>
                </template>

                <template #cell-name="{ item }">
                    <div class="generation-name-cell fw-semibold text-dark" :title="item.name || '-'">
                        {{ item.name || '-' }}
                    </div>
                </template>

                <template #cell-years="{ item }">
                    <span class="badge bg-light text-muted border fw-normal px-2 py-1 small">
                        <i class="bi bi-calendar3 me-1"></i> ឆ្នាំ {{ item.startYear }} - {{ item.endYear }}
                    </span>
                </template>
                <!-- department -->
                <template #cell-department="{ item }">
                    <span
                        class="generation-department-badge badge bg-light text-muted border fw-normal px-2 py-1 small"
                        :title="item.department?.name || '-'"
                    >
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
                        <BaseButton @click="genStore.handleDelete(getGenerationPrimaryId(item))" variant="danger" size="sm" shape="sharp"
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
                        placeholder="e.g. ANT" @input="validateNameField()" @blur="validateNameField(true)">
                    <div v-if="errors.name" class="invalid-feedback">{{ errors.name }}</div>
                </div>

                <div class="row g-2">
                    <div class="col-6">
                        <label class="small fw-bold">ឆ្នាំចាប់ផ្តើម</label>
                        <input v-model="form.startYear" type="number" class="form-control" min="1900"
                            :max="maxGenerationYear" step="1"
                            :class="{ 'is-invalid': errors.startYear }" @input="errors.startYear = ''"
                            @blur="validateForm">
                        <div v-if="errors.startYear" class="invalid-feedback">{{ errors.startYear }}</div>
                    </div>
                    <div class="col-6">
                        <label class="small fw-bold">ឆ្នាំបញ្ចប់</label>
                        <input v-model="form.endYear" type="number" class="form-control" :min="minEndYear"
                            :max="maxGenerationYear" step="1"
                            :class="{ 'is-invalid': errors.endYear }" @input="errors.endYear = ''" @blur="validateForm">
                        <div v-if="errors.endYear" class="invalid-feedback">{{ errors.endYear }}</div>
                    </div>
                </div>

                <div v-if="modalMode === 'create'">
                    <label class="small fw-bold">ដេប៉ាតឺម៉ង់</label>
                    <select v-model="form.departmentId" class="form-control form-select-truncate"
                        :class="{ 'is-invalid': errors.departmentId }" @change="errors.departmentId = ''"
                        :title="selectedDepartmentName"
                        @blur="validateForm">
                        <option value="">ជ្រើសរើសដេប៉ាតឺម៉ង់</option>
                        <option v-for="department in departmentStore.departments || []" :key="department.id"
                            :value="department.id" :title="department.name">
                            {{ department.name }}
                        </option>
                    </select>
                    <div v-if="errors.departmentId" class="invalid-feedback">{{ errors.departmentId }}</div>
                </div>

                <div>
                    <label class="small fw-bold">ការពិពណ៌នា</label>
                    <textarea v-model="form.description" class="form-control"
                        :class="{ 'is-invalid': errors.description }" rows="3"
                        @input="validateDescriptionField" @blur="validateDescriptionField"></textarea>
                    <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}</div>
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

.generation-skeleton-card {
    overflow-x: auto;
}

.generation-skeleton-header,
.generation-skeleton-row {
    display: grid;
    grid-template-columns: minmax(96px, 0.55fr) minmax(170px, 1fr) minmax(120px, 0.75fr) minmax(150px, 0.85fr) minmax(220px, 1.25fr) minmax(110px, 0.55fr);
    align-items: center;
    gap: 1rem;
    min-width: 820px;
}

.generation-skeleton-header {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #edf2f7;
}

.generation-skeleton-row {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #edf2f7;
}

.generation-skeleton-row:last-child {
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

.skeleton-pill {
    height: 26px;
}

.skeleton-pill--id {
    width: 84px;
}

.skeleton-pill--year {
    width: 118px;
}

.skeleton-pill--department {
    width: 138px;
}

.skeleton-description-lines {
    display: grid;
    gap: 0.45rem;
    width: 100%;
}

.skeleton-line--description {
    width: min(260px, 92%);
}

.skeleton-line--description-short {
    width: min(180px, 68%);
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

@keyframes skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}

.text-description {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 3em;
}

.generation-name-cell {
    display: block;
    max-width: clamp(160px, 20vw, 260px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.generation-department-badge {
    display: inline-block;
    max-width: clamp(150px, 18vw, 240px);
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
}

.form-select-truncate {
    overflow: hidden;
    padding-right: 2.25rem;
    text-overflow: ellipsis;
    white-space: nowrap;
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

    .generation-skeleton-card {
        overflow-x: hidden;
    }

    .generation-skeleton-header {
        display: none;
    }

    .generation-skeleton-row {
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
