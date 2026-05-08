<script setup>
import { onMounted, ref, reactive, watch } from 'vue';
import { useEventStore } from '@/stores/eventStore';
import BaseModal from '@/components/UI/Base/BaseModal.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';

const store = useEventStore();
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

onMounted(() => store.fetchEvents());

watch(() => store.queryParams.search, () => {
    store.queryParams._page = 1;
    store.fetchEvents();
});

const openAddModal = () => {
    isEditing.value = false;
    currentId.value = null;
    Object.assign(form, { title: '', description: '', startDate: '', endDate: '', location: '', categoryId: 1 });
    isModalOpen.value = true;
};

const closeModal = () => {
    isModalOpen.value = false;
    isEditing.value = false;
    currentId.value = null;
};

const openEditModal = (event) => {
    isEditing.value = true;
    currentId.value = event.id;
    Object.assign(form, {
        title: event.title,
        description: event.description,
        startDate: event.startDate ? event.startDate.substring(0, 16) : '',
        endDate: event.endDate ? event.endDate.substring(0, 16) : '',
        location: event.location,
        categoryId: event.categoryId ?? event.category?.id ?? 1
    });
    isModalOpen.value = true;
};

const handleSubmit = async () => {
    if (isSubmitting.value) return;
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
    <div class="p-4 bg-light min-vh-100">
        <!-- ផ្នែកក្បាល (Header Section) -->
        <div class="d-flex justify-content-between align-items-center mb-4 bg-white p-4 rounded-4 shadow-sm">
            <h4 class="fw-bold mb-0" style="color: #216477;">ការគ្រប់គ្រងព្រឹត្តិការណ៍</h4>
            <div class="d-flex gap-2">
                <input v-model="store.queryParams.search" type="text" class="form-control rounded-pill px-3"
                    placeholder="ស្វែងរកព្រឹត្តិការណ៍...">
                <button @click="openAddModal"
                    class="btn btn-primary-custom px-6">ព្រឹត្តិការណ៍ថ្មី</button>
            </div>
        </div>

        <!-- ស្ថានភាពកំពុងផ្ទុក (Loading State) -->
        <div v-if="store.isLoading" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
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
                       
                        <button @click="openEditModal(item)"
                            class="btn btn-sm btn-outline-info ">កែប្រែ</button>
                        <button @click="store.deleteEvent(item.id)"
                            class="btn btn-sm btn-outline-danger rounded-pill">លុប</button>
                            <router-link :to="`/events/${item.id}/participants`"
                            class="btn btn-sm btn-outline-secondary rounded-pill" title="មើលបញ្ជីអ្នកចូលរួម">
                            <i class="bi bi-people-fill"></i>
                        </router-link>
                    </div>
                </template>
            </BaseTable>

            <!-- ករណីគ្មានទិន្នន័យ -->
            <div v-if="store.events.length === 0" class="text-center text-muted py-5">
                រកមិនឃើញព្រឹត្តិការណ៍ឡើយ។
            </div>
        </div>

        <!-- ផ្ទាំង Modal សម្រាប់បង្កើត/កែប្រែ -->
        <BaseModal v-model="isModalOpen" :title="isEditing ? 'កែប្រែព្រឹត្តិការណ៍' : 'បង្កើតព្រឹត្តិការណ៍ថ្មី'"
            size="lg" hide-default-footer>
            <form @submit.prevent="handleSubmit">
                <div class="row g-3">
                    <div class="col-12">
                        <label class="small fw-bold">ចំណងជើង</label>
                        <input v-model="form.title" type="text" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">ថ្ងៃចាប់ផ្តើម</label>
                        <input v-model="form.startDate" type="datetime-local" class="form-control" required>
                    </div>
                    <div class="col-md-6">
                        <label class="small fw-bold">ថ្ងៃបញ្ចប់</label>
                        <input v-model="form.endDate" type="datetime-local" class="form-control" required>
                    </div>
                    <div class="col-md-8">
                        <label class="small fw-bold">ទីតាំង</label>
                        <input v-model="form.location" type="text" class="form-control" required>
                    </div>
                    <div class="col-md-4">
                        <label class="small fw-bold">លេខសម្គាល់ប្រភេទ (Category ID)</label>
                        <input v-model.number="form.categoryId" type="number" class="form-control" required>
                    </div>
                    <div class="col-12">
                        <label class="small fw-bold">ការពិពណ៌នា</label>
                        <textarea v-model="form.description" class="form-control" rows="3"></textarea>
                    </div>
                </div>
            </form>

            <template #footer>
                <button type="button" class="btn btn-light px-4" @click="closeModal">បោះបង់</button>
                <button type="button" class="btn btn-primary-custom px-4 shadow-sm" @click="handleSubmit"
                    :disabled="store.isLoading || isSubmitting">
                    រក្សាទុក
                </button>
            </template>
        </BaseModal>
    </div>
</template>

<style scoped>
.btn-primary-custom {
    background: #216477;
    color: white;
    border: none;
    
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
</style>