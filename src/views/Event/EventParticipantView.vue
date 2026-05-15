<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEventStore } from '@/stores/eventStore';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';

const props = defineProps({
    id: {
        type: [String, Number],
        default: ''
    }
});

const store = useEventStore();
const router = useRouter();

const selectedEventId = ref('');
const selectedResponseStatus = ref('attending');
const selectedParticipant = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const eventExists = ref(false);
const isResponding = ref(false);
const participantGroups = reactive({
    attending: [],
    interested: [],
    declined: []
});

const statuses = [
    { value: 'attending', label: 'នឹងចូលរួម', color: 'text-success', bg: 'bg-success', icon: 'bi-check-circle' },
    { value: 'interested', label: 'ចាប់អារម្មណ៍', color: 'text-info', bg: 'bg-info', icon: 'bi-star' },
    { value: 'declined', label: 'មិនចូលរួម', color: 'text-danger', bg: 'bg-danger', icon: 'bi-x-circle' }
];

const eventColumns = [
    { key: 'id', label: 'លេខសម្គាល់' },
    { key: 'title', label: 'ចំណងជើង' },
    { key: 'location', label: 'ទីតាំង' },
    { key: 'startDate', label: 'ថ្ងៃចាប់ផ្តើម' },
    { key: 'actions', label: 'សកម្មភាព' }
];

const participantColumns = [
    { key: 'id', label: 'លេខកូដ' },
    { key: 'name', label: 'ឈ្មោះ' },
    { key: 'email', label: 'អ៊ីមែល' },
    { key: 'status', label: 'ស្ថានភាព' },
    { key: 'responseAt', label: 'កាលបរិច្ឆេទ' },
    { key: 'actions', label: 'សកម្មភាព' }
];

const selectedEvent = computed(() => {
    const eventId = String(selectedEventId.value || '').trim();
    if (!eventId) return null;
    return store.events.find((event) => String(event.id) === eventId) || store.selectedEvent;
});

const totalParticipants = computed(() => (
    participantGroups.attending.length
    + participantGroups.interested.length
    + participantGroups.declined.length
));

const clearParticipantGroups = (resetSelection = true) => {
    statuses.forEach((status) => {
        participantGroups[status.value] = [];
    });
    store.participants = [];
    if (resetSelection) selectedParticipant.value = null;
};

const isValidStatus = (status) => statuses.some((item) => item.value === status);

const getApiMessage = (error, fallback) => error?.response?.data?.message || fallback;

const loadEventList = async () => {
    await store.fetchEvents();
};

const ensureSelectedEventExists = async (resetSelection = true) => {
    const eventId = String(selectedEventId.value || '').trim();
    eventExists.value = false;
    clearParticipantGroups(resetSelection);

    if (!eventId) {
        errorMessage.value = 'សូមជ្រើសរើសព្រឹត្តិការណ៍ជាមុនសិន។';
        return false;
    }

    const event = await store.fetchEvent(eventId);
    if (!event) {
        errorMessage.value = 'រកមិនឃើញព្រឹត្តិការណ៍នេះទេ។ សូមជ្រើសរើសព្រឹត្តិការណ៍ដែលមានស្រាប់។';
        return false;
    }

    eventExists.value = true;
    return true;
};

const queryParticipantRecords = async () => {
    if (!eventExists.value) return false;

    for (const status of statuses) {
        const success = await store.fetchParticipants(selectedEventId.value, status.value);
        if (!success) {
            errorMessage.value = 'មិនអាចទាញយកបញ្ជីអ្នកចូលរួមបានទេ។';
            return false;
        }
        participantGroups[status.value] = [...store.participants];
    }

    return true;
};

const openEventDetail = async (eventId = selectedEventId.value) => {
    selectedEventId.value = String(eventId || '').trim();
    errorMessage.value = '';
    successMessage.value = '';

    const exists = await ensureSelectedEventExists(false);
    if (!exists) return;

    await queryParticipantRecords();

    if (selectedEventId.value) {
        router.replace({ name: 'participant', params: { id: selectedEventId.value } });
    } else {
        router.replace({ name: 'participant' });
    }
};

