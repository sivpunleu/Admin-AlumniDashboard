<script setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
    EVENT_DESCRIPTION_MAX_LENGTH,
    EVENT_LOCATION_MAX_LENGTH,
    EVENT_THUMBNAIL_MAX_SIZE_LABEL,
    EVENT_TITLE_MAX_LENGTH,
    useEventStore,
} from '@/stores/eventStore';
import { useCategoryStore } from '@/stores/categoryStore';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import BaseModal from '@/components/UI/Base/BaseModal.vue';
import BasePage from '@/components/UI/Base/BasePage.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';

const store = useEventStore();
const categoryStore = useCategoryStore();
const router = useRouter();
const isModalOpen = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const isSubmitting = ref(false);
const defaultThumbnailUrl = 'https://via.placeholder.com/100x60?text=Default';
const thumbnailUploadHint = `អតិបរមា ${EVENT_THUMBNAIL_MAX_SIZE_LABEL}`;
const titleMaxLengthMessage = `ចំណងជើងមិនអាចលើស ${EVENT_TITLE_MAX_LENGTH} តួអក្សរបានទេ`;
const descriptionMaxLengthMessage = `ការពិពណ៌នាមិនអាចលើស ${EVENT_DESCRIPTION_MAX_LENGTH} តួអក្សរបានទេ`;
const locationMaxLengthMessage = `ទីតាំងមិនអាចលើស ${EVENT_LOCATION_MAX_LENGTH} តួអក្សរបានទេ`;

const tableColumns = [
    { key: 'title', label: 'ចំណងជើង' },
    { key: 'location', label: 'ទីតាំង' },
    { key: 'startDate', label: 'ថ្ងៃចាប់ផ្តើម' },
    { key: 'endDate', label: 'ថ្ងៃបញ្ចប់' },
    { key: 'thumbnail', label: 'រូបភាពតំណាង' },
    { key: 'actions', label: 'សកម្មភាព' }
];
const skeletonRows = Array.from({ length: 6 }, (_, index) => index);

const form = reactive({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    categoryId: 0
});
const errors = reactive({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    categoryId: ''
});

onMounted(() => {
    store.fetchEvents();
    categoryStore.fetchCategories();
});

watch(() => store.queryParams.search, () => {
    store.queryParams._page = 1;
    store.fetchEvents();
});

const handlePageChange = (page) => {
    store.queryParams._page = page;
    store.fetchEvents();
};

const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    Object.assign(form, { title: '', description: '', startDate: '', endDate: '', location: '', categoryId: 0 });
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
        categoryId: event.categoryId ?? event.category?.id ?? 0
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

const getTitleError = (required = false) => {
    const title = String(form.title || '').trim();

    if (!title && required) {
        return 'សូមបញ្ចូលចំណងជើង';
    }

    if (title.length > EVENT_TITLE_MAX_LENGTH) {
        return titleMaxLengthMessage;
    }

    return '';
};

const getDescriptionError = () => {
    const description = String(form.description || '').trim();

    if (description.length > EVENT_DESCRIPTION_MAX_LENGTH) {
        return descriptionMaxLengthMessage;
    }

    return '';
};

const getLocationError = (required = false) => {
    const location = String(form.location || '').trim();

    if (!location && required) {
        return 'សូមបញ្ចូលទីតាំង';
    }

    if (location.length > EVENT_LOCATION_MAX_LENGTH) {
        return locationMaxLengthMessage;
    }

    return '';
};

const validateTitleField = (required = false) => {
    errors.title = getTitleError(required);
};

const validateDescriptionField = () => {
    errors.description = getDescriptionError();
};

const validateLocationField = (required = false) => {
    errors.location = getLocationError(required);
};

