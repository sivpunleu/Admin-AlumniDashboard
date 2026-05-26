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
const activeStatus = ref('attending');
const errorMessage = ref('');
const successMessage = ref('');
const eventExists = ref(false);
const participantGroups = reactive({
    attending: [],
    interested: [],
    declined: []
});

const statuses = [
    { value: 'attending', label: 'អ្នកចូលរួម', color: 'text-success', bg: 'bg-success', icon: 'bi-check-circle' },
    { value: 'interested', label: 'អ្នកចាប់អារម្មណ៍', color: 'text-info', bg: 'bg-info', icon: 'bi-star' },
    { value: 'declined', label: 'អ្នកមិនចាប់អារម្មណ៍', color: 'text-danger', bg: 'bg-danger', icon: 'bi-x-circle' }
];

const statusToneMap = {
    attending: { accent: '#198754', soft: '#eaf7ef' },
    interested: { accent: '#0f6da8', soft: '#e8f4ff' },
    declined: { accent: '#dc3545', soft: '#fff1f2' }
};

const participantColumns = [
    { key: 'name', label: 'ឈ្មោះ' },
    { key: 'email', label: 'អ៊ីមែល' },
    { key: 'status', label: 'ស្ថានភាព' },
    { key: 'responseAt', label: 'កាលបរិច្ឆេទ' }
];
const statusSkeletons = Array.from({ length: 3 }, (_, index) => index);
const participantSkeletonRows = Array.from({ length: 6 }, (_, index) => index);

const selectedEvent = computed(() => {
    const eventId = String(selectedEventId.value || '').trim();
    if (!eventId) return null;
    return store.events.find((event) => String(event.id) === eventId) || store.selectedEvent;
});

const selectedEventOptionLabel = computed(() => {
    const event = selectedEvent.value;
    if (!event) return '';

    return `${event.title || '-'} (ID: ${event.id ?? selectedEventId.value ?? '-'})`;
});

const totalParticipants = computed(() => (
    participantGroups.attending.length
    + participantGroups.interested.length
    + participantGroups.declined.length
));

const activeParticipantRows = computed(() => participantGroups[activeStatus.value] || []);

const activeParticipantCount = computed(() => activeParticipantRows.value.length);

const clearParticipantGroups = () => {
    statuses.forEach((status) => {
        participantGroups[status.value] = [];
    });
    store.participants = [];
};

const isValidStatus = (status) => statuses.some((item) => item.value === status);

const loadEventList = async () => {
    await store.fetchEvents();
};

const ensureSelectedEventExists = async (resetGroups = true) => {
    const eventId = String(selectedEventId.value || '').trim();
    eventExists.value = false;
    if (resetGroups) clearParticipantGroups();

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
    activeStatus.value = 'attending';

    const exists = await ensureSelectedEventExists();
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
    }
};

const getStatusMeta = (status) => statuses.find((item) => item.value === status) || statuses[0];

const activeStatusMeta = computed(() => getStatusMeta(activeStatus.value));

const getStatusStyle = (status) => {
    const tone = statusToneMap[status] || statusToneMap.attending;
    return {
        '--status-accent': tone.accent,
        '--status-soft': tone.soft
    };
};

const setActiveStatus = (status) => {
    if (!isValidStatus(status)) return;
    activeStatus.value = status;
    errorMessage.value = '';
    successMessage.value = '';
};

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

const getParticipantInitial = (participant) => {
    const name = getParticipantName(participant);
    return name && name !== '-' ? name.charAt(0).toUpperCase() : '?';
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('km-KH');
};

const getResponseAt = (participant) => participant?.updatedAt || participant?.createdAt;

onMounted(initializeParticipantInformationFlow);

watch(() => props.id, async (newId) => {
    if (!newId) return;
    await openEventDetail(newId);
});
</script>