const initializeParticipantInformationFlow = async () => {
    errorMessage.value = '';
    successMessage.value = '';
    await loadEventList();

    if (props.id) {
        selectedEventId.value = String(props.id);
        await openEventDetail(selectedEventId.value);
        return;
    }

    if (store.events.length && !selectedEventId.value) {
        selectedEventId.value = String(store.events[0].id);
        await openEventDetail(selectedEventId.value);
    }
};

const updateParticipantResponse = async () => {
    errorMessage.value = '';
    successMessage.value = '';

    const exists = await ensureSelectedEventExists();
    if (!exists) return;

    if (!selectedParticipant.value) {
        errorMessage.value = 'សូមជ្រើសរើសអ្នកចូលរួមជាមុនសិន។';
        return;
    }

    if (!isValidStatus(selectedResponseStatus.value)) {
        errorMessage.value = 'ស្ថានភាពមិនត្រឹមត្រូវទេ។ សូមជ្រើសរើស នឹងចូលរួម ចាប់អារម្មណ៍ ឬ មិនចូលរួម។';
        return;
    }

    isResponding.value = true;
    try {
        const success = await store.respondToEvent(
            selectedEventId.value,
            selectedResponseStatus.value,
            selectedParticipant.value
        );
        if (!success) {
            errorMessage.value = 'មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពអ្នកចូលរួមបានទេ។';
            return;
        }

        await queryParticipantRecords();
        selectedParticipant.value = null;
        successMessage.value = 'បានធ្វើបច្ចុប្បន្នភាពបញ្ជីអ្នកចូលរួមដោយជោគជ័យ។';
    } catch (error) {
        errorMessage.value = getApiMessage(error, 'មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពអ្នកចូលរួមបានទេ។');
    } finally {
        isResponding.value = false;
    }
};

const getStatusMeta = (status) => statuses.find((item) => item.value === status) || statuses[0];

const getStatusBadge = (status) => {
    const meta = getStatusMeta(status);
    return `badge ${meta.bg} bg-opacity-10 ${meta.color}`;
};

const getParticipantName = (participant) => {
    const candidate = participant?.user?.profile?.fullname
        || participant?.user?.fullname
        || participant?.user?.fullName
        || participant?.user?.name
        || participant?.fullname
        || participant?.fullName
        || participant?.name
        || participant?.username;

    if (typeof candidate !== 'string') return '-';
    const trimmed = candidate.trim();
    return trimmed || '-';
};

const getParticipantEmail = (participant) => {
    const candidate = participant?.user?.email || participant?.email;
    if (typeof candidate !== 'string') return '-';
    const trimmed = candidate.trim();
    return trimmed || '-';
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('km-KH');
};

const getResponseAt = (participant) => participant?.updatedAt || participant?.createdAt;

const selectParticipantForUpdate = (participant, currentStatus) => {
    selectedParticipant.value = participant;
    selectedResponseStatus.value = participant?.status || currentStatus || 'attending';
    errorMessage.value = '';
    successMessage.value = '';
};

onMounted(initializeParticipantInformationFlow);

watch(() => props.id, async (newId) => {
    if (!newId) return;
    await openEventDetail(newId);
});
</script>

