<script setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEventStore } from '@/stores/eventStore';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import BaseModal from '@/components/UI/Base/BaseModal.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';

const store = useEventStore();
const router = useRouter();
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const isSubmitting = ref(false);

const tableColumns = [
    { key: 'title', label: 'ចំណងជើង' },
    { key: 'location', label: 'ទីតាំង' },
    { key: 'startDate', label: 'ថ្ងៃចាប់ផ្តើម' },
    { key: 'endDate', label: 'ថ្ងៃបញ្ចប់' },
    { key: 'thumbnail', label: 'រូបភាពតំណាង' },
    { key: 'actions', label: 'សកម្មភាព' }
];

const form = reactive({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    categoryId: 1
});
const errors = reactive({
    title: '',
    startDate: '',
    endDate: '',
    location: '',
    categoryId: ''
});

onMounted(() => store.fetchEvents());

watch(() => store.queryParams.search, () => {
    store.queryParams._page = 1;
    store.fetchEvents();
});

const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    Object.assign(form, { title: '', description: '', startDate: '', endDate: '', location: '', categoryId: 1 });
    clearErrors();
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    isEditing.value = false;
    currentId.value = null;
    clearErrors();
};

const toDatetimeLocalInput = (value) => {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
};

const openEditModal = (event) => {
    isEditing.value = true;
    currentId.value = event.id;
    Object.assign(form, {
        title: event.title,
        description: event.description,
        startDate: toDatetimeLocalInput(event.startDate),
        endDate: toDatetimeLocalInput(event.endDate),
        location: event.location,
        categoryId: event.categoryId ?? event.category?.id ?? 1
    });
    clearErrors();
    isModalOpen.value = true;
};

const openParticipants = (eventId) => {
    router.push({ name: 'participant', params: { id: eventId } });
};

const clearErrors = () => {
    Object.keys(errors).forEach((key) => {
        errors[key] = '';
    });
};

const validateForm = () => {
    clearErrors();
    form.title = form.title.trim();
    form.location = form.location.trim();

    const start = form.startDate ? new Date(form.startDate) : null;
    const end = form.endDate ? new Date(form.endDate) : null;

    if (!form.title) {
        errors.title = 'សូមបញ្ចូលចំណងជើង';
    }

    if (!form.startDate || Number.isNaN(start.getTime())) {
        errors.startDate = 'សូមជ្រើសរើសថ្ងៃចាប់ផ្តើម';
    }

    if (!form.endDate || Number.isNaN(end.getTime())) {
        errors.endDate = 'សូមជ្រើសរើសថ្ងៃបញ្ចប់';
    } else if (start && !Number.isNaN(start.getTime()) && end < start) {
        errors.endDate = 'ថ្ងៃបញ្ចប់ត្រូវនៅក្រោយថ្ងៃចាប់ផ្តើម';
    }

    if (!form.location) {
        errors.location = 'សូមបញ្ចូលទីតាំង';
    }

    if (!Number(form.categoryId) || Number(form.categoryId) <= 0) {
        errors.categoryId = 'សូមបញ្ចូល Category ID ត្រឹមត្រូវ';
    }

    return !Object.values(errors).some(Boolean);
};

const handleSubmit = async () => {
    if (isSubmitting.value) return;
    if (!validateForm()) return;

    isSubmitting.value = true;
    try {
        const payload = {
            ...form,
            startDate: new Date(form.startDate).toISOString(),
            endDate: new Date(form.endDate).toISOString(),
            categoryId: Number(form.categoryId)
        };
        let success = isEditing.value ? await store.updateEvent(currentId.value, payload) : await store.createEvent(payload);
        if (success) closeModal();
    } finally {
        isSubmitting.value = false;
    }
};

const handleFileChange = (e, id) => {
    const file = e.target.files[0];
    if (file) store.uploadThumbnail(id, file);
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('km-KH');
};
</script>

