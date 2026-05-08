<script setup>
import { onMounted, computed, ref, reactive, watch } from "vue";
import Swal from "sweetalert2";
import * as genStore from "../../stores/generationStore";
import BaseModal from "@/components/UI/Base/BaseModal.vue";
import BasePage from "@/components/UI/Base/BasePage.vue";
import BaseTable from "@/components/UI/Base/BaseTable.vue";
import api from "@/API/api";

// ទាញយកទិន្នន័យនៅពេល Component ត្រូវបានដាក់បញ្ចូល (Mount)
onMounted(() => genStore.fetchGenerations());

// មុខងារស្វែងរក (Filter/search by id or name - image_ff96c3.png)
const filteredGens = computed(() => {
    if (!genStore.searchQuery.value) return genStore.generations.value;
    return genStore.generations.value.filter(g =>
        g.id.toString().includes(genStore.searchQuery.value) ||
        g.name.toLowerCase().includes(genStore.searchQuery.value.toLowerCase())
    );
});

const PRIMARY_COLOR = "#216477";

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

const modalTitle = computed(() => (modalMode.value === "create" ? "Create New Generation" : "Update Generation"));
const modalConfirmText = computed(() => (modalMode.value === "create" ? "Create" : "Update"));

const columns = [
    { key: "name", label: "Generation Name" },
    { key: "years", label: "Years" },
    { key: "description", label: "Description" },
    { key: "actions", label: "Actions" },
];

const openCreateModal = () => {
    modalMode.value = "create";
    selectedGenId.value = null;
    form.name = "";
    form.startYear = new Date().getFullYear();
    form.endYear = new Date().getFullYear();
    form.departmentId = null;
    form.description = "";
    showModal.value = true;
};

const openEditModal = (gen) => {
    modalMode.value = "edit";
    selectedGenId.value = gen.id;
    form.name = gen.name || "";
    form.startYear = gen.startYear || new Date().getFullYear();
    form.endYear = gen.endYear || new Date().getFullYear();
    form.departmentId = gen.departmentId || null;
    form.description = gen.description || "";
    showModal.value = true;
};

const submitForm = async () => {
    genStore.requireAdmin(async () => {
        if (!form.name || !form.startYear || !form.endYear) {
            Swal.fire("Validation", "សូមបំពេញ Name និង Years", "warning");
            return;
        }

        try {
            genStore.isLoading.value = true;
            if (modalMode.value === "create") {
                const payload = {
                    name: form.name,
                    description: form.description,
                    startYear: parseInt(form.startYear),
                    endYear: parseInt(form.endYear),
                    departmentId: form.departmentId ? parseInt(form.departmentId) : undefined,
                };
                const res = await api.post("/generations", payload);
                if (res.data?.result) {
                    await genStore.fetchGenerations();
                    Swal.fire("Success", "បង្កើតជំនាន់ថ្មីបានជោគជ័យ", "success");
                    showModal.value = false;
                }
            } else if (modalMode.value === "edit") {
                const payload = {
                    name: form.name,
                    description: form.description,
                    startYear: parseInt(form.startYear),
                    endYear: parseInt(form.endYear),
                };
                const res = await api.put(`/generations/${selectedGenId.value}`, payload);
                if (res.data?.result) {
                    await genStore.fetchGenerations();
                    Swal.fire("Success", "ព័ត៌មានត្រូវបានកែប្រែ", "success");
                    showModal.value = false;
                }
            }
        } catch (err) {
            Swal.fire("Error", err.response?.data?.message || "Request failed", "error");
        } finally {
            genStore.isLoading.value = false;
        }
    });
};

/**
 * មុខងារបង្កើតជំនាន់ថ្មី (Create new generation - ភ្ជាប់ទៅកាន់ Store)
 */
const createGeneration = () => {
    openCreateModal();
};

const handlePageChange = (page) => {
    currentPage.value = page;
};
</script>