<template>
    <div class="participant-page">
        <div class="participant-toolbar page-toolbar mb-4">
            <div class="participant-heading">
                <BaseButton @click="router.back()" variant="light" size="sm" shape="sharp" class="participant-back"
                    title="Back" aria-label="Back">
                    <i class="bi bi-arrow-left"></i>
                </BaseButton>
                <div class="min-w-0">
                    <h3 class="fw-bold text-dark mb-1">ការចូលរួមព្រឹត្តិការណ៍</h3>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb mb-0">
                            <li class="breadcrumb-item">
                                <router-link :to="{ name: 'home' }" class="text-decoration-none">
                                    ផ្ទាំងគ្រប់គ្រង
                                </router-link>
                            </li>
                            <li class="breadcrumb-item active">អ្នកចូលរួម</li>
                        </ol>
                    </nav>
                </div>
            </div>

            <div class="participant-toolbar__actions">
                <div class="participant-select-wrap">
                    <i class="bi bi-calendar-event participant-select-wrap__icon"></i>
                    <select v-model="selectedEventId" class="participant-event-select form-select"
                        aria-label="ជ្រើសរើសព្រឹត្តិការណ៍" :title="selectedEventOptionLabel"
                        @change="openEventDetail()">
                        <option value="" title="ជ្រើសរើសព្រឹត្តិការណ៍">ជ្រើសរើសព្រឹត្តិការណ៍</option>
                        <option v-for="event in store.events" :key="event.id" :value="event.id"
                            :title="`${event.title || '-'} (ID: ${event.id})`">
                            {{ event.title || '-' }} (ID: {{ event.id }})
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <div v-if="errorMessage" class="participant-alert participant-alert--danger mb-3">
            <i class="bi bi-exclamation-circle"></i>
            <span>{{ errorMessage }}</span>
        </div>
        <div v-if="successMessage" class="participant-alert participant-alert--success mb-3">
            <i class="bi bi-check-circle"></i>
            <span>{{ successMessage }}</span>
        </div>

        <div v-if="store.isLoading" class="participant-skeleton" aria-busy="true" aria-live="polite"
            aria-label="កំពុងផ្ទុកទិន្នន័យអ្នកចូលរួម">
            <section class="participant-panel selected-event-panel participant-skeleton-event">
                <div class="selected-event-main">
                    <span class="skeleton-placeholder skeleton-event-icon"></span>
                    <span class="skeleton-event-copy">
                        <span class="skeleton-placeholder skeleton-line skeleton-line--eyebrow"></span>
                        <span class="skeleton-placeholder skeleton-line skeleton-line--title"></span>
                        <span class="skeleton-meta-row">
                            <span class="skeleton-placeholder skeleton-pill skeleton-pill--small"></span>
                            <span class="skeleton-placeholder skeleton-pill skeleton-pill--meta"></span>
                            <span class="skeleton-placeholder skeleton-pill skeleton-pill--date"></span>
                        </span>
                    </span>
                </div>
                <div class="selected-event-total skeleton-total-panel">
                    <span class="skeleton-placeholder skeleton-total-number"></span>
                    <span class="skeleton-placeholder skeleton-total-label"></span>
                </div>
            </section>

            <section class="status-grid">
                <div v-for="item in statusSkeletons" :key="item" class="status-card skeleton-status-card">
                    <span class="skeleton-placeholder skeleton-status-icon"></span>
                    <span class="skeleton-status-copy">
                        <span class="skeleton-placeholder skeleton-line skeleton-line--status-label"></span>
                        <span class="skeleton-placeholder skeleton-line skeleton-line--status-count"></span>
                    </span>
                </div>
            </section>

            <section class="participant-panel records-panel participant-skeleton-records">
                <div class="panel-header">
                    <div class="records-title">
                        <span class="records-dot"></span>
                        <div class="skeleton-records-heading">
                            <span class="skeleton-placeholder skeleton-line skeleton-line--records-title"></span>
                            <span class="skeleton-placeholder skeleton-line skeleton-line--records-subtitle"></span>
                        </div>
                    </div>
                    <span class="skeleton-placeholder skeleton-refresh"></span>
                </div>

                <div class="participant-table-skeleton">
                    <div class="skeleton-table-header">
                        <span v-for="column in participantColumns" :key="column.key"
                            class="skeleton-placeholder skeleton-heading"></span>
                    </div>
                    <div v-for="row in participantSkeletonRows" :key="row" class="skeleton-table-row">
                        <span class="skeleton-person-cell">
                            <span class="skeleton-placeholder skeleton-avatar"></span>
                            <span class="skeleton-placeholder skeleton-line skeleton-line--person"></span>
                        </span>
                        <span class="skeleton-placeholder skeleton-line skeleton-line--email"></span>
                        <span class="skeleton-placeholder skeleton-pill skeleton-pill--status"></span>
                        <span class="skeleton-placeholder skeleton-line skeleton-line--response"></span>
                    </div>
                </div>
            </section>
        </div>

        <template v-else>
                <main class="participant-detail">
                    <div v-if="!eventExists" class="participant-panel empty-detail">
                        <div class="app-state__icon"><i class="bi bi-calendar2-event"></i></div>
                        <h5 class="fw-bold mb-2">ជ្រើសរើសព្រឹត្តិការណ៍</h5>
                        <p class="text-muted mb-0 small">ព័ត៌មានអ្នកចូលរួមនឹងបង្ហាញនៅទីនេះបន្ទាប់ពីជ្រើសរើស event។</p>
                    </div>

                    <template v-else>
                        <section class="participant-panel selected-event-panel">
                            <div class="selected-event-main">
                                <div class="selected-event-icon">
                                    <i class="bi bi-calendar2-check"></i>
                                </div>
                                <div class="min-w-0">
                                    <div class="text-muted small fw-bold mb-1">ឈ្មោះព្រឹត្តិការណ៍</div>
                                    <h4 class="fw-bold mb-2 text-truncate">{{ selectedEvent?.title || '-' }}</h4>
                                    <div class="selected-event-meta">
                                        <span><i class="bi bi-hash"></i>{{ selectedEventId }}</span>
                                        <span><i class="bi bi-geo-alt"></i>{{ selectedEvent?.location || '-' }}</span>
                                        <span><i class="bi bi-clock"></i>{{ formatDateTime(selectedEvent?.startDate) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="selected-event-total">
                                <strong class="fw-bold text-center">{{ totalParticipants }}</strong>
                                <span class="text-center">អ្នកចូលរួមសរុប</span>
                            </div>
                        </section>

                        <section class="status-grid">
                            <button v-for="status in statuses" :key="status.value" type="button" class="status-card"
                                :class="{ active: activeStatus === status.value }"
                                :style="getStatusStyle(status.value)" :aria-pressed="activeStatus === status.value"
                                @click="setActiveStatus(status.value)">
                                <span class="status-card__icon"><i :class="['bi', status.icon]"></i></span>
                                <span>
                                    <span class="status-card__label">{{ status.label }}</span>
                                    <strong>{{ participantGroups[status.value].length }}</strong>
                                </span>
                            </button>
                        </section>

                        <section class="participant-panel records-panel" :style="getStatusStyle(activeStatus)">
                            <div class="panel-header">
                                <div class="records-title">
                                    <span class="records-dot"></span>
                                    <div>
                                        <h5 class="fw-bold mb-1">{{ activeStatusMeta.label }}</h5>
                                        <p class="text-muted small mb-0">{{ activeParticipantCount }}អ្នកក្នុងស្ថានភាពនេះ</p>
                                    </div>
                                </div>
                                <BaseButton @click="queryParticipantRecords" variant="light" size="sm" shape="sharp"
                                    title="Refresh">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </BaseButton>
                            </div>

                            <BaseTable :columns="participantColumns" :data="activeParticipantRows" min-width="640px">
                                <template #cell-name="{ item }">
                                    <div class="participant-person">
                                        <span class="participant-avatar">{{ getParticipantInitial(item) }}</span>
                                        <span class="participant-person__copy">
                                            <span class="participant-person__name" :title="getParticipantName(item)">
                                                {{ getParticipantName(item) }}
                                            </span>
                                            <!-- <small class="text-muted">ID: {{ item.id ?? '-' }}</small> -->
                                        </span>
                                    </div>
                                </template>

                                <template #cell-email="{ item }">
                                    <span class="participant-email-cell" :title="getParticipantEmail(item)">
                                        {{ getParticipantEmail(item) }}
                                    </span>
                                </template>

                                <template #cell-status="{ item }">
                                    <span :class="getStatusBadge(item.status || activeStatus)">
                                        {{ getStatusMeta(item.status || activeStatus).label }}
                                    </span>
                                </template>

                                <template #cell-responseAt="{ item }">
                                    {{ formatDateTime(getResponseAt(item)) }}
                                </template>

                                <template #empty>
                                    <div class="participant-empty">
                                        <div class="participant-empty__icon">
                                            <i :class="['bi', activeStatusMeta.icon]"></i>
                                        </div>
                                        <div>
                                            <div class="fw-semibold">មិនទាន់មានអ្នកចូលរួមក្នុងស្ថានភាពនេះទេ</div>
                                            <div class="text-muted small">ទិន្នន័យនឹងបង្ហាញបន្ទាប់ពីមានការឆ្លើយតប។</div>
                                        </div>
                                    </div>
                                </template>
                            </BaseTable>
                        </section>
                    </template>
                </main>
        </template>
    </div>
</template>

<style scoped>
.participant-page {
    --participant-primary: #216477;
    --participant-primary-hover: #1a4f5d;
    --participant-border: #e2e8f0;
    --participant-muted: #64748b;
    --participant-surface: #ffffff;
    --participant-soft: #f1f7f9;
    min-height: 100vh;
    padding: 1rem;
    background: #f8fafc;
}

.min-w-0 {
    min-width: 0;
}

.participant-toolbar {
    align-items: center;
    flex-wrap: wrap;
    padding: 1rem 1.25rem;
    border: 1px solid var(--participant-border);
    border-radius: 12px;
    background: var(--participant-surface);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.participant-heading {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
}

.participant-back {
    width: 38px;
    height: 38px;
    padding: 0 !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
}

.participant-toolbar__actions {
    width: clamp(280px, 34vw, 460px);
}

.participant-select-wrap {
    position: relative;
    width: 100%;
    min-width: 0;
}

.participant-select-wrap__icon {
    position: absolute;
    top: 50%;
    left: 14px;
    z-index: 2;
    color: var(--participant-primary);
    transform: translateY(-50%);
    pointer-events: none;
}

.participant-event-select {
    width: 100%;
    min-width: 0;
    min-height: 46px;
    padding-left: 2.65rem !important;
    padding-right: 2.5rem !important;
    border-color: var(--participant-border);
    border-radius: 999px;
    color: #0f172a;
    font-weight: 600;
    overflow: hidden;
    box-shadow: none;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.participant-event-select:focus {
    border-color: var(--participant-primary);
    box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.1);
}

.participant-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.8rem 1rem;
    border: 1px solid;
    border-radius: 10px;
    font-size: 0.9rem;
    font-weight: 700;
}

.participant-alert--danger {
    border-color: #fecaca;
    background: #fff1f2;
    color: #9f1239;
}

.participant-alert--success {
    border-color: #bbf7d0;
    background: #f0fdf4;
    color: #166534;
}

.participant-layout {
    display: grid;
    grid-template-columns: minmax(290px, 340px) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
}

.participant-panel {
    overflow: hidden;
    border: 1px solid var(--participant-border);
    border-radius: 12px;
    background: var(--participant-surface);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.participant-skeleton {
    display: grid;
    gap: 1rem;
}

.participant-skeleton-records,
.skeleton-status-card {
    --status-accent: var(--participant-primary);
    --status-soft: var(--participant-soft);
}

.skeleton-status-card {
    pointer-events: none;
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

.skeleton-event-icon {
    width: 50px;
    height: 50px;
    flex: 0 0 auto;
    border-radius: 10px;
}

.skeleton-event-copy,
.skeleton-records-heading,
.skeleton-status-copy {
    display: grid;
    gap: 0.45rem;
    min-width: 0;
}

.skeleton-event-copy {
    width: 100%;
}

.skeleton-line {
    height: 12px;
}

.skeleton-line--eyebrow {
    width: 92px;
    height: 10px;
}

.skeleton-line--title {
    width: min(320px, 76%);
    height: 22px;
    border-radius: 8px;
}

.skeleton-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.skeleton-pill {
    height: 24px;
}

.skeleton-pill--small {
    width: 58px;
}

.skeleton-pill--meta {
    width: 128px;
}

.skeleton-pill--date {
    width: 156px;
}

.skeleton-total-panel {
    display: grid;
    justify-items: end;
    gap: 0.45rem;
}

.skeleton-total-number {
    width: 56px;
    height: 34px;
}

.skeleton-total-label {
    width: 116px;
    height: 12px;
}

.skeleton-status-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    border-radius: 10px;
}

.skeleton-line--status-label {
    width: 132px;
}

.skeleton-line--status-count {
    width: 42px;
    height: 24px;
}

.skeleton-line--records-title {
    width: 148px;
    height: 18px;
    border-radius: 8px;
}

.skeleton-line--records-subtitle {
    width: 170px;
    height: 10px;
}

.skeleton-refresh {
    width: 34px;
    height: 34px;
    flex: 0 0 auto;
    border-radius: 8px;
}

.participant-table-skeleton {
    overflow-x: auto;
}

.skeleton-table-header,
.skeleton-table-row {
    display: grid;
    grid-template-columns: minmax(190px, 1.35fr) minmax(220px, 1.25fr) minmax(120px, 0.8fr) minmax(160px, 1fr);
    align-items: center;
    gap: 1rem;
    min-width: 640px;
}

.skeleton-table-header {
    padding: 1rem 1.5rem;
    background: #f8fafc;
    border-bottom: 1px solid #edf2f7;
}

.skeleton-table-row {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #edf2f7;
}

.skeleton-table-row:last-child {
    border-bottom: 0;
}

.skeleton-heading {
    width: 72px;
    height: 12px;
}

.skeleton-person-cell {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
}

.skeleton-avatar {
    width: 36px;
    height: 36px;
    flex: 0 0 auto;
    border-radius: 10px;
}

.skeleton-line--person {
    width: min(150px, 72%);
}

.skeleton-line--email {
    width: min(220px, 82%);
}

.skeleton-pill--status {
    width: 96px;
}

.skeleton-line--response {
    width: min(142px, 80%);
}

@keyframes skeleton-shimmer {
    100% {
        transform: translateX(100%);
    }
}

.panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.1rem;
    border-bottom: 1px solid var(--participant-border);
    background: #ffffff;
}

.event-panel {
    position: sticky;
    top: 1rem;
}

.event-list {
    display: grid;
    gap: 0.65rem;
    max-height: calc(100vh - 235px);
    overflow-y: auto;
    padding: 0.75rem;
}

.event-list-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    padding: 0.85rem;
    border: 1px solid transparent;
    border-left: 3px solid transparent;
    border-radius: 10px;
    background: #f8fafc;
    color: inherit;
    text-align: left;
    transition: background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
}

.event-list-item:hover {
    border-color: #cbd5e1;
    border-left-color: var(--participant-primary);
    background: #ffffff;
    transform: translateY(-1px);
}

.event-list-item.active {
    border-color: rgba(33, 100, 119, 0.35);
    border-left-color: var(--participant-primary);
    background: #eef6f8;
}

.event-list-item__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
}