<template>
    <div class="event-page">
        <!-- ផ្នែកក្បាល (Header Section) -->
        <div class="event-toolbar page-toolbar mb-4 bg-white p-4 rounded-4 shadow-sm">
            <h4 class="event-title fw-bold mb-0">ការគ្រប់គ្រងព្រឹត្តិការណ៍</h4>
            <div class="page-toolbar__actions">
                <input v-model="store.queryParams.search" type="text" class="event-search form-control rounded-pill px-3"
                    placeholder="ស្វែងរកព្រឹត្តិការណ៍...">
                <BaseButton @click="openAddModal" variant="primary">
                    <i class="bi bi-plus-circle me-2"></i> បង្កើតថ្មី
                </BaseButton>
            </div>
        </div>

        <!-- ស្ថានភាពកំពុងផ្ទុក (Loading State) -->
        <div v-if="store.isLoading" class="app-state">
            <div>
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3 mb-0">កំពុងទាញយកទិន្នន័យ...</p>
            </div>
        </div>

        <!-- តារាងបង្ហាញទិន្នន័យ (Table Section) -->
        <div v-else>
            <BaseTable :columns="tableColumns" :data="store.events">
                <template #cell-title="{ item }">
                    <div class="fw-semibold">{{ item.title }}</div>
                    <small class="text-muted">អត្តលេខ: {{ item.id }}</small>
                </template>

                <template #cell-location="{ item }">
                    <span class="text-muted">{{ item.location || '-' }}</span>
                </template>

                <template #cell-startDate="{ item }">
                    {{ formatDateTime(item.startDate) }}
                </template>

                <template #cell-endDate="{ item }">
                    {{ formatDateTime(item.endDate) }}
                </template>

                <template #cell-thumbnail="{ item }">
                    <div class="d-flex align-items-center gap-2">
                        <img :src="item.thumbnail || 'https://via.placeholder.com/100x60'" alt="thumbnail"
                            class="table-thumbnail rounded-2 border">
                        <label :for="'file-' + item.id" class="btn btn-sm btn-white shadow-sm" title="ផ្ទុកឡើងរូបភាព">
                            <i class="bi bi-camera"></i>
                        </label>
                        <input type="file" :id="'file-' + item.id" hidden @change="handleFileChange($event, item.id)">
                        <button v-if="item.thumbnail" @click="store.deleteThumbnail(item.id)"
                            class="btn btn-sm btn-outline-danger" title="លុបរូបភាព">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </template>

                <template #cell-actions="{ item }">
                    <div class="d-flex gap-2">
                        <BaseButton @click="openParticipants(item.id)" variant="primary" size="sm" shape="sharp"
                            title="មើលអ្នកចូលរួម" aria-label="មើលអ្នកចូលរួម">
                            <i class="bi bi-people text-light"></i>
                        </BaseButton>
                        <BaseButton @click="openEditModal(item)" variant="light" size="sm" shape="sharp" title="កែប្រែ"
                            aria-label="កែប្រែព្រឹត្តិការណ៍">
                            <i class="bi bi-pencil-square text-info"></i>
                        </BaseButton>
                        <BaseButton @click="store.deleteEvent(item.id)" variant="danger" size="sm" shape="sharp"
                            title="លុប" aria-label="លុបព្រឹត្តិការណ៍">
                            <i class="bi bi-trash text-light"></i>
                        </BaseButton>
                    </div>
                </template>
            </BaseTable>

        </div>

        <!-- ផ្ទាំង Modal សម្រាប់បង្កើត/កែប្រែ -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'កែប្រែព្រឹត្តិការណ៍' : 'បង្កើតព្រឹត្តិការណ៍ថ្មី'"
            size="lg" hide-default-footer>
            <form class="app-form" novalidate @submit.prevent="handleSubmit">
                <div class="row g-3">
                    <div class="col-12">
                        <label class="small fw-bold">ចំណងជើង</label>
                        <input v-model="form.title" type="text" class="form-control"
                            :class="{ 'is-invalid': errors.title }" required @input="errors.title = ''"
                            @blur="validateForm">
                        <div v-if="errors.title" class="invalid-feedback">{{ errors.title }}</div>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">ថ្ងៃចាប់ផ្តើម</label>
                        <input v-model="form.startDate" type="datetime-local" class="form-control"
                            :class="{ 'is-invalid': errors.startDate }" required @input="errors.startDate = ''"
                            @blur="validateForm">
                        <div v-if="errors.startDate" class="invalid-feedback">{{ errors.startDate }}</div>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">ថ្ងៃបញ្ចប់</label>
                        <input v-model="form.endDate" type="datetime-local" class="form-control"
                            :class="{ 'is-invalid': errors.endDate }" required @input="errors.endDate = ''"
                            @blur="validateForm">
                        <div v-if="errors.endDate" class="invalid-feedback">{{ errors.endDate }}</div>
                    </div>
                    <div class="col-md-8">
                        <label class="small fw-bold">ទីតាំង</label>
                        <input v-model="form.location" type="text" class="form-control"
                            :class="{ 'is-invalid': errors.location }" required @input="errors.location = ''"
                            @blur="validateForm">
                        <div v-if="errors.location" class="invalid-feedback">{{ errors.location }}</div>
                    </div>
                    <div class="col-md-4">
                        <label class="small fw-bold">លេខសម្គាល់ប្រភេទ (Category ID)</label>
                        <input v-model.number="form.categoryId" type="number" class="form-control"
                            :class="{ 'is-invalid': errors.categoryId }" required @input="errors.categoryId = ''"
                            @blur="validateForm">
                        <div v-if="errors.categoryId" class="invalid-feedback">{{ errors.categoryId }}</div>
                    </div>
                    <div class="col-12">
                        <label class="small fw-bold">ការពិពណ៌នា</label>
                        <textarea v-model="form.description" class="form-control" rows="3"></textarea>
                    </div>
                </div>
            </form>

            <template #footer>
                <div class="modal-actions">
                    <BaseButton variant="light" @click="closeModal">បោះបង់</BaseButton>
                    <BaseButton type="submit" variant="primary" @click="handleSubmit"
                        :disabled="store.isLoading || isSubmitting" :loading="isSubmitting">
                        {{ isEditing ? 'រក្សាទុក' : 'បង្កើត' }}
                    </BaseButton>
                </div>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
.event-page {
    min-height: 100vh;
    padding: 1rem;
    background: #f8fafc;
}

.event-toolbar {
    gap: 1rem;
    flex-wrap: wrap;
}

.event-title {
    color: #216477;
}

.event-search {
    width: 220px;
    max-width: 100%;
}

.btn-white {
    background: white;
    border: none;
}

.object-fit-cover {
    object-fit: cover;
}

.table-thumbnail {
    width: 80px;
    height: 48px;
    object-fit: cover;
}

@media (max-width: 768px) {
    .event-page {
        padding: 0;
    }

    .event-search {
        width: 100%;
    }
}

</style>
