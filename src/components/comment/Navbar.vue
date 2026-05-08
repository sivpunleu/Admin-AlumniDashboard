<template>
    <nav class="navbar navbar-expand-lg border-bottom px-4 fixed-top py-2 glass-navbar"
        :class="{ shifted: sidebarOpen }">
        <div class="container-fluid p-0">
            <div class="d-flex align-items-center">
                <button class="btn btn-menu border-0 me-3 rounded-circle shadow-sm" type="button"
                    @click="emit('toggleSidebar')">
                    <i class="bi bi-list fs-5"></i>
                </button>
                <div class="d-none d-md-block breadcrumb-wrap">
                    <span class="text-muted small fw-medium opacity-75">Portal Management</span>
                    <i class="bi bi-chevron-right mx-5 text-muted opacity-50 small fs-5"></i>
                    <span :style="{ color: PRIMARY_COLOR }" class="fw-bold section-title small">{{ sectionTitle }}</span>
                </div>
            </div>

            <div class="ms-auto d-flex align-items-center gap-2 gap-md-3">
                <div class="d-none d-lg-flex align-items-center position-relative search-wrapper">
                    <i class="bi bi-search position-absolute ms-3 text-muted"></i>
                    <input type="text" class="form-control search-input border-0 rounded-pill ps-5 py-2"
                        placeholder="ស្វែងរកទីនេះ...">
                </div>

                <div class="dropdown">
                    <button class="btn btn-tool border-0 rounded-circle position-relative p-2" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <i class="bi bi-bell text-muted fs-5"></i>
                        <span class="notification-badge"></span>
                    </button>
                    <ul
                        class="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-4 mt-3 py-3 notification-dropdown">
                        <li class="px-3 mb-2 d-flex justify-content-between align-items-center">
                            <h6 class="fw-bold mb-0 small">ការជូនដំណឹង</h6>
                            <a href="#" class="extra-small text-decoration-none"
                                :style="{ color: PRIMARY_COLOR }">មើលទាំងអស់</a>
                        </li>
                        <li>
                            <hr class="dropdown-divider opacity-50" />
                        </li>
                        <li class="px-2">
                            <a href="#" class="dropdown-item rounded-3 py-2 d-flex gap-3">
                                <div class="icon-circle bg-soft-teal text-teal">
                                    <i class="bi bi-calendar-event"></i>
                                </div>
                                <div>
                                    <div class="fw-bold small">ព្រឹត្តិការណ៍ថ្មី</div>
                                    <div class="extra-small text-muted">Alumni Night 2026 ត្រូវបានបង្កើត</div>
                                </div>
                            </a>
                        </li>
                    </ul>
                </div>

                <div class="dropdown">
                    <a class="d-flex align-items-center text-decoration-none dropdown-toggle profile-trigger p-1 rounded-pill"
                        href="#" role="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <div class="avatar-container">
                            <img :src="avatarUrl" alt="profile" class="profile-img-nav shadow-sm"
                                @error="handleAvatarError" @load="handleAvatarLoad" />
                        </div>
                        <span class="d-none d-lg-inline-block fw-bold small ms-2 me-2">{{ displayName }}</span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-4 mt-3 py-2 overflow-hidden"
                        aria-labelledby="profileDropdown">
                        <li class="px-4 py-3 bg-light border-bottom mb-2">
                            <div class="fw-bold text-dark small">{{ displayName }}</div>
                            <div class="text-muted extra-small text-truncate">{{ currentUser.email || "no-email@ams.com"
                                }}</div>
                        </li>
                        <li>
                            <router-link class="dropdown-item py-2" to="/profile">
                                <i class="bi bi-person-badge me-2"></i>គណនីផ្ទាល់ខ្លួន
                            </router-link>
                        </li>
                        <li>
                            <hr class="dropdown-divider opacity-50" />
                        </li>
                        <li>
                            <a class="dropdown-item py-2 text-danger fw-medium" href="#" @click.prevent="handleLogout">
                                <i class="bi bi-box-arrow-right me-2"></i>ចាកចេញពីប្រព័ន្ធ
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "@/stores/useAuth";
import { useProfileStore } from "@/stores/useProfile";

const PRIMARY_COLOR = '#216477';
const props = defineProps({
    sidebarOpen: {
        type: Boolean,
        default: true,
    },
});
const emit = defineEmits(["toggleSidebar"]);
const authStore = useAuthStore();
const profileStore = useProfileStore();
const route = useRoute();

const avatarVersion = ref(0);
const avatarLoadError = ref(false);

const currentUser = computed(() => profileStore.profile || authStore.getUser || {});
const currentProfile = computed(() => currentUser.value?.profile || currentUser.value || {});

const displayName = computed(() => {
    const user = currentUser.value;
    const profile = currentProfile.value;
    return profile.fullname || user.fullName || user.fullname || user.username || profile.name || "Admin";
});