const validateForm = () => {
    clearErrors();
    form.title = String(form.title || '').trim();
    form.description = String(form.description || '').trim();
    form.location = String(form.location || '').trim();

    const start = form.startDate ? new Date(form.startDate) : null;
    const end = form.endDate ? new Date(form.endDate) : null;
    const categoryId = Number(form.categoryId);
    const categoryExists = (categoryStore.categories || []).some(
        (category) => Number(category.id) === categoryId,
    );

    validateTitleField(true);
    validateDescriptionField();

    if (!form.startDate || Number.isNaN(start.getTime())) {
        errors.startDate = 'សូមជ្រើសរើសថ្ងៃចាប់ផ្តើម';
    }

    if (!form.endDate || Number.isNaN(end.getTime())) {
        errors.endDate = 'សូមជ្រើសរើសថ្ងៃបញ្ចប់';
    } else if (start && !Number.isNaN(start.getTime()) && end < start) {
        errors.endDate = 'ថ្ងៃបញ្ចប់ មិនអាចមុនថ្ងៃចាប់ផ្តើមឡើយ" ';
    }

    validateLocationField(true);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        errors.categoryId = 'សូមជ្រើសរើសប្រភេទព្រឹត្តិការណ៍';
    } else if ((categoryStore.categories || []).length > 0 && !categoryExists) {
        errors.categoryId = 'សូមជ្រើសរើសប្រភេទដែលមានក្នុងបញ្ជី';
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

const handleFileChange = async (e, id) => {
    const input = e.target;
    const file = input.files?.[0];
    if (file) await store.uploadThumbnail(id, file);
    input.value = '';
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
                <input v-model="store.queryParams.search" type="text"
                    class="event-search form-control rounded-pill px-3" aria-label="ស្វែងរកព្រឹត្តិការណ៍"
                    placeholder="ស្វែងរកព្រឹត្តិការណ៍...">
                <BaseButton @click="openAddModal" variant="primary">
                    <i class="bi bi-plus-circle me-2"></i> បង្កើតថ្មី
                </BaseButton>
            </div>
        </div>

        <div v-if="store.isLoading" class="event-skeleton-card bg-white rounded-4 shadow-sm border"
            aria-busy="true" aria-live="polite" aria-label="កំពុងផ្ទុកទិន្នន័យព្រឹត្តិការណ៍">
            <div class="event-skeleton-header">
                <span v-for="column in tableColumns" :key="column.key"
                    class="skeleton-placeholder skeleton-heading"></span>
            </div>
            <div class="event-table-skeleton">
                <div v-for="row in skeletonRows" :key="row" class="event-skeleton-row">
                    <span class="skeleton-title-lines">
                        <span class="skeleton-placeholder skeleton-line skeleton-line--title"></span>
                        <span class="skeleton-placeholder skeleton-line skeleton-line--id"></span>
                    </span>
                    <span class="skeleton-placeholder skeleton-line skeleton-line--location"></span>
                    <span class="skeleton-placeholder skeleton-pill skeleton-pill--date"></span>
                    <span class="skeleton-placeholder skeleton-pill skeleton-pill--date"></span>
                    <span class="skeleton-thumbnail-cell">
                        <span class="skeleton-placeholder skeleton-thumbnail"></span>
                        <span class="skeleton-placeholder skeleton-upload"></span>
                    </span>
                    <span class="skeleton-actions">
                        <span class="skeleton-placeholder skeleton-action"></span>
                        <span class="skeleton-placeholder skeleton-action"></span>
                        <span class="skeleton-placeholder skeleton-action"></span>
                    </span>
                </div>
            </div>
        </div>

        <!-- តារាងបង្ហាញទិន្នន័យ (Table Section) -->
        <div v-else>
            <BaseTable :columns="tableColumns" :data="store.events">
                <template #cell-title="{ item }">
                    <div class="event-title-cell">
                        <div class="event-title-cell__text fw-semibold text-emphasis" :title="item.title || '-'">
                            {{ item.title || '-' }}
                        </div>
                        <small class="text-muted">អត្តលេខ: {{ item.id }}</small>
                    </div>
                </template>

                <template #cell-location="{ item }">
                    <span class="event-location-text text-muted text-truncate" :title="item.location || '-'">
                        {{ item.location || '-' }}
                    </span>
                </template>

                <template #cell-startDate="{ item }">
                    {{ formatDateTime(item.startDate) }}
                </template>

                <template #cell-endDate="{ item }">
                    {{ formatDateTime(item.endDate) }}
                </template>

                <template #cell-thumbnail="{ item }">
                    <div class="thumbnail-cell">
                        <img :src="item.thumbnail || defaultThumbnailUrl" alt="thumbnail"
                            class="table-thumbnail rounded-2 border">
                        <div class="thumbnail-controls">
                            <div class="thumbnail-buttons">
                                <label
                                    :for="'file-' + item.id"
                                    class="btn btn-sm btn-white shadow-sm"
                                    :title="`បង្ហោះរូបភាពតំណាង (${thumbnailUploadHint})`"
                                    :aria-label="`បង្ហោះរូបភាពតំណាង (${thumbnailUploadHint})`"
                                >
                                    <i class="bi bi-camera"></i>
                                </label>
                                <input type="file" :id="'file-' + item.id" accept="image/*" hidden
                                    @change="handleFileChange($event, item.id)">
                                <button v-if="item.thumbnail" @click="store.deleteThumbnail(item.id)"
                                    class="btn btn-sm btn-outline-danger"
                                    title="លុបរូបភាពតំណាង ហើយប្រើរូបភាពលំនាំដើមវិញ"
                                    aria-label="លុបរូបភាពតំណាង ហើយប្រើរូបភាពលំនាំដើមវិញ">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                            <small class="thumbnail-hint">{{ thumbnailUploadHint }}</small>
                        </div>
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

            <div class="event-pagination page-toolbar border-top d-flex flex-column flex-md-row align-items-center justify-content-between py-3 px-4">
                <p class="small text-muted mb-0">សរុប: {{ store.totalItems }} ព្រឹត្តិការណ៍</p>
                <BasePage :currentPage="store.queryParams._page" :totalPages="store.totalPages"
                    @change-page="handlePageChange" />
            </div>
        </div>

        <!-- BaseModal -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'កែប្រែព្រឹត្តិការណ៍' : 'បង្កើតព្រឹត្តិការណ៍ថ្មី'"
            size="lg" hide-default-footer>
            <form class="app-form" novalidate @submit.prevent="handleSubmit">
                <div class="row g-3">
                    <div class="col-12">
                        <label class="small fw-bold">ចំណងជើង *</label>
                        <input v-model="form.title" type="text" class="form-control"
                            :class="{ 'is-invalid': errors.title }" required
                            @input="validateTitleField()" @blur="validateTitleField(true)">
                        <div v-if="errors.title" class="invalid-feedback">{{ errors.title }}</div>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">ថ្ងៃចាប់ផ្តើម *</label>
                        <input v-model="form.startDate" type="datetime-local" class="form-control"
                            :class="{ 'is-invalid': errors.startDate }" required @input="errors.startDate = ''"
                            @blur="validateForm">
                        <div v-if="errors.startDate" class="invalid-feedback">{{ errors.startDate }}</div>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">ថ្ងៃបញ្ចប់ *</label>
                        <input v-model="form.endDate" type="datetime-local" class="form-control"
                            :class="{ 'is-invalid': errors.endDate }" required @input="errors.endDate = ''"
                            @blur="validateForm">
                        <div v-if="errors.endDate" class="invalid-feedback">{{ errors.endDate }}</div>
                    </div>
                    <div class="col-md-8">
                        <label class="small fw-bold">ទីតាំង *</label>
                        <input v-model="form.location" type="text" class="form-control"
                            :class="{ 'is-invalid': errors.location }" required
                            @input="validateLocationField()" @blur="validateLocationField(true)">
                        <div v-if="errors.location" class="invalid-feedback">{{ errors.location }}</div>
                    </div>
                    <div class="col-md-4">
                        <label class="small fw-bold">ប្រភេទព្រឹត្តិការណ៍ *</label>
                        <select v-model.number="form.categoryId" class="form-control"
                            :class="{ 'is-invalid': errors.categoryId }" required @change="errors.categoryId = ''"
                            @blur="validateForm">
                            <option :value="0">សូមជ្រើសរើសប្រភេទ</option>
                            <option v-for="cat in categoryStore.categories" :key="cat.id" :value="cat.id">{{ cat.name }}
                            </option>
                        </select>
                        <div v-if="errors.categoryId" class="invalid-feedback">{{ errors.categoryId }}</div>
                    </div>
                    <div class="col-12">
                        <label class="small fw-bold">ការពិពណ៌នា </label>
                        <textarea v-model="form.description" class="form-control"
                            :class="{ 'is-invalid': errors.description }" rows="3"
                            @input="validateDescriptionField" @blur="validateDescriptionField"></textarea>
                        <div v-if="errors.description" class="invalid-feedback">{{ errors.description }}</div>
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

.event-pagination {
    justify-content: center;
    gap: 0.75rem 1.25rem;
    flex-wrap: wrap;
    padding: 1rem;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 0.125rem 0.5rem rgba(15, 23, 42, 0.06);
}

.event-title {
    color: #216477;
}

.event-search {
    width: 220px;
    max-width: 100%;
}

.event-title-cell {
    min-width: 0;
    max-width: clamp(180px, 22vw, 280px);
}

.event-title-cell__text {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.event-location-text {
    display: inline-block;
    max-width: clamp(140px, 18vw, 260px);
    vertical-align: middle;
}

.event-skeleton-card {
    overflow-x: auto;
}

.event-skeleton-header,
.event-skeleton-row {
    display: grid;
    grid-template-columns: minmax(200px, 1.25fr) minmax(150px, 0.8fr) minmax(140px, 0.75fr) minmax(140px, 0.75fr) minmax(150px, 0.9fr) minmax(130px, 0.65fr);
    align-items: center;
    gap: 1rem;
    min-width: 920px;
}

.event-skeleton-header {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #edf2f7;
}

.event-skeleton-row {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #edf2f7;
}

.event-skeleton-row:last-child {
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

.skeleton-title-lines,
.skeleton-thumbnail-cell {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
}

.skeleton-title-lines {
    display: grid;
    gap: 0.45rem;
}

.skeleton-line {
    height: 13px;
}

.skeleton-line--title {
    width: min(180px, 82%);
}

.skeleton-line--id {
    width: 82px;
    height: 10px;
}

.skeleton-line--location {
    width: min(130px, 78%);
}

.skeleton-pill {
    height: 24px;
}

.skeleton-pill--date {
    width: 118px;
}

.skeleton-thumbnail {
    width: 80px;
    height: 48px;
    flex: 0 0 auto;
    border-radius: 8px;
}

.skeleton-upload {
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
    border-radius: 8px;
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

.btn-white {
    background: white;
    border: 1px solid #e2e8f0;
}

.object-fit-cover {
    object-fit: cover;
}

.table-thumbnail {
    width: 80px;
    height: 48px;
    object-fit: cover;
}

.thumbnail-cell {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-width: 190px;
}

.thumbnail-controls {
    display: grid;
    gap: 0.2rem;
}

.thumbnail-buttons {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

.thumbnail-hint {
    color: #64748b;
    font-size: 0.72rem;
    line-height: 1.2;
    white-space: nowrap;
}

@media (max-width: 768px) {
    .event-page {
        padding: 0;
    }

    .event-search {
        width: 100%;
    }

    .event-skeleton-card {
        overflow-x: hidden;
    }

    .event-skeleton-header {
        display: none;
    }

    .event-skeleton-row {
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