.event-list-item__title {
    color: #0f172a;
    font-size: 0.92rem;
    font-weight: 800;
    line-height: 1.35;
}

.event-list-item__id {
    flex: 0 0 auto;
    color: var(--participant-primary);
    font-size: 0.76rem;
    font-weight: 800;
}

.event-list-item__meta {
    display: grid;
    gap: 0.25rem;
    color: var(--participant-muted);
    font-size: 0.78rem;
}

.event-list-item__meta span,
.selected-event-meta span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
}

.event-empty,
.empty-detail {
    min-height: 260px;
    display: grid;
    place-items: center;
    padding: 2rem;
    text-align: center;
}

.participant-detail {
    display: grid;
    gap: 1rem;
    min-width: 0;
}

.selected-event-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.1rem;
}

.selected-event-main {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-width: 0;
}

.selected-event-icon,
.status-card__icon,
.participant-avatar,
.selected-person-avatar,
.participant-empty__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
}

.selected-event-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    background: var(--participant-primary);
    color: #ffffff;
    font-size: 1.2rem;
}

.selected-event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 1rem;
    color: var(--participant-muted);
    font-size: 0.84rem;
}

.selected-event-total {
    min-width: 132px;
    padding-left: 1rem;
    border-left: 1px solid var(--participant-border);
    text-align: right;
}

