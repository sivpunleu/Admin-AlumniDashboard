<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEventStore } from '@/stores/eventStore';
import BaseButton from '@/components/UI/Base/BaseButton.vue';
import BaseTable from '@/components/UI/Base/BaseTable.vue';
import { resolveApiAssetUrl } from '@/config/apiBaseUrl';

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

    const listEvent = store.events.find((event) => String(event.id) === eventId);
    const detailEvent = store.selectedEvent?.event || store.selectedEvent?.item || store.selectedEvent;
    const detailEventId = detailEvent?.id ?? detailEvent?.eventId ?? detailEvent?.event_id;
    const hasMatchingDetail = detailEvent && String(detailEventId) === eventId;

    if (hasMatchingDetail) {
        return {
            ...(listEvent || {}),
            ...detailEvent
        };
    }

    return listEvent || null;
});

const readDisplayName = (value) => {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object') return '';

    return [
        value.profile?.fullname,
        value.profile?.fullName,
        value.profile?.name,
        value.fullname,
        value.fullName,
        value.name,
        value.username,
        value.email
    ]
        .map(readDisplayName)
        .find(Boolean) || '';
};

const getEventCreatorName = (event) => {
    const name = [
        event?.poster,
        event?.creator,
        event?.createdBy,
        event?.created_by,
        event?.createdByUser,
        event?.created_by_user,
        event?.author,
        event?.owner,
        event?.admin,
        event?.user,
        event?.creatorName,
        event?.createdByName,
        event?.created_by_name,
        event?.createdByFullName,
        event?.created_by_fullname
    ]
        .map(readDisplayName)
        .find(Boolean);

    return name || '-';
};

const selectedEventCreatorName = computed(() => getEventCreatorName(selectedEvent.value));

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

const participantAvatarKeys = [
    'avatar',
    'avatarUrl',
    'avatar_url',
    'profileImage',
    'profile_image',
    'profilePhoto',
    'profile_photo',
    'image',
    'imageUrl',
    'image_url',
    'photo',
    'photoUrl',
    'photo_url',
    'picture',
    'pictureUrl',
    'picture_url'
];

const participantAvatarObjectKeys = ['url', 'path', 'src', 'href', 'location'];

const normalizeParticipantAvatarValue = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value !== 'object') return '';

    return participantAvatarObjectKeys
        .map((key) => normalizeParticipantAvatarValue(value?.[key]))
        .find(Boolean) || '';
};

const pickParticipantAvatarValue = (source) => {
    if (!source || typeof source !== 'object') return '';

    return participantAvatarKeys
        .map((key) => normalizeParticipantAvatarValue(source?.[key]))
        .find(Boolean) || '';
};

const getParticipantAvatar = (participant) => {
    const rawAvatar = [
        participant?.user?.profile,
        participant?.user,
        participant?.profile,
        participant
    ]
        .map(pickParticipantAvatarValue)
        .find(Boolean);

    return rawAvatar ? resolveApiAssetUrl(rawAvatar) : '';
};

const handleParticipantAvatarError = (event) => {
    event.target.style.display = 'none';
};