<template>
    <div class="participant-page">

        <div class="participant-toolbar page-toolbar mb-4 bg-white p-4 rounded-4 shadow-sm">
            <!-- back -->
            <div>

                <h4 class="participant-title fw-bold mb-1">
                    <BaseButton @click="router.back()" variant="light" size="sm" class="me-2">
                        <i class="bi bi-arrow-left me-1"></i>
                    </BaseButton>
                    ការចូលរួមព្រឹត្តិការណ៍</h4>
                <p class="text-muted mb-0 small text-truncate">ជ្រើសរើសព្រឹត្តិការណ៍ ដើម្បីមើលព័ត៌មានអ្នកចូលរួមតាមស្ថានភាព។</p>
            </div>
            <div class="page-toolbar__actions participant-toolbar__actions">
                <select v-model="selectedEventId" class="participant-event-select form-select rounded-pill px-3"
                    @change="openEventDetail()">
                    <option value="">ជ្រើសរើសព្រឹត្តិការណ៍</option>
                    <option v-for="event in store.events" :key="event.id" :value="event.id">
                        {{ event.title }} (ID: {{ event.id }})
                    </option>
                </select>
            </div>
        </div>

        <div v-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="alert alert-success">
            {{ successMessage }}
        </div>

        <div v-if="store.isLoading && !isResponding" class="app-state bg-white rounded-4 shadow-sm">
            <div>
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-3 mb-0">កំពុងទាញយកទិន្នន័យ...</p>
            </div>
        </div>

        <template v-else>
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-white border-0 pt-4 px-4">
                    <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div>
                            <h5 class="fw-bold mb-1">បញ្ជីព្រឹត្តិការណ៍</h5>
                            <p class="text-muted mb-0 small">ចុចមើល ដើម្បីបើកព័ត៌មានលម្អិតតាមលេខសម្គាល់។</p>
                        </div>
                        <BaseButton @click="loadEventList" variant="light">
                            <i class="bi bi-arrow-clockwise me-1"></i>

                        </BaseButton>
                    </div>
                </div>
                <div class="card-body p-0">
                    <BaseTable :columns="eventColumns" :data="store.events">
                        <template #cell-title="{ item }">
                            <div class="fw-semibold">{{ item.title }}</div>
                            <small class="text-muted">{{ item.description || '-' }}</small>
                        </template>

                        <template #cell-location="{ item }">
                            {{ item.location || '-' }}
                        </template>

                        <template #cell-startDate="{ item }">
                            {{ formatDateTime(item.startDate) }}
                        </template>

                        <template #cell-actions="{ item }">
                            <BaseButton @click="openEventDetail(item.id)" variant="primary" size="sm">
                                <i class="bi bi-eye me-1"></i>
                                មើល
                            </BaseButton>
                        </template>
                    </BaseTable>
                </div>
            </div>

            <div v-if="eventExists" class="row g-4">
                <div class="col-12 col-xl-4">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body p-4">
                            <h5 class="fw-bold mb-3">ស្ថានភាពឆ្លើយតប</h5>
                            <div class="selected-event mb-4">
                                <div class="small text-muted mb-1">ព្រឹត្តិការណ៍ដែលបានជ្រើសរើស</div>
                                <div class="fw-semibold">{{ selectedEvent?.title || '-' }}</div>
                                <div class="text-muted small">ID: {{ selectedEventId }}</div>
                            </div>

                            <div class="selected-event mb-4">
                                <div class="small text-muted mb-1">អ្នកចូលរួមដែលបានជ្រើសរើស</div>
                                <div class="fw-semibold">{{ selectedParticipant ?
                                    getParticipantName(selectedParticipant) : '-' }}
                                </div>
                                <div class="text-muted small">{{ selectedParticipant ?
                                    getParticipantEmail(selectedParticipant) :
                                    'ជ្រើសរើសមួយជួរពីបញ្ជីអ្នកចូលរួម។' }}</div>
                            </div>

                            <label class="small fw-bold mb-2">ជ្រើសរើសស្ថានភាព</label>
                            <div class="status-options mb-4">
                                <label v-for="status in statuses" :key="status.value" class="status-option"
                                    :class="{ active: selectedResponseStatus === status.value }">
                                    <input v-model="selectedResponseStatus" class="form-check-input" type="radio"
                                        :value="status.value">
                                    <span :class="status.color">
                                        <i :class="['bi', status.icon, 'me-2']"></i>
                                        {{ status.label }}
                                    </span>
                                </label>
                            </div>

                            <button type="button" class="btn btn-primary-custom w-100 rounded-pill"
                                :disabled="isResponding || store.isLoading" @click="updateParticipantResponse">
                                <span v-if="isResponding" class="spinner-border spinner-border-sm me-2"></span>
                                ធ្វើបច្ចុប្បន្នភាពបញ្ជីអ្នកចូលរួម
                            </button>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-xl-8">
                    <div class="row g-3 mb-4">
                        <div v-for="status in statuses" :key="status.value" class="col-12 col-md-4">
                            <div class="status-summary bg-white shadow-sm">
                                <div :class="['status-summary__icon', status.bg, 'bg-opacity-10', status.color]">
                                    <i :class="['bi', status.icon]"></i>
                                </div>
                                <div>
                                    <div class="text-muted small">{{ status.label }}</div>
                                    <div class="fw-bold fs-4">{{ participantGroups[status.value].length }}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 shadow-sm">
                        <div class="card-header bg-white border-0 p-4">
                            <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                                <div>
                                    <h5 class="fw-bold mb-1">ព័ត៌មានអ្នកចូលរួម</h5>
                                    <p class="text-muted mb-0 small">សរុប {{ totalParticipants }} នាក់</p>
                                </div>
                                <BaseButton @click="queryParticipantRecords" variant="light">
                                    <i class="bi bi-arrow-clockwise me-1"></i>

                                </BaseButton>
                            </div>
                        </div>

                        <div class="participant-sections">
                            <section v-for="status in statuses" :key="status.value" class="participant-section">
                                <div class="section-heading">
                                    <span :class="['section-heading__marker', status.bg]"></span>
                                    <span class="fw-semibold">{{ status.label }}</span>
                                    <span class="text-muted small">({{ participantGroups[status.value].length }})</span>
                                </div>

                                <BaseTable :columns="participantColumns" :data="participantGroups[status.value]">
                                    <template #cell-name="{ item }">
                                        {{ getParticipantName(item) }}
                                    </template>

                                    <template #cell-email="{ item }">
                                        {{ getParticipantEmail(item) }}
                                    </template>

                                    <template #cell-status="{ item }">
                                        <span :class="getStatusBadge(item.status || status.value)">
                                            {{ getStatusMeta(item.status || status.value).label }}
                                        </span>
                                    </template>

                                    <template #cell-responseAt="{ item }">
                                        {{ formatDateTime(getResponseAt(item)) }}
                                    </template>

                                    <template #cell-actions="{ item }">
                                        <BaseButton @click="selectParticipantForUpdate(item, status.value)"
                                            variant="outline" size="sm"
                                            :class="{ active: selectedParticipant?.id === item.id }">
                                            ជ្រើសរើស
                                        </BaseButton>
                                    </template>

                                    <template #empty>
                                        <div class="participant-empty">
                                            <div :class="['participant-empty__icon', status.bg, 'bg-opacity-10', status.color]">
                                                <i :class="['bi', status.icon]"></i>
                                            </div>
                                            <div>
                                                <div class="fw-semibold">មិនទាន់មានអ្នកចូលរួមក្នុងស្ថានភាពនេះទេ</div>
                                                <div class="text-muted small">
                                                    អ្នកចូលរួមនឹងបង្ហាញនៅទីនេះ បន្ទាប់ពីពួកគេឆ្លើយតបព្រឹត្តិការណ៍នេះ។
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </BaseTable>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.participant-page {
    min-height: 100vh;
    padding: 1rem;
    background: #f8fafc;
}