.selected-event-total strong {
    display: block;
    color: var(--participant-primary);
    font-size: 1.8rem;
    line-height: 1;
}

.selected-event-total span {
    color: var(--participant-muted);
    font-size: 0.78rem;
    font-weight: 800;
}

.status-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
}

.status-card {
    min-height: 82px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem;
    border: 1px solid var(--participant-border);
    border-bottom: 3px solid transparent;
    border-radius: 12px;
    background: #ffffff;
    color: inherit;
    text-align: left;
    transition: background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
}

.status-card:hover {
    border-color: var(--status-accent);
    transform: translateY(-1px);
}

.status-card.active {
    border-color: rgba(15, 23, 42, 0.08);
    border-bottom-color: var(--status-accent);
    background: var(--status-soft);
}

.status-card__icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: #ffffff;
    color: var(--status-accent);
    font-size: 1.05rem;
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.status-card__label {
    display: block;
    color: var(--participant-muted);
    font-size: 0.78rem;
    font-weight: 800;
}

.status-card strong {
    display: block;
    color: #0f172a;
    font-size: 1.45rem;
    line-height: 1.1;
}

.response-toolbar {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) auto auto;
    align-items: center;
    gap: 0.85rem;
    padding: 0.9rem 1rem;
    overflow: visible;
}