const handleParticipantAvatarLoad = (event) => {
    event.target.style.display = '';
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
                    title="ត្រឡប់ក្រោយ" aria-label="ត្រឡប់ក្រោយ">
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
                        <p class="text-muted mb-0 small">ព័ត៌មានអ្នកចូលរួមនឹងបង្ហាញនៅទីនេះបន្ទាប់ពីជ្រើសរើសព្រឹត្តិការណ៍។</p>
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
                                        <span class="selected-event-meta__item">
                                            <i class="bi bi-hash"></i>
                                            <span class="selected-event-meta__value">{{ selectedEventId }}</span>
                                        </span>
                                        <span class="selected-event-meta__item" :title="selectedEvent?.location || '-'">
                                            <i class="bi bi-geo-alt"></i>
                                            <span class="selected-event-meta__value">{{ selectedEvent?.location || '-' }}</span>
                                        </span>
                                        <span class="selected-event-meta__item" :title="selectedEventCreatorName">
                                            <i class="bi bi-person"></i>
                                            <span class="selected-event-meta__value">{{ selectedEventCreatorName }}</span>
                                        </span>
                                        <span class="selected-event-meta__item" :title="`ចាប់ផ្តើម ${formatDateTime(selectedEvent?.startDate)}`">
                                            <i class="bi bi-calendar-event"></i>
                                            <span class="selected-event-meta__value">ចាប់ផ្តើម {{ formatDateTime(selectedEvent?.startDate) }}</span>
                                        </span>
                                        <span class="selected-event-meta__item" :title="`បញ្ចប់ ${formatDateTime(selectedEvent?.endDate)}`">
                                            <i class="bi bi-calendar-check"></i>
                                            <span class="selected-event-meta__value">បញ្ចប់ {{ formatDateTime(selectedEvent?.endDate) }}</span>
                                        </span>
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
                                        <p class="text-muted small mb-0">{{ activeParticipantCount }} អ្នកក្នុងស្ថានភាពនេះ</p>
                                    </div>
                                </div>
                                <BaseButton @click="queryParticipantRecords" variant="light" size="sm" shape="sharp"
                                    title="ធ្វើបច្ចុប្បន្នភាព" aria-label="ធ្វើបច្ចុប្បន្នភាព">
                                    <i class="bi bi-arrow-clockwise"></i>
                                </BaseButton>
                            </div>

                            <BaseTable :columns="participantColumns" :data="activeParticipantRows" min-width="640px">
                                <template #cell-name="{ item }">
                                    <div class="participant-person">
                                        <span class="participant-avatar">
                                            <span>{{ getParticipantInitial(item) }}</span>
                                            <img v-if="getParticipantAvatar(item)" :src="getParticipantAvatar(item)"
                                                :alt="getParticipantName(item)" class="participant-avatar__image"
                                                @error="handleParticipantAvatarError"
                                                @load="handleParticipantAvatarLoad" />
                                        </span>
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
    --participant-primary-hover: #174c59;
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

/* Toolbar */
.participant-toolbar {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
    padding: 1rem 1.25rem;
    border: 1px solid var(--participant-border);
    border-radius: 8px;
    background: var(--participant-surface);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.participant-heading {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    min-width: 0;
}

.participant-back {
    width: 38px;
    height: 38px;
    padding: 0 !important;
    border-radius: 8px !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    background: #f8fafc !important;
    color: var(--participant-primary) !important;
    flex: 0 0 auto;
}

.participant-heading h3 {
    color: #0f172a;
    letter-spacing: 0;
}

.breadcrumb {
    font-size: 0.82rem;
}

/* Select */
.participant-toolbar__actions {
    width: clamp(280px, 35vw, 470px);
}

.participant-select-wrap {
    position: relative;
    width: 100%;
    min-width: 0;
}

.participant-select-wrap__icon {
    position: absolute;
    top: 50%;
    left: 16px;
    color: var(--participant-primary);
    transform: translateY(-50%);
    z-index: 2;
    pointer-events: none;
}

.participant-event-select {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    padding-left: 2.8rem !important;
    padding-right: 2.5rem !important;
    border-radius: 999px;
    border: 1px solid var(--participant-border);
    font-weight: 700;
    color: #0f172a;
    background-color: #fff;
    box-shadow: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.participant-event-select:focus {
    border-color: var(--participant-primary);
    box-shadow: 0 0 0 4px rgba(33, 100, 119, 0.12);
}

/* Alert */
.participant-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    padding: 0.9rem 1rem;
    border-radius: 8px;
    font-weight: 700;
}

.participant-alert i {
    flex: 0 0 auto;
}

.participant-alert--danger {
    background: #fff1f2;
    color: #9f1239;
    border: 1px solid #fecdd3;
}

.participant-alert--success {
    background: #f0fdf4;
    color: #166534;
    border: 1px solid #bbf7d0;
}

/* Panels */
.participant-detail {
    display: grid;
    gap: 1rem;
}

.participant-panel {
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--participant-border);
    background: var(--participant-surface);
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

/* Empty */
.empty-detail {
    min-height: 300px;
    display: grid;
    place-items: center;
    padding: 2rem;
    text-align: center;
}

.app-state__icon {
    width: 76px;
    height: 76px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    border-radius: 8px;
    background: linear-gradient(135deg, #216477, #37a0b7);
    color: #fff;
    font-size: 2rem;
    box-shadow: 0 10px 24px rgba(33, 100, 119, 0.2);
}

/* Selected Event */
.selected-event-panel {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    padding: 1.15rem;
}

.selected-event-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;
}

.selected-event-main > .min-w-0 {
    flex: 1;
}

.selected-event-icon {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    background: var(--participant-primary);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.35rem;
    box-shadow: 0 8px 18px rgba(33, 100, 119, 0.18);
}

.selected-event-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    min-width: 0;
    color: var(--participant-muted);
    font-size: 0.84rem;
}

.selected-event-meta__item {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    max-width: min(100%, 360px);
    min-width: 0;
    padding: 0.35rem 0.65rem;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #edf2f7;
}

.selected-event-meta__item i {
    flex: 0 0 auto;
    color: var(--participant-primary);
}

.selected-event-meta__value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.selected-event-total {
    min-width: 145px;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    background: #f8fafc;
    border: 1px solid var(--participant-border);
}

.selected-event-total strong {
    display: block;
    color: var(--participant-primary);
    font-size: 2.1rem;
    line-height: 1;
}

.selected-event-total span {
    color: var(--participant-muted);
    font-size: 0.78rem;
    font-weight: 800;
}

/* Status cards */
.status-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
}

.status-card {
    position: relative;
    min-height: 94px;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1rem;
    border: 1px solid var(--participant-border);
    border-radius: 8px;
    background: #fff;
    color: inherit;
    text-align: left;
    overflow: hidden;
    transition: 0.18s ease;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
}

