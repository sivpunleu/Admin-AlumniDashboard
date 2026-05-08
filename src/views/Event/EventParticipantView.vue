<script setup>
import { ref, onMounted, watch } from 'vue';
import { useEventStore } from '@/stores/eventStore';

const props = defineProps(['id']); // ទទួល Event ID ពី Router
const store = useEventStore();
const activeStatus = ref('attending'); // ស្ថានភាពលំនាំដើមតាម Flowchart

const statuses = [
    { value: 'attending', label: 'នឹងចូលរួម', color: 'text-success', bg: 'bg-success' },
    { value: 'interested', label: 'ចាប់អារម្មណ៍', color: 'text-info', bg: 'bg-info' },
    { value: 'declined', label: 'មិនចូលរួម', color: 'text-danger', bg: 'bg-danger' }
];

const loadParticipants = () => {
    // ហៅ API GET /events/{id}/participants?status=...
    store.fetchParticipants(props.id, activeStatus.value);
};

onMounted(loadParticipants);

// តាមដានការប្តូរ Tab ដើម្បីទាញទិន្នន័យថ្មី (Query Participant Records)
watch(activeStatus, loadParticipants);

const getStatusBadge = (status) => {
    const s = statuses.find(item => item.value === status);
    return s ? `badge ${s.bg} bg-opacity-10 ${s.color}` : 'badge bg-secondary';
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

    if (typeof candidate !== 'string') return '';
    const trimmed = candidate.trim();
    return trimmed || '';
};

const getParticipantEmail = (participant) => {
    const candidate = participant?.user?.email || participant?.email;
    if (typeof candidate !== 'string') return '-';
    const trimmed = candidate.trim();
    return trimmed || '-';
};

const getParticipantAvatar = (participant) => {
    const avatar = participant?.user?.profile?.avatar;
    return typeof avatar === 'string' && avatar.trim() ? avatar : '';
};

const getParticipantInitial = (participant) => {
    const name = getParticipantName(participant);
    return name ? name.charAt(0).toUpperCase() : '';
};

const formatResponseDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('km-KH');
};

const formatStatus = (status) => (status || 'unknown').toUpperCase();

const getResponseAt = (participant) => participant?.updatedAt || participant?.createdAt;
</script>

<template>
    <div class="p-4 bg-light min-vh-100">
        <div class="mb-4 d-flex align-items-center">
            <button @click="$router.back()" class="btn btn-white shadow-sm rounded-circle me-3">
                <i class="bi bi-arrow-left"></i>
            </button>
            <h4 class="fw-bold mb-0" style="color: #216477;">បញ្ជីអ្នកចូលរួមព្រឹត្តិការណ៍</h4>
        </div>

        <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
            <div class="card-header bg-white border-bottom p-0">
                <div class="d-flex nav-tabs-custom">
                    <button v-for="s in statuses" :key="s.value" @click="activeStatus = s.value" :class="['flex-grow-1 py-3 border-0 bg-transparent fw-bold transition-all',
                        activeStatus === s.value ? 'active-tab ' + s.color : 'text-muted']">
                        {{ s.label }}
                    </button>
                </div>
            </div>

            <div class="card-body p-4">
                <div v-if="store.isLoading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-2 text-muted small">កំពុងទាញយកទិន្នន័យ...</p>
                </div>

                <div v-else>
                    <div class="table-responsive" v-if="store.participants.length > 0">
                        <table class="table align-middle">
                            <thead class="small text-muted text-uppercase">
                                <tr>
                                    <th>ឈ្មោះអ្នកចូលរួម</th>
                                    <th>អ៊ីមែល</th>
                                    <th>ថ្ងៃឆ្លើយតប</th>
                                    <th class="text-end">ស្ថានភាព</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="p in store.participants" :key="p.id">
                                    <td>
                                        <div class="d-flex align-items-center gap-2">
                                            <div
                                                class="avatar-sm rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-primary">
                                                <img v-if="getParticipantAvatar(p)" :src="getParticipantAvatar(p)"
                                                    alt="avatar" class="avatar-img rounded-circle">
                                                <span v-else>{{ getParticipantInitial(p) }}</span>
                                            </div>
                                            <span v-if="getParticipantName(p)" class="fw-semibold">{{
                                                getParticipantName(p) }}</span>
                                        </div>
                                    </td>
                                    <td class="text-muted">{{ getParticipantEmail(p) }}</td>
                                    <td class="text-muted small">
                                        {{ formatResponseDate(getResponseAt(p)) }}
                                    </td>
                                    <td class="text-end">
                                        <span :class="getStatusBadge(p.status)" style="font-size: 0.7rem;">
                                            {{ formatStatus(p.status) }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else class="text-center py-5">
                        <i class="bi bi-people text-muted opacity-25" style="font-size: 3rem;"></i>
                        <p class="mt-3 text-muted">មិនទាន់មានអ្នកឆ្លើយតប "{{ activeStatus }}" នៅឡើយទេ។</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.active-tab {
    border-bottom: 3px solid currentColor !important;
    background-color: rgba(0, 0, 0, 0.02) !important;
}

.transition-all {
    transition: all 0.2s ease-in-out;
}

.avatar-sm {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.btn-white {
    background: white;
    border: none;
    width: 40px;
    height: 40px;
}

.nav-tabs-custom button:hover:not(.active-tab) {
    background-color: #f8fafc;
}
</style>