.response-toolbar__person {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.response-toolbar__controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.5rem;
    min-width: 0;
}

.selected-person-avatar {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: var(--participant-primary);
    color: #ffffff;
    font-weight: 800;
}

.status-option {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 42px;
    padding: 0.55rem 0.75rem;
    border: 1px solid var(--participant-border);
    border-radius: 999px;
    background: #ffffff;
    cursor: pointer;
    transition: background-color 0.16s ease, border-color 0.16s ease;
}

.status-option:hover,
.status-option.active {
    border-color: var(--status-accent);
    background: var(--status-soft);
}

.status-option .form-check-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.status-option__icon {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    border-radius: 999px;
    background: #ffffff;
    color: var(--status-accent);
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.status-option__label {
    color: #334155;
    font-size: 0.86rem;
    font-weight: 800;
    white-space: nowrap;
}

.participant-update-btn {
    min-height: 42px;
    border-radius: 10px !important;
    background: var(--participant-primary) !important;
    border: 0 !important;
    box-shadow: 0 6px 14px rgba(33, 100, 119, 0.18) !important;
    white-space: nowrap;
}

.records-panel {
    min-width: 0;
    border-top: 3px solid var(--status-accent);
}

.records-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
}

.records-dot {
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 999px;
    background: var(--status-accent);
    box-shadow: 0 0 0 4px var(--status-soft);
}