const sectionTitle = computed(() => {
    const title = route.meta?.title || "DASHBOARD";
    const translations = {
        'EVENT': 'គ្រប់គ្រងព្រឹត្តិការណ៍',
        'PROFILE': 'កម្រងរូបភាព',
        'DEPARTMENT': 'ដេប៉ាតឺម៉ង់',
        'DASHBOARD': 'ផ្ទាំងគ្រប់គ្រង'
    };
    return translations[title.toUpperCase()] || title;
});

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "https://ant-g2-ams.tt.linkpc.net/api/v1").replace(/\/+$/, "");

const resolveAvatarUrl = (rawUrl) => {
    if (!rawUrl || typeof rawUrl !== "string") return "";
    const trimmed = rawUrl.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    try {
        const origin = new URL(apiBaseUrl).origin;
        if (trimmed.startsWith("/")) return `${origin}${trimmed}`;
        return `${apiBaseUrl}/${trimmed}`;
    } catch { return ""; }
};

const defaultAvatar = computed(
    () => `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=216477&color=fff&size=128`,
);

const avatarUrl = computed(() => {
    if (avatarLoadError.value) return defaultAvatar.value;
    const user = currentUser.value;
    const profile = currentProfile.value;
    const raw = profile.avatar || profile.avatarUrl || profile.avatar_url || profile.image || user.avatar || user.avatarUrl || user.avatar_url || user.image || "";
    const resolved = resolveAvatarUrl(raw);
    const url = resolved || defaultAvatar.value;
    return `${url}${url.includes("?") ? "&" : "?"}v=${avatarVersion.value}`;
});

const handleAvatarError = () => { avatarLoadError.value = true; };
const handleAvatarLoad = () => { avatarLoadError.value = false; };

watch(
    () => [
        profileStore.profile?.avatar,
        profileStore.profile?.avatarUrl,
        profileStore.profile?.avatar_url,
        profileStore.profile?.image,
        profileStore.profile?.profile?.avatar,
        profileStore.profile?.profile?.avatarUrl,
        profileStore.profile?.profile?.avatar_url,
        profileStore.profile?.profile?.image,
        authStore.user?.avatar,
        authStore.user?.avatarUrl,
        authStore.user?.avatar_url,
        authStore.user?.image,
        authStore.user?.profile?.avatar,
        authStore.user?.profile?.avatarUrl,
        authStore.user?.profile?.avatar_url,
        authStore.user?.profile?.image,
    ],
    () => {
        avatarLoadError.value = false;
        avatarVersion.value += 1;
    },
);

const handleLogout = () => authStore.logout();
</script>

<style scoped>
/* Glassmorphism Navbar */
.glass-navbar {
    background-color: rgba(255, 255, 255, 0.85) !important;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    left: 260px;
    width: calc(100% - 260px);
    transition: left 0.3s ease, width 0.3s ease;
    z-index: 1025;
}

.glass-navbar.shifted {
    left: 0;
    width: 100%;
}

.section-title {
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 0.5px;
}

/* Button & Tool Styles */
.btn-menu {
    width: 42px;
    height: 42px;
    background-color: #212529;
    color: white;
    transition: 0.3s;
}

.btn-menu:hover {
    background-color: #000;
    transform: scale(1.05);
}

.btn-tool {
    background-color: #f8fafc;
    transition: 0.2s;
}

.btn-tool:hover {
    background-color: #f1f5f9;
}

/* Notification Badge */
.notification-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 10px;
    height: 10px;
    background-color: #ef4444;
    border: 2px solid white;
    border-radius: 50%;
}

/* Search Bar */
.search-wrapper .search-input {
    background-color: #f1f5f9;
    width: 200px;
    transition: all 0.3s ease;
    font-size: 0.85rem;
}

.search-wrapper .search-input:focus {
    width: 280px;
    background-color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Profile Dropdown */
.profile-trigger {
    border: 1.5px solid #f1f5f9;
    transition: 0.2s;
}

.profile-trigger:hover {
    background-color: #f8fafc;
}

.profile-img-nav {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    object-fit: cover;
}

/* Dropdown Menu Customization */
.dropdown-menu {
    min-width: 240px;
    animation: slideUp 0.3s ease-out;
}

.dropdown-item {
    font-size: 14px;
    padding: 10px 20px;
    transition: 0.2s;
}

.dropdown-item:hover {
    background-color: #f0f7f9;
    color: #216477;
    transform: translateX(5px);
}

.extra-small {
    font-size: 10px;
}

/* Notification Item Helpers */
.notification-dropdown {
    width: 300px;
}

.icon-circle {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.bg-soft-teal {
    background-color: rgba(33, 100, 119, 0.1);
}

.text-teal {
    color: #216477;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 991.98px) {
    .glass-navbar {
        left: 0;
        width: 100%;
    }
}
</style>