.status-card::after {
    content: "";
    position: absolute;
    inset: auto 0 0 0;
    height: 4px;
    background: var(--status-accent);
    transform: scaleX(0);
    transform-origin: left;
    transition: 0.18s ease;
}

.status-card:hover {
    transform: translateY(-1px);
    border-color: var(--status-accent);
}

.status-card.active {
    background: var(--status-soft);
    border-color: rgba(15, 23, 42, 0.06);
}

.status-card.active::after {
    transform: scaleX(1);
}

.status-card__icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: #fff;
    color: var(--status-accent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.15rem;
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.07);
}

.status-card__label {
    display: block;
    color: var(--participant-muted);
    font-size: 0.78rem;
    font-weight: 800;
}

.status-card > span:last-child {
    min-width: 0;
}

.status-card strong {
    color: #0f172a;
    font-size: 1.65rem;
}

/* Records */
.records-panel {
    border-top: 4px solid var(--status-accent);
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 1.15rem;
    border-bottom: 1px solid var(--participant-border);
    background: #fff;
}

.records-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.records-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: var(--status-accent);
    box-shadow: 0 0 0 6px var(--status-soft);
}

/* Person */
.participant-person {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-width: 0;
    max-width: clamp(180px, 22vw, 280px);
}

.participant-avatar {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    background: #eef7fa;
    color: var(--participant-primary);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    overflow: hidden;
    position: relative;
    flex: 0 0 auto;
}

.participant-avatar__image {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.participant-person__copy {
    min-width: 0;
}

.participant-person__name,
.participant-email-cell {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.participant-email-cell {
    max-width: clamp(180px, 24vw, 300px);
}

/* Empty table */
.participant-empty {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 1.4rem;
    min-height: 120px;
}

.participant-empty__icon {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--status-soft);
    color: var(--status-accent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

/* Table deep */
:deep(.base-table-wrap) {
    border-radius: 0;
}

:deep(.base-table__header-cell) {
    background: #f8fafc !important;
    color: #64748b !important;
    font-size: 0.72rem;
    text-transform: uppercase;
}

:deep(.base-table__cell) {
    border-color: #edf2f7;
    color: #334155;
}

:deep(.base-table tbody tr) {
    transition: 0.15s ease;
}

:deep(.base-table tbody tr:hover) {
    background: #f7fdff;
}

:deep(.badge) {
    padding: 0.5rem 0.75rem;
    border-radius: 999px;
    font-weight: 900;
}

/* Skeleton keep simple */
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .7), transparent);
    animation: skeleton-shimmer 1.35s ease-in-out infinite;
}

.participant-skeleton {
    display: grid;
    gap: 1rem;
}

.skeleton-event-icon {
    width: 52px;
    height: 52px;
    flex: 0 0 auto;
    border-radius: 8px;
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
    width: 96px;
    height: 10px;
}

.skeleton-line--title {
    width: min(320px, 78%);
    height: 22px;
    border-radius: 8px;
}

.skeleton-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    min-width: 0;
}

.skeleton-pill {
    height: 24px;
}

.skeleton-pill--small {
    width: 56px;
}

.skeleton-pill--meta {
    width: 130px;
}

.skeleton-pill--date {
    width: 168px;
}

.skeleton-total-panel {
    display: grid;
    justify-items: center;
    gap: 0.45rem;
}

.skeleton-total-number {
    width: 58px;
    height: 34px;
    border-radius: 8px;
}

.skeleton-total-label {
    width: 112px;
    height: 12px;
}

.skeleton-status-card {
    --status-accent: var(--participant-primary);
    --status-soft: var(--participant-soft);
    pointer-events: none;
}

.skeleton-status-card:hover {
    transform: none;
}

.skeleton-status-card::after {
    transform: scaleX(1);
}

.skeleton-status-icon {
    width: 48px;
    height: 48px;
    flex: 0 0 auto;
    border-radius: 8px;
}

.skeleton-line--status-label {
    width: 136px;
}

.skeleton-line--status-count {
    width: 44px;
    height: 24px;
    border-radius: 8px;
}

.skeleton-line--records-title {
    width: 148px;
    height: 18px;
    border-radius: 8px;
}

.skeleton-line--records-subtitle {
    width: 176px;
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
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
    border-radius: 8px;
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

/* Responsive */
@media (max-width: 768px) {
    .participant-page {
        padding: 0.75rem;
    }

    .participant-toolbar {
        align-items: stretch;
        border-radius: 8px;
    }

    .participant-toolbar__actions {
        width: 100%;
    }

    .selected-event-panel {
        grid-template-columns: 1fr;
    }

    .selected-event-total {
        width: 100%;
    }

    .status-grid {
        grid-template-columns: 1fr;
    }

    .panel-header {
        align-items: center;
    }

    .selected-event-meta__item {
        max-width: 100%;
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

    .skeleton-placeholder::after,
    .status-card,
    .status-card::after {
        animation: none;
        transition: none;
    }
}
</style>