.participant-person {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
    max-width: clamp(180px, 22vw, 280px);
}

.participant-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #eef6f8;
    color: var(--participant-primary);
    font-size: 0.82rem;
    font-weight: 800;
}

.participant-person__copy {
    display: grid;
    min-width: 0;
}

.participant-person__name {
    display: block;
    max-width: 100%;
    color: #0f172a;
    font-weight: 800;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.participant-email-cell {
    display: block;
    max-width: clamp(180px, 24vw, 300px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.participant-empty {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    min-height: 112px;
    padding: 1.25rem 1.5rem;
    color: #334155;
}

.participant-empty__icon {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: var(--status-soft);
    color: var(--status-accent);
}

:deep(.base-table-wrap) {
    border-radius: 0;
}

:deep(.base-table__header-cell) {
    background: #f8fafc !important;
    color: var(--participant-muted) !important;
    font-size: 0.72rem;
    letter-spacing: 0;
}

:deep(.base-table__cell) {
    border-color: #edf2f7;
    color: #334155;
}

:deep(.base-table tbody tr:hover) {
    background: #f7fdff;
}

:deep(.badge) {
    padding: 0.48rem 0.7rem;
    border-radius: 999px;
    font-weight: 800;
}

:deep(.btn.active) {
    background: var(--participant-primary) !important;
    color: #ffffff !important;
    border-color: var(--participant-primary) !important;
}

@media (max-width: 1199.98px) {
    .participant-layout {
        grid-template-columns: 1fr;
    }

    .event-panel {
        position: static;
    }

    .event-list {
        max-height: 360px;
    }

    .response-toolbar {
        grid-template-columns: 1fr;
    }

    .response-toolbar__controls {
        justify-content: flex-start;
    }
}

@media (max-width: 768px) {
    .participant-page {
        padding: 0.75rem;
    }

    .participant-toolbar {
        align-items: stretch !important;
        padding: 0.9rem;
    }

    .participant-heading {
        align-items: flex-start;
    }

    .participant-toolbar__actions {
        width: 100%;
    }

    .participant-layout,
    .participant-detail {
        gap: 0.75rem;
    }

    .panel-header,
    .selected-event-panel {
        padding: 0.9rem;
    }

    .selected-event-panel {
        grid-template-columns: 1fr;
    }

    .selected-event-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 0;
        padding: 0.75rem 0 0;
        border-top: 1px solid var(--participant-border);
        border-left: 0;
        text-align: left;
    }

    .status-grid {
        grid-template-columns: 1fr;
    }

    .response-toolbar__controls {
        display: grid;
        grid-template-columns: 1fr;
    }

    .status-option {
        border-radius: 10px;
    }

    .participant-update-btn {
        width: 100%;
    }

    .event-list {
        max-height: 320px;
    }

    .participant-empty {
        align-items: flex-start;
        flex-direction: column;
        padding: 1rem;
    }

    .skeleton-total-panel {
        justify-items: start;
    }

    .participant-table-skeleton {
        overflow-x: hidden;
    }

    .skeleton-table-header {
        display: none;
    }

    .skeleton-table-row {
        grid-template-columns: 1fr;
        min-width: 0;
        gap: 0.75rem;
        padding: 1rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .skeleton-placeholder::after {
        animation: none;
    }
}
</style>