.participant-toolbar {
    gap: 1rem;
    flex-wrap: wrap;
}

.participant-title {
    color: #216477;
}

.participant-toolbar__actions {
    min-width: min(100%, 360px);
}

.participant-event-select {
    width: 100%;
}

.selected-event {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    background: #f8fafc;
}

.status-options {
    display: grid;
    gap: 10px;
}

.status-option {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    cursor: pointer;
}

.status-option.active {
    border-color: #216477;
    background: #f0f7f9;
}

.status-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 88px;
    padding: 16px;
    border-radius: 8px;
}

.status-summary__icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
}

.participant-sections {
    display: grid;
    gap: 24px;
    padding-bottom: 24px;
}

.participant-section {
    border-top: 1px solid #e2e8f0;
}

.section-heading {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 24px 0;
}

.section-heading__marker {
    width: 10px;
    height: 10px;
    border-radius: 50%;
}

.participant-empty {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 96px;
    padding: 20px 24px;
    color: #334155;
}

.participant-empty__icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 8px;
}

@media (max-width: 768px) {
    .participant-page {
        padding: 0;
    }

    .participant-toolbar {
        align-items: stretch !important;
    }

    .participant-toolbar__actions {
        min-width: 0;
        width: 100%;
    }

    .participant-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .participant-empty {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
