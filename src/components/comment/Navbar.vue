<!-- Navbar.vue -->
<template>
    <nav class="navbar glass-navbar border-bottom fixed-top px-4 py-2" :class="{ shifted: !sidebarOpen }">
        <div class="container-fluid p-0">

            <!-- Left -->
            <div class="d-flex align-items-center">

                <button class="btn btn-menu border-0 me-3" @click="emit('toggleSidebar')">
                    <i class="bi bi-list fs-4"></i>
                </button>

                <div class="d-none d-md-flex align-items-center">
                    <span class="section-title fw-bold">
                        {{ sectionTitle }}
                    </span>
                </div>

            </div>

            <!-- Right -->
            <div class="d-flex align-items-center gap-3">

                <!-- Notifications -->
                <div class="dropdown">
                    <button type="button" class="notification-trigger" data-bs-toggle="dropdown"
                        aria-label="ការជូនដំណឹង">
                        <i class="bi bi-bell"></i>
                        <span v-if="notificationCount" class="notification-badge">
                            {{ notificationCount > 9 ? '9+' : notificationCount }}
                        </span>
                    </button>

                    <div class="dropdown-menu dropdown-menu-end notification-menu border-0 shadow rounded-4">
                        <div class="notification-header">
                            <div>
                                <h6 class="fw-bold mb-0">ការជូនដំណឹង</h6>
                                <p class="text-muted extra-small mb-0">{{ notificationCount }} ថ្មី</p>
                            </div>
                            <button type="button" class="btn btn-sm btn-light rounded-pill" @click="fetchNotifications">
                                <i class="bi bi-arrow-clockwise"></i>
                            </button>
                        </div>

                        <div v-if="isNotificationLoading" class="notification-empty">
                            <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
                            <span class="small text-muted ms-2">កំពុងផ្ទុក...</span>
                        </div>

                        <template v-else>
                            <div v-if="!notifications.length" class="notification-empty">
                                <i class="bi bi-check2-circle"></i>
                                <p class="small text-muted mb-0">មិនមានការជូនដំណឹងថ្មីទេ</p>
                            </div>

                            <template v-else>
                                <router-link v-for="notification in notifications" :key="notification.id"
                                    class="notification-item text-decoration-none" :to="notification.to">
                                    <span :class="['notification-icon', `notification-icon--${notification.tone}`]">
                                        <i :class="['bi', notification.icon]"></i>
                                    </span>
                                    <span class="notification-copy">
                                        <span class="fw-semibold text-dark">{{ notification.title }}</span>
                                        <span class="text-muted extra-small">{{ notification.description }}</span>
                                    </span>
                                </router-link>
                            </template>
                        </template>
                    </div>
                </div>

                <!-- Profile -->
                <div class="dropdown">

                    <a href="#" class="profile-trigger d-flex align-items-center text-decoration-none"
                        data-bs-toggle="dropdown">

                        <img :src="avatarUrl" alt="profile" class="profile-img-nav" @error="handleAvatarError"
                            @load="handleAvatarLoad" />

                        <span class="d-none d-lg-inline fw-bold small ms-2">
                            {{ displayName }}
                        </span>

                    </a>

                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow rounded-4">

                        <li>
                            <router-link class="dropdown-item py-2" to="/profile">
                                <i class="bi bi-person-badge me-2"></i>
                                គណនីផ្ទាល់ខ្លួន
                            </router-link>
                        </li>

                        <li>
                            <router-link class="dropdown-item py-2" to="/settings">
                                <i class="bi bi-gear me-2"></i>
                                ការកំណត់
                            </router-link>
                        </li>

                        <li>
                            <hr class="dropdown-divider">
                        </li>

                        <li>
                            <a href="#" class="dropdown-item py-2 text-danger" @click.prevent="handleLogout">
                                <i class="bi bi-box-arrow-right me-2"></i>
                                ចាកចេញ
                            </a>
                        </li>

                    </ul>

                </div>

            </div>
        </div>
    </nav>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/useAuth";
import { useProfileStore } from "@/stores/useProfile";
import api from "@/API/api";
import logger from "@/utils/logger";

defineProps({
    sidebarOpen: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(["toggleSidebar"]);

const authStore = useAuthStore();
const profileStore = useProfileStore();
const route = useRoute();

const avatarLoadError = ref(false);
const isNotificationLoading = ref(false);
const notifications = ref([]);
const NOTIFICATION_REFRESH_INTERVAL = 60000;
let notificationRefreshTimer = null;

const notificationCount = computed(() => notifications.value.length);

const normalizeCollection = (response) => {
    const payload = response.data?.data || response.data || {};
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload)) return payload;
    return [];
};

const normalizeStatus = (value) => String(value || "PENDING").toUpperCase();

const getUserStatus = (user) => {
    const status = normalizeStatus(
        user?.profile?.status ||
        user?.status ||
        (user?.isVerifyEmail ? "APPROVE" : "PENDING")
    );

    if (status === "REJECT" || status === "DEACTIVATED") return "DEACTIVATED";
    return status;
};