<template>
    <div class="p-4 bg-light min-vh-100">
        <!-- ផ្នែកក្បាល (Header Section) -->
        <div class="d-flex justify-content-between align-items-start mb-4">
            <div>
                <h2 class="fw-bold text-dark">ជំនាន់និស្សិត</h2>
                <p class="text-muted small">ស្វែងរក និងគ្រប់គ្រងក្រុមនិស្សិតដែលបានបញ្ចប់ការសិក្សា និងក្រុមអតីតនិស្សិត។
                </p>
            </div>
            <!-- ប៊ូតុងបង្កើតថ្មី (Create new generation) -->
            <button @click="createGeneration" class="btn text-white px-4 py-2 rounded-3 shadow-sm border-0 btn-new"
                :style="{ backgroundColor: PRIMARY_COLOR }">
                <i class="bi bi-plus-lg me-2"></i> បង្កើតជំនាន់ថ្មី
            </button>
        </div>

        <!-- ផ្នែកប្រអប់ស្វែងរក (Search Box Section) -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="search-box bg-white p-2 rounded-3 shadow-sm d-flex align-items-center border">
                    <i class="bi bi-search ms-2 text-muted"></i>
                    <input v-model="genStore.searchQuery.value" type="text"
                        class="form-control border-0 shadow-none small" placeholder="ស្វែងរកតាមឈ្មោះ ឬលេខសម្គាល់...">
                </div>
            </div>
        </div>

        <!-- ស្ថានភាពកំពុងផ្ទុក (Loading State) -->
        <div v-if="genStore.isLoading.value" class="text-center py-5">
            <div class="spinner-border" :style="{ color: PRIMARY_COLOR }" role="status"></div>
            <p class="mt-2 text-muted">កំពុងទាញទិន្នន័យ...</p>
        </div>

        <!-- បញ្ជីជំនាន់ក្នុងតារាង (Generation Table) -->
        <div v-else class="bg-white rounded-4 shadow-sm border overflow-hidden">
            <BaseTable :columns="columns" :data="paginatedGens">
                <template #cell-years="{ item }">
                    <span class="badge bg-light text-muted border fw-normal px-2 py-1 small">
                        <i class="bi bi-calendar3 me-1"></i> ឆ្នាំ {{ item.startYear }} - {{ item.endYear }}
                    </span>
                </template>

                <template #cell-description="{ item }">
                    <p class="text-muted small mb-0 text-description">
                        {{ item.description || 'មិនមានការពិពណ៌នាឡើយ។' }}
                    </p>
                </template>

                <template #cell-actions="{ item }">
                    <div class="d-flex align-items-center gap-2">
                        <!-- edit -->
                        <button @click="openEditModal(item)" class="btn btn-sm btn-outline-primary" title="កែប្រែ">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <!-- delete -->
                        <button @click="genStore.handleDelete(item.id)" class="btn btn-sm btn-outline-danger"
                            title="លុប">
                            <i class="bi bi-trash"></i>
                        </button>

                    </div>
                </template>
            </BaseTable>

            <div v-if="filteredGens.length === 0" class="text-center py-5">
                <i class="bi bi-folder2-open display-1 text-muted opacity-25"></i>
                <p class="mt-3 text-muted">រកមិនឃើញទិន្នន័យជំនាន់ដែលអ្នកស្វែងរកទេ។</p>
            </div>

            <div v-else class="d-flex justify-content-between align-items-center p-3 border-top bg-white">
                <p class="small text-muted mb-0">Total: {{ filteredGens.length }} generations</p>
                <BasePage :currentPage="currentPage" :totalPages="totalPages" @change-page="handlePageChange" />
            </div>
        </div>

        <!-- Base Modal for Create / Edit -->
        <BaseModal v-model="showModal" :title="modalTitle" size="md" :closeOnBackdrop="true">
            <template #header>
                <h5 class="mb-0">{{ modalTitle }}</h5>
            </template>

            <div class="p-2">
                <div class="mb-3">
                    <label class="small fw-bold">Generation Name</label>
                    <input v-model="form.name" class="form-control" placeholder="e.g. ANT">
                </div>

                <div class="row g-2">
                    <div class="col-6">
                        <label class="small fw-bold">Start Year</label>
                        <input v-model="form.startYear" type="number" class="form-control">
                    </div>
                    <div class="col-6">
                        <label class="small fw-bold">End Year</label>
                        <input v-model="form.endYear" type="number" class="form-control">
                    </div>
                </div>

                <div class="mb-3 mt-3">
                    <label class="small fw-bold">Department ID</label>
                    <input v-model="form.departmentId" type="number" class="form-control" placeholder="e.g. 2">
                </div>

                <div class="mb-2">
                    <label class="small fw-bold">Description</label>
                    <textarea v-model="form.description" class="form-control" rows="3"></textarea>
                </div>
            </div>

            <template #footer>
                <button type="button" class="btn btn-light me-2" @click="showModal = false">Cancel</button>
                <button type="button" class="btn btn-primary" @click="submitForm">{{ modalConfirmText }}</button>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
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
</style>