const fetchNotifications = async () => {
    if (isNotificationLoading.value) return;

    try {
        isNotificationLoading.value = true;
        const [usersResponse, eventsResponse] = await Promise.all([
            api.get("/users", { params: { _page: 1, _per_page: 100 } }),
            api.get("/events", { params: { _page: 1, _per_page: 100 } }),
        ]);

        const users = normalizeCollection(usersResponse);
        const events = normalizeCollection(eventsResponse);
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const pendingUsers = users.filter((user) => getUserStatus(user) === "PENDING");
        const upcomingEvents = events
            .filter((event) => {
                const eventDate = new Date(event.startDate || event.start_date || event.date);
                return !Number.isNaN(eventDate.getTime()) && eventDate >= now && eventDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.startDate || a.start_date || a.date) - new Date(b.startDate || b.start_date || b.date));

        notifications.value = [
            ...(pendingUsers.length
                ? [{
                    id: "pending-users",
                    title: `${pendingUsers.length} អ្នកប្រើប្រាស់កំពុងរង់ចាំ`,
                    description: "ចូលទៅពិនិត្យ និងអនុម័តគណនីថ្មី",
                    icon: "bi-person-check",
                    tone: "warning",
                    to: "/manager-alumni",
                }]
                : []),
            ...upcomingEvents.slice(0, 3).map((event) => ({
                id: `event-${event.id}`,
                title: event.title || "ព្រឹត្តិការណ៍ជិតមកដល់",
                description: event.location || "ចុចដើម្បីមើលអ្នកចូលរួម",
                icon: "bi-calendar-event",
                tone: "primary",
                to: { name: "participant", params: { id: event.id } },
            })),
        ];
    } catch (error) {
        logger.error("Error loading notifications:", error);
        notifications.value = [];
    } finally {
        isNotificationLoading.value = false;
    }
};

const normalizedProfile = computed(() => {
    const rawProfile = profileStore.profile || {};
    return rawProfile?.profile && typeof rawProfile.profile === "object"
        ? rawProfile.profile
        : rawProfile;
});

const currentUser = computed(() => {
    const profileData = normalizedProfile.value || {};
    const authData = authStore.user || {};
    return Object.keys(profileData).length ? profileData : authData;
});

const displayName = computed(() => {
    const user = currentUser.value;
    return (
        user.fullname ||
        user.name ||
        user.username ||
        "Admin"
    );
});

const avatarUrl = computed(() => {
    if (avatarLoadError.value) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=216477&color=fff&size=128`;
    }
    const user = currentUser.value;
    const rawAvatar = user.avatar || user.avatarUrl || user.avatar_url || user.image;
    if (rawAvatar) {
        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "https://ant-g2-ams.tt.linkpc.net/api/v1").replace(/\/+$/, "");
        if (rawAvatar.startsWith("http")) return rawAvatar;
        return `${apiBaseUrl}/${rawAvatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=216477&color=fff&size=128`;
});

const handleAvatarError = () => {
    avatarLoadError.value = true;
};

const handleAvatarLoad = () => {
    avatarLoadError.value = false;
};

const sectionTitle = computed(() => {
    return route.meta?.title || "Dashboard";
});

const handleLogout = () => {
    authStore.logout();
};

onMounted(() => {
    fetchNotifications();
    notificationRefreshTimer = setInterval(fetchNotifications, NOTIFICATION_REFRESH_INTERVAL);
});

onUnmounted(() => {
    clearInterval(notificationRefreshTimer);
    notificationRefreshTimer = null;
});
</script>

<style scoped>
.glass-navbar {
    background: rgba(255, 255, 255, 0.85);

    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);

    left: 260px;
    width: calc(100% - 260px);

    z-index: 1030;

    transition: all 0.3s ease;
}

/* Full Width */
.glass-navbar.shifted {
    left: 0;
    width: 100%;
}

/* Menu Button */
.btn-menu {
    width: 42px;
    height: 42px;

    border-radius: 50%;

    background: #216477;
    color: white;

    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-menu:hover {
    background: #1b5564;
}

/* Title */
.section-title {
    color: #216477;

    font-size: 14px;

    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Notifications */
.notification-trigger {
    position: relative;
    width: 42px;
    height: 42px;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    background: #ffffff;
    color: #216477;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.2s;
}

.notification-trigger:hover {
    background: #f0f7f9;
    border-color: #216477;
}

.notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: #dc3545;
    color: #ffffff;
    border: 2px solid #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
}

.notification-menu {
    width: min(360px, calc(100vw - 24px));
    padding: 8px;
}

.notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
}

.notification-empty {
    min-height: 96px;
    padding: 18px 12px;
    border-radius: 12px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #216477;
}

.notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    transition: 0.2s;
}

.notification-item:hover {
    background: #f8fafc;
}

.notification-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    background: #f0f7f9;
    color: #216477;
}

.notification-icon--warning {
    background: #fff4e5;
    color: #b45309;
}

.notification-copy {
    display: grid;
    gap: 2px;
    min-width: 0;
}

/* Profile */
.profile-trigger {
    padding: 4px 10px;

    border-radius: 999px;

    transition: 0.2s;
}

.profile-trigger:hover {
    background: #f8fafc;
}

.profile-img-nav {
    width: 36px;
    height: 36px;

    border-radius: 50%;

    object-fit: cover;
}

/* Dropdown */
.dropdown-menu {
    min-width: 220px;
}

.dropdown-item {
    transition: 0.2s;
}

.dropdown-item:hover {
    background: #f0f7f9;
    color: #216477;
}

/* Tablet */
@media (max-width: 991.98px) {
    .glass-navbar {
        left: 0;
        width: 100%;

        padding-left: 1rem !important;
        padding-right: 1rem !important;
    }

}

/* Mobile */
@media (max-width: 575.98px) {
    .glass-navbar {
        padding-top: 0.65rem !important;
        padding-bottom: 0.65rem !important;
    }

    .btn-menu {
        width: 38px;
        height: 38px;
    }

    .profile-img-nav {
        width: 32px;
        height: 32px;
    }

    .section-title {
        font-size: 12px;
    }
}
</style>
